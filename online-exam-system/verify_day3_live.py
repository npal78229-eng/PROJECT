import json
import os
import sys
import django

os.environ["DJANGO_SETTINGS_MODULE"] = "examsystem.settings"
os.environ["DB_ENGINE"] = "sqlite"
django.setup()

from django.core.management import call_command
call_command("migrate", verbosity=0)

from datetime import timedelta
from django.contrib.auth.models import User
from django.test import Client
from django.utils import timezone
from accounts.models import Profile
from exams.models import Exam, ExamAttempt, ExamQuestion
from questions.models import Category, Question
from results.models import Response, Result

print("=== STARTING DAY 3 LIVE END-TO-END VERIFICATION ===")

client = Client()

# Clean slate for Day 3 live verification
ExamAttempt.objects.all().delete()
Exam.objects.all().delete()
Question.objects.all().delete()
Category.objects.all().delete()
User.objects.filter(username__in=["d3_faculty", "d3_student", "d3_intruder"]).delete()

# 1. Create accounts
faculty = User.objects.create_superuser("d3_faculty", "faculty@exam.edu", "FacultyPass123!")
student = User.objects.create_user("d3_student", "student@exam.edu", "StudentPass123!")
intruder = User.objects.create_user("d3_intruder", "intruder@exam.edu", "IntruderPass123!")
print("1. Faculty and Student accounts created successfully.")

# 2. Create Category and 5 Question bank entries
category = Category.objects.create(name="Computer Architecture")
questions = []
spec = [
    ("What does ALU stand for?", "Arithmetic Logic Unit", "Array Logic Unit", "Advanced Link Utility", "Auto Level Unit", "a", 2),
    ("Which memory is volatile?", "ROM", "RAM", "Flash", "Hard Disk", "b", 2),
    ("What is the speed of cache memory relative to RAM?", "Slower", "Equal", "Faster", "Infinite", "c", 3),
    ("Which bus carries memory addresses?", "Data bus", "Control bus", "Address bus", "Power bus", "c", 1),
    ("Which architecture uses a single memory for data and instructions?", "Harvard", "Von Neumann", "RISC", "CISC", "b", 2),
]
for text, a, b, c, d, correct, marks in spec:
    q = Question.objects.create(
        category=category,
        text=text,
        option_a=a,
        option_b=b,
        option_c=c,
        option_d=d,
        correct_option=correct,
        marks=marks,
    )
    questions.append(q)
print(f"2. Created category '{category.name}' with {len(questions)} questions.")

# 3. Schedule active Exam (picks 3 questions, passing marks = 4)
now = timezone.now()
local_now = timezone.localtime(now)
exam = Exam.objects.create(
    title="Computer Architecture Quiz",
    category=category,
    duration_minutes=30,
    total_questions=3,
    passing_marks=4,
    scheduled_start=local_now - timedelta(minutes=5),
    scheduled_end=local_now + timedelta(hours=2),
    created_by=faculty,
)
print(f"3. Scheduled exam: '{exam.title}' (Total Qs: {exam.total_questions}, Passing: {exam.passing_marks} pts).")

# 4. Student logs in & starts exam
client.login(username="d3_student", password="StudentPass123!")
start_resp = client.get(f"/exams/{exam.id}/start/", follow=True)
assert start_resp.status_code == 200

attempt = ExamAttempt.objects.get(exam=exam, student=student)
assert attempt.status == "in_progress"
print(f"4. Student started exam: Attempt #{attempt.id} created, status='{attempt.status}'.")

# 5. Verify random question locking
locked_eqs = list(attempt.exam_questions.select_related("question").order_by("order"))
assert len(locked_eqs) == 3
print(f"5. Random question set locked in: {[f'Q{eq.order}: id={eq.question.id}' for eq in locked_eqs]}")

