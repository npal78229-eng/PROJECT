import json
from datetime import timedelta
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from accounts.models import Profile
from exams.models import Exam, ExamAttempt, ExamQuestion
from questions.models import Category, Question
from results.models import Response, Result
from results.services import evaluate_attempt


class Day3ExamEngineTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        # Faculty
        self.faculty = User.objects.create_superuser(
            username="faculty_user", email="faculty@uni.edu", password="facultypassword123"
        )

        # Student 1
        self.student = User.objects.create_user(
            username="student_candidate", email="student1@uni.edu", password="studentpassword123"
        )

        # Student 2 (for permission testing)
        self.other_student = User.objects.create_user(
            username="other_student", email="student2@uni.edu", password="studentpassword123"
        )

        # Create Category and 5 questions with various marks
        self.category = Category.objects.create(name="Operating Systems")
        self.questions = []
        answers = [("a", 2), ("b", 3), ("c", 1), ("d", 4), ("a", 2)]
        for i, (ans, mark) in enumerate(answers, 1):
            q = Question.objects.create(
                category=self.category,
                text=f"Question #{i}: Explain topic {i}?",
                option_a=f"Alpha {i}",
                option_b=f"Beta {i}",
                option_c=f"Gamma {i}",
                option_d=f"Delta {i}",
                correct_option=ans,
                marks=mark,
            )
            self.questions.append(q)

        now = timezone.now()
        self.exam = Exam.objects.create(
            title="OS Midterm Examination",
            category=self.category,
            duration_minutes=30,
            total_questions=3,  # Pick 3 out of 5
            passing_marks=5,
            scheduled_start=now - timedelta(minutes=10),
            scheduled_end=now + timedelta(hours=2),
            created_by=self.faculty,
        )

    def test_random_question_selection_and_locking(self):
        self.client.login(username="student_candidate", password="studentpassword123")

        # 1. Start exam
        start_url = reverse("start_exam", args=[self.exam.id])
        response = self.client.get(start_url, follow=True)
        self.assertEqual(response.status_code, 200)

        attempt = ExamAttempt.objects.get(exam=self.exam, student=self.student)
        self.assertEqual(attempt.status, "in_progress")

        # Verify exactly 3 ExamQuestion rows created
        eqs = list(attempt.exam_questions.order_by("order"))
        self.assertEqual(len(eqs), 3)
        self.assertEqual([eq.order for eq in eqs], [1, 2, 3])

        # Verify locked question IDs
        initial_question_ids = [eq.question_id for eq in eqs]
        self.assertEqual(len(set(initial_question_ids)), 3)

        # Verify pre-created empty responses
        resps = Response.objects.filter(attempt=attempt)
        self.assertEqual(resps.count(), 3)
        for r in resps:
            self.assertIsNone(r.selected_option)

        # 2. Re-visit or re-trigger start_exam -> questions must remain LOCKED
        self.client.get(start_url, follow=True)
        attempt.refresh_from_db()
        reloaded_eqs = list(attempt.exam_questions.order_by("order"))
        reloaded_ids = [eq.question_id for eq in reloaded_eqs]
        self.assertEqual(initial_question_ids, reloaded_ids)

    def test_question_privacy_in_exam_room(self):
        self.client.login(username="student_candidate", password="studentpassword123")
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        attempt = ExamAttempt.objects.get(exam=self.exam, student=self.student)

        take_url = reverse("take_exam", args=[attempt.id])
        response = self.client.get(take_url)
        self.assertEqual(response.status_code, 200)

        # The correct_option field must NEVER be leaked to the candidate
        questions_in_context = response.context["questions"]
        for q_data in questions_in_context:
            self.assertNotIn("correct_option", q_data)

    def test_ajax_response_autosaving(self):
        self.client.login(username="student_candidate", password="studentpassword123")
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        attempt = ExamAttempt.objects.get(exam=self.exam, student=self.student)
        first_eq = attempt.exam_questions.first()

        save_url = reverse("save_response", args=[attempt.id])

        # Save an answer 'b'
        payload = json.dumps({"exam_question_id": first_eq.id, "selected_option": "b"})
        response = self.client.post(save_url, payload, content_type="application/json")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "success")
        self.assertEqual(data["answered_count"], 1)

        resp_db = Response.objects.get(attempt=attempt, exam_question=first_eq)
        self.assertEqual(resp_db.selected_option, "b")

        # Clear answer
        clear_payload = json.dumps({"exam_question_id": first_eq.id, "selected_option": ""})
        response2 = self.client.post(save_url, clear_payload, content_type="application/json")
        self.assertEqual(response2.status_code, 200)
        data2 = response2.json()
        self.assertEqual(data2["answered_count"], 0)

        resp_db.refresh_from_db()
        self.assertIsNone(resp_db.selected_option)

    def test_exam_submission_and_automatic_evaluation(self):
        self.client.login(username="student_candidate", password="studentpassword123")
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        attempt = ExamAttempt.objects.get(exam=self.exam, student=self.student)
        eqs = list(attempt.exam_questions.select_related("question").order_by("order"))

        # Answer Q1 correctly, Q2 incorrectly, leave Q3 unanswered
        q1_correct = eqs[0].question.correct_option
        Response.objects.filter(attempt=attempt, exam_question=eqs[0]).update(selected_option=q1_correct)

        wrong_option = "b" if eqs[1].question.correct_option != "b" else "c"
        Response.objects.filter(attempt=attempt, exam_question=eqs[1]).update(selected_option=wrong_option)

        # Q3 remains unanswered

        # Submit exam
        submit_url = reverse("submit_exam", args=[attempt.id])
        response = self.client.post(submit_url, follow=True)
        self.assertEqual(response.status_code, 200)

        attempt.refresh_from_db()
        self.assertEqual(attempt.status, "submitted")
        self.assertIsNotNone(attempt.submitted_at)

        # Check Result record
        result = Result.objects.get(attempt=attempt)
        expected_score = eqs[0].question.marks
        total_possible = sum(eq.question.marks for eq in eqs)
        expected_percentage = round((expected_score / total_possible) * 100, 2)

        self.assertEqual(result.score, expected_score)
        self.assertEqual(result.total_marks, total_possible)
        self.assertEqual(float(result.percentage), expected_percentage)
        self.assertEqual(result.passed, (result.score >= self.exam.passing_marks))

        # Check scorecard page content
        self.assertContains(response, "Examination Scorecard")
        self.assertContains(response, f"{result.score}")

    def test_scorecard_access_permissions(self):
        # Create a submitted attempt and evaluated result
        attempt = ExamAttempt.objects.create(
            exam=self.exam,
            student=self.student,
            ends_at=timezone.now() + timedelta(minutes=20),
            status="submitted",
            submitted_at=timezone.now(),
        )
        evaluate_attempt(attempt)
        scorecard_url = reverse("exam_result", args=[attempt.id])

        # Candidate can view
        self.client.login(username="student_candidate", password="studentpassword123")
        res1 = self.client.get(scorecard_url)
        self.assertEqual(res1.status_code, 200)
        self.assertContains(res1, "Examination Scorecard")

        # Faculty can view
        self.client.login(username="faculty_user", password="facultypassword123")
        res2 = self.client.get(scorecard_url)
        self.assertEqual(res2.status_code, 200)

        # Other student is blocked
        self.client.login(username="other_student", password="studentpassword123")
        res3 = self.client.get(scorecard_url, follow=True)
        self.assertRedirects(res3, reverse("student_dashboard"))
        self.assertContains(res3, "Access denied")
