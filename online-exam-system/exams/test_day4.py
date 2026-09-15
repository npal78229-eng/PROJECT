import json
from datetime import timedelta
from django.contrib.auth.models import User
from django.test import Client, TestCase
from django.urls import reverse
from django.utils import timezone

from exams.models import Exam, ExamAttempt, ExamQuestion
from questions.models import Category, Question
from results.models import Response, Result
from results.services import evaluate_attempt


class Day4SecurityAndReportsTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        # Faculty Admin
        self.faculty = User.objects.create_superuser(
            username="prof_sharma", email="sharma@uni.edu", password="facultypassword123"
        )
        self.faculty.profile.role = 'admin'
        self.faculty.profile.save()

        # Student 1
        self.student = User.objects.create_user(
            username="nikhil_pal", email="nikhil@uni.edu", password="studentpassword123"
        )
        self.student.profile.role = 'student'
        self.student.profile.save()

        # Student 2
        self.other_student = User.objects.create_user(
            username="student_two", email="student2@uni.edu", password="studentpassword123"
        )
        self.other_student.profile.role = 'student'
        self.other_student.profile.save()

        # Category and Questions
        self.category = Category.objects.create(name="Cybersecurity & Networks")
        self.q1 = Question.objects.create(
            category=self.category,
            text="Which protocol is used for secure communication over TLS?",
            option_a="HTTP", option_b="HTTPS", option_c="FTP", option_d="Telnet",
            correct_option="b", marks=5
        )
        self.q2 = Question.objects.create(
            category=self.category,
            text="What is the default port for SSH?",
            option_a="21", option_b="22", option_c="80", option_d="443",
            correct_option="b", marks=5
        )

        now = timezone.now()
        self.exam = Exam.objects.create(
            title="Network Security Assessment",
            category=self.category,
            duration_minutes=45,
            total_questions=2,
            passing_marks=5,
            scheduled_start=now - timedelta(minutes=10),
            scheduled_end=now + timedelta(hours=3),
            created_by=self.faculty
        )

    def test_anti_cheat_tab_switch_recording(self):
        """Test that Page Visibility API endpoint records tab switches correctly."""
        self.client.login(username="nikhil_pal", password="studentpassword123")

        # Start attempt
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        attempt = ExamAttempt.objects.get(exam=self.exam, student=self.student)
        self.assertEqual(attempt.tab_switch_count, 0)

        # Trigger tab-switch event
        tab_url = reverse("record_tab_switch", args=[attempt.id])
        res = self.client.post(tab_url, json.dumps({}), content_type="application/json")
        self.assertEqual(res.status_code, 200)
        data = res.json()
        self.assertEqual(data["status"], "recorded")
        self.assertEqual(data["tab_switch_count"], 1)

        # Trigger second switch
        res2 = self.client.post(tab_url, json.dumps({}), content_type="application/json")
        self.assertEqual(res2.json()["tab_switch_count"], 2)

        attempt.refresh_from_db()
        self.assertEqual(attempt.tab_switch_count, 2)

    def test_tab_switch_unauthorized_user_prevented(self):
        """A different candidate cannot manipulate another student's tab switch count."""
        # Create attempt for student 1
        self.client.login(username="nikhil_pal", password="studentpassword123")
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        attempt = ExamAttempt.objects.get(exam=self.exam, student=self.student)

        # Log in as other student
        self.client.login(username="student_two", password="studentpassword123")
        tab_url = reverse("record_tab_switch", args=[attempt.id])
        res = self.client.post(tab_url, json.dumps({}), content_type="application/json")
        self.assertEqual(res.status_code, 404)

        attempt.refresh_from_db()
        self.assertEqual(attempt.tab_switch_count, 0)

    def test_tab_switch_ignored_after_submission(self):
        """Tab switches are ignored once the exam has been submitted."""
        self.client.login(username="nikhil_pal", password="studentpassword123")
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        attempt = ExamAttempt.objects.get(exam=self.exam, student=self.student)

        # Submit exam
        submit_url = reverse("submit_exam", args=[attempt.id])
        self.client.post(submit_url, follow=True)

        attempt.refresh_from_db()
        self.assertEqual(attempt.status, "submitted")

        # Attempt to record tab switch after submission
        tab_url = reverse("record_tab_switch", args=[attempt.id])
        res = self.client.post(tab_url, json.dumps({}), content_type="application/json")
        self.assertEqual(res.status_code, 400)
        self.assertEqual(res.json()["status"], "ignored")

    def test_faculty_reports_role_guard(self):
        """Ensure students are blocked from faculty reports and redirected."""
        reports_url = reverse("exam_reports")

        # Anonymous user -> redirect to login
        res_anon = self.client.get(reports_url)
        self.assertRedirects(res_anon, reverse("login"))

        # Student user -> redirect to student dashboard with error
        self.client.login(username="nikhil_pal", password="studentpassword123")
        res_stud = self.client.get(reports_url, follow=True)
        self.assertRedirects(res_stud, reverse("student_dashboard"))

        # Faculty user -> 200 OK
        self.client.login(username="prof_sharma", password="facultypassword123")
        res_fac = self.client.get(reports_url)
        self.assertEqual(res_fac.status_code, 200)

    def test_faculty_reports_aggregations_and_analytics(self):
        """Test ORM aggregations and metrics computation in exam_reports view."""
        # 1. Student 1 takes exam, switches tab 3 times, passes (10/10)
        self.client.login(username="nikhil_pal", password="studentpassword123")
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        att1 = ExamAttempt.objects.get(exam=self.exam, student=self.student)

        tab_url1 = reverse("record_tab_switch", args=[att1.id])
        for _ in range(3):
            self.client.post(tab_url1, json.dumps({}), content_type="application/json")

        save_url1 = reverse("save_response", args=[att1.id])
        for eq in att1.exam_questions.all():
            self.client.post(save_url1, json.dumps({"exam_question_id": eq.id, "selected_option": "b"}), content_type="application/json")

        self.client.post(reverse("submit_exam", args=[att1.id]), follow=True)

        # 2. Student 2 takes exam, switches tab 1 time, fails (0/10)
        self.client.login(username="student_two", password="studentpassword123")
        self.client.get(reverse("start_exam", args=[self.exam.id]), follow=True)
        att2 = ExamAttempt.objects.get(exam=self.exam, student=self.other_student)

        tab_url2 = reverse("record_tab_switch", args=[att2.id])
        self.client.post(tab_url2, json.dumps({}), content_type="application/json")

        save_url2 = reverse("save_response", args=[att2.id])
        for eq in att2.exam_questions.all():
            self.client.post(save_url2, json.dumps({"exam_question_id": eq.id, "selected_option": "c"}), content_type="application/json")

        self.client.post(reverse("submit_exam", args=[att2.id]), follow=True)

        # 3. Verify reports as Faculty
        self.client.login(username="prof_sharma", password="facultypassword123")
        response = self.client.get(reverse("exam_reports"))
        self.assertEqual(response.status_code, 200)

        ctx = response.context
        self.assertEqual(ctx["total_exams"], 1)
        self.assertEqual(ctx["total_attempts"], 2)
        self.assertEqual(ctx["completed_attempts"], 2)
        self.assertEqual(ctx["unique_candidates"], 2)
        self.assertEqual(ctx["passed_count"], 1)
        self.assertEqual(ctx["failed_count"], 1)
        self.assertEqual(ctx["overall_pass_rate"], 50.0)
        self.assertEqual(ctx["total_switches"], 4)  # 3 + 1
        self.assertEqual(ctx["flagged_attempts_count"], 2)

        # Check per-exam stats
        exam_stat = ctx["exam_stats"][0]
        self.assertEqual(exam_stat["exam"].id, self.exam.id)
        self.assertEqual(exam_stat["pass_rate"], 50.0)
        self.assertEqual(exam_stat["highest_score"], 10)
        self.assertEqual(exam_stat["lowest_score"], 0)
        self.assertEqual(exam_stat["total_switches"], 4)