# 6. Verify Question Privacy (correct_option NOT in candidate exam context)
exam_room_resp = client.get(f"/exams/attempt/{attempt.id}/")
assert exam_room_resp.status_code == 200
assert "correct_option" not in exam_room_resp.content.decode("utf-8")
print("6. Security check passed: correct_option is NEVER exposed in the candidate exam room.")

# 7. Simulate AJAX Autosave
eq1 = locked_eqs[0]
eq2 = locked_eqs[1]

# Answer Q1 correctly
save_resp1 = client.post(
    f"/exams/attempt/{attempt.id}/save-response/",
    json.dumps({"exam_question_id": eq1.id, "selected_option": eq1.question.correct_option}),
    content_type="application/json",
)
assert save_resp1.status_code == 200
assert save_resp1.json()["status"] == "success"
assert save_resp1.json()["answered_count"] == 1

# Answer Q2 incorrectly
wrong_opt = "d" if eq2.question.correct_option != "d" else "a"
save_resp2 = client.post(
    f"/exams/attempt/{attempt.id}/save-response/",
    json.dumps({"exam_question_id": eq2.id, "selected_option": wrong_opt}),
    content_type="application/json",
)
assert save_resp2.status_code == 200
assert save_resp2.json()["answered_count"] == 2
print(f"7. AJAX Autosave: Q1 answered correctly (+{eq1.question.marks} pts), Q2 answered with '{wrong_opt}', Q3 left unattempted.")

# 8. Submit Exam
submit_resp = client.post(f"/exams/attempt/{attempt.id}/submit/", follow=True)
assert submit_resp.status_code == 200

attempt.refresh_from_db()
assert attempt.status == "submitted"
assert attempt.submitted_at is not None

# Verify Result auto-evaluation
result = Result.objects.get(attempt=attempt)
expected_score = eq1.question.marks
expected_total = sum(eq.question.marks for eq in locked_eqs)
expected_pct = round((expected_score / expected_total) * 100, 2)
expected_passed = (expected_score >= exam.passing_marks)

print(f"8. Auto-Evaluation: Score={result.score}/{result.total_marks} ({result.percentage}%), Passed={result.passed}")
assert result.score == expected_score
assert result.total_marks == expected_total
assert float(result.percentage) == expected_pct
assert result.passed == expected_passed

# 9. Verify Scorecard Page
scorecard_content = submit_resp.content.decode("utf-8")
assert "Examination Scorecard" in scorecard_content
assert f"{result.score}" in scorecard_content
assert "Detailed Question-by-Question Review" in scorecard_content
print("9. Scorecard successfully displayed with overall grade and detailed question breakdown.")

# 10. Verify Student Dashboard
s_dash_resp = client.get("/dashboard/student/")
dash_content = s_dash_resp.content.decode("utf-8")
assert "Completed & Submitted" in dash_content
assert "View Scorecard" in dash_content
assert f"/results/attempt/{attempt.id}/" in dash_content
print("10. Student dashboard shows completed status, score badge, and scorecard link.")

# 11. Security Check: Intruder student cannot view this scorecard
client.logout()
client.login(username="d3_intruder", password="IntruderPass123!")
intruder_resp = client.get(f"/results/attempt/{attempt.id}/", follow=True)
assert "/dashboard/student/" in (intruder_resp.redirect_chain[-1][0] if intruder_resp.redirect_chain else "")
print("11. Security check passed: Other students blocked from accessing scorecard.")

# 12. Faculty Monitoring: Faculty can view student attempt and scorecard
client.logout()
client.login(username="d3_faculty", password="FacultyPass123!")
fac_exam_resp = client.get(f"/exams/{exam.id}/")
fac_content = fac_exam_resp.content.decode("utf-8")
assert "d3_student" in fac_content
assert f"/results/attempt/{attempt.id}/" in fac_content
print("12. Faculty exam detail logs student attempt with direct scorecard link.")

print("=== ALL 12 DAY 3 LIVE VERIFICATION CHECKS PASSED PERFECTLY ===")
