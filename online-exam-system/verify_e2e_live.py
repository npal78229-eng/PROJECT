import os
import sys
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "examsystem.settings"
os.environ["DB_ENGINE"] = "sqlite"
django.setup()

from django.contrib.auth.models import User
from django.test import Client
from django.utils import timezone
from datetime import timedelta
from accounts.models import Profile
from questions.models import Category, Question
from exams.models import Exam, ExamAttempt

print("=== STARTING DAY 2 LIVE END-TO-END VERIFICATION ===")

client = Client()

# Clean slate for verification
ExamAttempt.objects.all().delete()
Exam.objects.all().delete()
Question.objects.all().delete()
Category.objects.all().delete()
User.objects.filter(username__in=["e2e_faculty", "e2e_student"]).delete()

# 1. Create faculty superuser
faculty = User.objects.create_superuser("e2e_faculty", "faculty@uni.edu", "FacultyPass123!")
print("1. Faculty account created (superuser auto-role: admin):", faculty.profile.role)
assert faculty.profile.role == "admin"

# 2. Student self-registration via form
reg_data = {
    "username": "e2e_student",
    "email": "student@uni.edu",
    "password1": "StudentPass123!",
    "password2": "StudentPass123!",
}
reg_resp = client.post("/register/", reg_data, follow=True)
student = User.objects.get(username="e2e_student")
print("2. Student self-registration completed (auto-role: student):", student.profile.role)
assert student.profile.role == "student"

# 3. Faculty Login and Dashboard Check
client.login(username="e2e_faculty", password="FacultyPass123!")
login_resp = client.get("/", follow=True)
print("3. Faculty login redirected to:", login_resp.redirect_chain[-1][0] if login_resp.redirect_chain else "none")
assert "/dashboard/admin/" in (login_resp.redirect_chain[-1][0] if login_resp.redirect_chain else "")
assert login_resp.status_code == 200

# 4. Faculty creates Category
cat_resp = client.post("/questions/categories/", {"name": "Software Engineering"}, follow=True)
assert Category.objects.filter(name="Software Engineering").exists()
se_cat = Category.objects.get(name="Software Engineering")
print("4. Category created: id=", se_cat.id, "name=", se_cat.name)

# 5. Faculty adds 3 questions
q1 = client.post("/questions/add/", {
    "category": se_cat.id,
    "text": "What does SDLC stand for?",
    "option_a": "Software Development Life Cycle",
    "option_b": "System Design Language Code",
    "option_c": "Standard Data Link Control",
    "option_d": "Structured Development Level Class",
    "correct_option": "a",
    "marks": 1,
}, follow=True)
q2 = client.post("/questions/add/", {
    "category": se_cat.id,
    "text": "Which model is also known as the Linear Sequential Model?",
    "option_a": "Spiral Model",
    "option_b": "Waterfall Model",
    "option_c": "RAD Model",
    "option_d": "Agile Model",
    "correct_option": "b",
    "marks": 1,
}, follow=True)
q3 = client.post("/questions/add/", {
    "category": se_cat.id,
    "text": "Which testing is performed without knowledge of internal code?",
    "option_a": "White Box Testing",
    "option_b": "Black Box Testing",
    "option_c": "Grey Box Testing",
    "option_d": "Unit Testing",
    "correct_option": "b",
    "marks": 2,
}, follow=True)
q_count = Question.objects.filter(category=se_cat).count()
print(f"5. Added {q_count} questions to Question Bank for {se_cat.name}")
assert q_count == 3

# 6. Faculty schedules an Exam
now = timezone.now()
local_now = timezone.localtime(now)
exam_resp = client.post("/exams/create/", {
    "title": "Software Engineering Midterm 2026",
    "category": se_cat.id,
    "duration_minutes": 30,
    "total_questions": 2,
    "passing_marks": 2,
    "scheduled_start": (local_now - timedelta(minutes=5)).strftime("%Y-%m-%dT%H:%M"),
    "scheduled_end": (local_now + timedelta(hours=2)).strftime("%Y-%m-%dT%H:%M"),
}, follow=True)
assert Exam.objects.filter(title="Software Engineering Midterm 2026").exists()
exam = Exam.objects.get(title="Software Engineering Midterm 2026")
now_check = timezone.now()
print(f"6. Exam scheduled successfully: '{exam.title}' (Duration: {exam.duration_minutes}m, Window active: {exam.is_open(now_check)})")
assert exam.is_open(now_check)
client.logout()

# 7. Student Login & Dashboard
client.login(username="e2e_student", password="StudentPass123!")
s_login = client.get("/", follow=True)
print("7. Student login redirected to:", s_login.redirect_chain[-1][0] if s_login.redirect_chain else "none")
assert "/dashboard/student/" in (s_login.redirect_chain[-1][0] if s_login.redirect_chain else "")
assert "Software Engineering Midterm 2026" in s_login.content.decode("utf-8")
print("   Exam visible under Student's Available Exams table: Confirmed")

# 8. Role Protection: Student attempts to access admin question bank
sec_check = client.get("/questions/", follow=True)
assert "/dashboard/student/" in (sec_check.redirect_chain[-1][0] if sec_check.redirect_chain else "")
print("8. Security check passed: Student blocked from /questions/ and redirected back to student dashboard.")

# 9. Student Starts Exam
start_resp = client.get(f"/exams/{exam.id}/start/", follow=True)
assert start_resp.status_code == 200
attempt = ExamAttempt.objects.filter(exam=exam, student=student).first()
assert attempt is not None
assert attempt.status == "in_progress"
print(f"9. Exam attempt started: ID #{attempt.id}, status='{attempt.status}', ends_at={attempt.ends_at}")
assert f"Attempt #{attempt.id}" in start_resp.content.decode("utf-8")
assert "Day 2 Milestone Reached" in start_resp.content.decode("utf-8")
print("   Exam take placeholder view rendered successfully with authoritative end time.")

# 10. Faculty monitors student attempts
client.logout()
client.login(username="e2e_faculty", password="FacultyPass123!")
detail_resp = client.get(f"/exams/{exam.id}/")
assert "e2e_student" in detail_resp.content.decode("utf-8")
assert "In Progress" in detail_resp.content.decode("utf-8")
print("10. Faculty exam detail view successfully logs student's active attempt.")

print("=== ALL 10 DAY 2 VERIFICATION CHECKS PASSED PERFECTLY ===")
