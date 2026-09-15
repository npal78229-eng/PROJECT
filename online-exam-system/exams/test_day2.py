from datetime import timedelta
from django.contrib.auth.models import User
from django.test import TestCase, Client
from django.urls import reverse
from django.utils import timezone

from accounts.models import Profile
from questions.models import Category, Question
from exams.models import Exam, ExamAttempt


class Day2ModulesTestCase(TestCase):
    def setUp(self):
        self.client = Client()

        # 1. Create Admin User
        self.admin_user = User.objects.create_superuser(
            username="admin_user", email="admin@example.com", password="adminpassword123"
        )
        # Profile is created via signal with role='admin'

        # 2. Create Student User
        self.student_user = User.objects.create_user(
            username="student_user", email="student@example.com", password="studentpassword123"
        )
        # Profile is created via signal with role='student'

        # 3. Create initial category & questions
        self.cat = Category.objects.create(name="Computer Networks")
        for i in range(1, 4):
            Question.objects.create(
                category=self.cat,
                text=f"Sample Question {i}?",
                option_a=f"A{i}",
                option_b=f"B{i}",
                option_c=f"C{i}",
                option_d=f"D{i}",
                correct_option="a",
                marks=1,
            )

    def test_admin_category_management(self):
        self.client.login(username="admin_user", password="adminpassword123")

        # Category list GET
        response = self.client.get(reverse("category_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Computer Networks")

        # Category create POST
        response = self.client.post(reverse("category_list"), {"name": "Operating Systems"}, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Category.objects.filter(name="Operating Systems").exists())

    def test_admin_question_crud(self):
        self.client.login(username="admin_user", password="adminpassword123")

        # Question list GET
        response = self.client.get(reverse("question_list"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Sample Question 1?")

        # Question filter by category
        response = self.client.get(reverse("question_list") + f"?category={self.cat.id}")
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Sample Question 1?")

        # Question create POST
        post_data = {
            "category": self.cat.id,
            "text": "What is the full form of IP?",
            "option_a": "Internet Protocol",
            "option_b": "Internal Program",
            "option_c": "Intranet Page",
            "option_d": "Instant Post",
            "correct_option": "a",
            "marks": 2,
        }
        response = self.client.post(reverse("question_create"), post_data, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Question.objects.filter(text="What is the full form of IP?").exists())

        # Question edit POST
        new_q = Question.objects.get(text="What is the full form of IP?")
        post_data["marks"] = 4
        response = self.client.post(reverse("question_edit", args=[new_q.id]), post_data, follow=True)
        self.assertEqual(response.status_code, 200)
        new_q.refresh_from_db()
        self.assertEqual(new_q.marks, 4)

        # Question delete POST
        response = self.client.post(reverse("question_delete", args=[new_q.id]), follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertFalse(Question.objects.filter(text="What is the full form of IP?").exists())

    def test_role_protection_for_students(self):
        # Student cannot access question bank or category management
        self.client.login(username="student_user", password="studentpassword123")

        response = self.client.get(reverse("category_list"), follow=True)
        self.assertRedirects(response, reverse("student_dashboard"))
        self.assertContains(response, "Access denied")

        response = self.client.get(reverse("question_list"), follow=True)
        self.assertRedirects(response, reverse("student_dashboard"))
        self.assertContains(response, "Access denied")

        response = self.client.get(reverse("exam_list"), follow=True)
        self.assertRedirects(response, reverse("student_dashboard"))
        self.assertContains(response, "Access denied")

    def test_exam_creation_and_validation(self):
        self.client.login(username="admin_user", password="adminpassword123")

        now = timezone.now()
        start = now - timedelta(hours=1)
        end = now + timedelta(hours=2)

        # Valid Exam creation
        exam_data = {
            "title": "Computer Networks Quiz 1",
            "category": self.cat.id,
            "duration_minutes": 30,
            "total_questions": 2,  # Category has 3 questions, so 2 is valid
            "passing_marks": 1,
            "scheduled_start": start.strftime("%Y-%m-%dT%H:%M"),
            "scheduled_end": end.strftime("%Y-%m-%dT%H:%M"),
        }
        response = self.client.post(reverse("exam_create"), exam_data, follow=True)
        self.assertEqual(response.status_code, 200)
        self.assertTrue(Exam.objects.filter(title="Computer Networks Quiz 1").exists())
        exam = Exam.objects.get(title="Computer Networks Quiz 1")
        self.assertEqual(exam.created_by, self.admin_user)

        # Invalid exam: total_questions > available in category
        invalid_data = exam_data.copy()
        invalid_data["title"] = "Impossible Exam"
        invalid_data["total_questions"] = 50
        response = self.client.post(reverse("exam_create"), invalid_data)
        self.assertEqual(response.status_code, 200)
        self.assertIn("total_questions", response.context["form"].errors)

    def test_student_dashboard_and_start_exam_flow(self):
        now = timezone.now()

        # Create active exam
        active_exam = Exam.objects.create(
            title="Active Exam",
            category=self.cat,
            duration_minutes=45,
            total_questions=2,
            passing_marks=1,
            scheduled_start=now - timedelta(minutes=10),
            scheduled_end=now + timedelta(minutes=50),
            created_by=self.admin_user,
        )

        # Create upcoming exam
        upcoming_exam = Exam.objects.create(
            title="Upcoming Exam",
            category=self.cat,
            duration_minutes=30,
            total_questions=2,
            passing_marks=1,
            scheduled_start=now + timedelta(days=1),
            scheduled_end=now + timedelta(days=1, hours=2),
            created_by=self.admin_user,
        )

        self.client.login(username="student_user", password="studentpassword123")

        # Check student dashboard
        response = self.client.get(reverse("student_dashboard"))
        self.assertEqual(response.status_code, 200)
        self.assertContains(response, "Active Exam")
        self.assertContains(response, "Upcoming Exam")

        # Student starts the active exam
        start_url = reverse("start_exam", args=[active_exam.id])
        response = self.client.get(start_url, follow=True)
        self.assertEqual(response.status_code, 200)

        # Check ExamAttempt was created in DB
        attempt = ExamAttempt.objects.filter(exam=active_exam, student=self.student_user).first()
        self.assertIsNotNone(attempt)
        self.assertEqual(attempt.status, "in_progress")
        self.assertTrue(attempt.ends_at > now)
        self.assertContains(response, f"Attempt #{attempt.id}")
        self.assertContains(response, "Question Palette")

        # Starting again resumes the existing attempt without creating a duplicate
        response2 = self.client.get(start_url, follow=True)
        self.assertEqual(response2.status_code, 200)
        self.assertEqual(ExamAttempt.objects.filter(exam=active_exam, student=self.student_user).count(), 1)
        self.assertContains(response2, "Resuming your in-progress exam attempt")

        # If attempt is marked submitted, cannot restart
        attempt.status = "submitted"
        attempt.save()
        response3 = self.client.get(start_url, follow=True)
        self.assertRedirects(response3, reverse("exam_result", args=[attempt.id]))
        self.assertContains(response3, "Examination Scorecard")
