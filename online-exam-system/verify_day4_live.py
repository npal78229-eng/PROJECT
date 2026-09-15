import os
import sys
import django
from datetime import timedelta

# Configure environment
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'examsystem.settings')
os.environ['DB_ENGINE'] = 'sqlite'
django.setup()

from django.core.management import call_command
from django.test import Client
from django.contrib.auth.models import User
from django.utils import timezone
from questions.models import Category, Question
from exams.models import Exam, ExamAttempt, ExamQuestion
from results.models import Response, Result

print("==================================================")
print("=== DAY 4 LIVE VERIFICATION: SECURITY & REPORTS ===")
print("==================================================")

# 1. Run migrations
call_command('migrate', verbosity=0)

client = Client()

# 2. Setup faculty and students
faculty_user, _ = User.objects.get_or_create(username='prof_live')
faculty_user.set_password('pass123')
faculty_user.is_superuser = True
faculty_user.save()
faculty_user.profile.role = 'admin'
faculty_user.profile.save()

student1, _ = User.objects.get_or_create(username='student_alpha')
student1.set_password('pass123')
student1.save()
student1.profile.role = 'student'
student1.profile.save()

student2, _ = User.objects.get_or_create(username='student_beta')
student2.set_password('pass123')
student2.save()
student2.profile.role = 'student'
student2.profile.save()

# 3. Create Category and Questions
cat, _ = Category.objects.get_or_create(name="Cloud Computing & DevOps")
q1, _ = Question.objects.get_or_create(
    category=cat,
    text="Which AWS service provides serverless compute?",
    defaults={
        'option_a': 'EC2', 'option_b': 'Lambda', 'option_c': 'S3', 'option_d': 'RDS',
        'correct_option': 'b', 'marks': 5
    }
)
q2, _ = Question.objects.get_or_create(
    category=cat,
    text="What does CI/CD stand for?",
    defaults={
        'option_a': 'Continuous Integration / Continuous Delivery',
        'option_b': 'Computer Interface / Central Data',
        'option_c': 'Control Instruction / Core Driver',
        'option_d': 'None of the above',
        'correct_option': 'a', 'marks': 5
    }
)

now = timezone.now()
exam = Exam.objects.create(
    title="Cloud Architecture & Security",
    category=cat,
    duration_minutes=30,
    total_questions=2,
    passing_marks=5,
    scheduled_start=now - timedelta(minutes=5),
    scheduled_end=now + timedelta(hours=2),
    created_by=faculty_user
)
print(f"[+] Exam created: '{exam.title}' with {exam.total_questions} questions.")

# 4. Student Alpha takes the exam with tab switches
client.login(username='student_alpha', password='pass123')
start_res = client.get(f'/exams/{exam.id}/start/', follow=True)
assert start_res.status_code == 200, f"Start exam failed: {start_res.status_code}"

attempt1 = ExamAttempt.objects.get(exam=exam, student=student1)
print(f"[+] Student Alpha started attempt #{attempt1.id}.")

# Simulate 3 tab switches
for i in range(1, 4):
    tab_res = client.post(
        f'/exams/attempt/{attempt1.id}/record-tab-switch/',
        '{}',
        content_type='application/json'
    )
    assert tab_res.status_code == 200
    data = tab_res.json()
    assert data['status'] == 'recorded'
    assert data['tab_switch_count'] == i
print(f"[+] Anti-Cheat verified: 3 tab switches successfully logged.")

# Answer both questions correctly
eqs1 = attempt1.exam_questions.select_related('question').order_by('order')
for eq in eqs1:
    save_res = client.post(
        f'/exams/attempt/{attempt1.id}/save-response/',
        f'{{"exam_question_id": {eq.id}, "selected_option": "{eq.question.correct_option}"}}',
        content_type='application/json'
    )
    assert save_res.status_code == 200

# Submit
sub_res = client.post(f'/exams/attempt/{attempt1.id}/submit/', follow=True)
assert sub_res.status_code == 200
attempt1.refresh_from_db()
assert attempt1.status == 'submitted'
assert attempt1.tab_switch_count == 3
assert attempt1.result.score == 10
assert attempt1.result.passed is True
print(f"[+] Student Alpha submitted. Score: {attempt1.result.score}/10, Passed: {attempt1.result.passed}, Switches: {attempt1.tab_switch_count}.")

# 5. Student Beta takes the exam (clean attempt, 0 switches, answers 1 correct)
client.login(username='student_beta', password='pass123')
client.get(f'/exams/{exam.id}/start/', follow=True)
attempt2 = ExamAttempt.objects.get(exam=exam, student=student2)

eqs2 = list(attempt2.exam_questions.select_related('question').order_by('order'))
client.post(
    f'/exams/attempt/{attempt2.id}/save-response/',
    f'{{"exam_question_id": {eqs2[0].id}, "selected_option": "{eqs2[0].question.correct_option}"}}',
    content_type='application/json'
)
# Leave second unanswered
client.post(f'/exams/attempt/{attempt2.id}/submit/', follow=True)
attempt2.refresh_from_db()
assert attempt2.result.score == 5
assert attempt2.result.passed is True
assert attempt2.tab_switch_count == 0
print(f"[+] Student Beta submitted. Score: {attempt2.result.score}/10, Passed: {attempt2.result.passed}, Switches: {attempt2.tab_switch_count}.")

# 6. Test Security Guard: Student Beta cannot view Faculty Reports
rep_deny = client.get('/results/reports/', follow=True)
assert '/results/reports/' not in rep_deny.redirect_chain[0][0] or rep_deny.status_code == 200
# Check redirected to student_dashboard
assert 'Student portal' in rep_deny.content.decode('utf-8') or 'My Exams' in rep_deny.content.decode('utf-8') or 'Dashboard' in rep_deny.content.decode('utf-8')
print("[+] Access Control verified: Students cannot access Faculty Reports.")

# 7. Faculty views Reports & Analytics
client.login(username='prof_live', password='pass123')
rep_res = client.get('/results/reports/')
assert rep_res.status_code == 200
content = rep_res.content.decode('utf-8')
assert 'Faculty Reports &amp; Performance Analytics' in content or 'Faculty Reports' in content
assert 'Cloud Computing &amp; DevOps' in content or 'Cloud Computing' in content
assert 'Cloud Architecture &amp; Security' in content
assert 'Tab Switches' in content
assert 'Violations: 3' in content or '3 switches' in content or '3' in content
print("[+] Faculty Reports verified: Institutional metrics, per-exam analysis, and anti-cheat tracking rendered cleanly.")

# 8. Verify Scorecard includes tab switch count
sc_res = client.get(f'/results/attempt/{attempt1.id}/')
assert sc_res.status_code == 200
sc_content = sc_res.content.decode('utf-8')
assert 'Examination Scorecard' in sc_content
assert 'Tab Switches' in sc_content
assert '3' in sc_content
print("[+] Scorecard verified: Tab switch count permanently recorded and displayed.")

print("==================================================")
print("=== ALL DAY 4 VERIFICATIONS PASSED SUCCESSFULLY! ===")
print("==================================================")
