import os
import django
from datetime import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'examsystem.settings')
os.environ['DB_ENGINE'] = 'sqlite'
django.setup()

from django.core.management import call_command
from django.contrib.auth.models import User
from django.utils import timezone
from questions.models import Category, Question
from exams.models import Exam, ExamAttempt, ExamQuestion
from results.models import Response, Result
from results.services import evaluate_attempt

print("--- 1. Applying Database Migrations ---")
call_command('migrate', verbosity=1)

print("\n--- 2. Creating Demo Accounts ---")
# Faculty Account
faculty, _ = User.objects.get_or_create(username='faculty', defaults={'email': 'ragini.sharma@mangalayatan.edu'})
faculty.set_password('admin123')
faculty.is_superuser = True
faculty.is_staff = True
faculty.save()
faculty.profile.role = 'admin'
faculty.profile.save()
print("  [OK] Faculty / Admin: username='faculty' | password='admin123'")

# Student Account 1 (Nikhil Pal)
nikhil, _ = User.objects.get_or_create(username='nikhil', defaults={'email': 'nikhil.pal@mangalayatan.edu'})
nikhil.set_password('student123')
nikhil.save()
nikhil.profile.role = 'student'
nikhil.profile.save()
print("  [OK] Student 1:       username='nikhil'  | password='student123'")

# Student Account 2 (Rahul Sharma)
rahul, _ = User.objects.get_or_create(username='rahul', defaults={'email': 'rahul.sharma@mangalayatan.edu'})
rahul.set_password('student123')
rahul.save()
rahul.profile.role = 'student'
rahul.profile.save()
print("  [OK] Student 2:       username='rahul'   | password='student123'")

print("\n--- 3. Creating Subject Categories & Question Bank ---")
cat_python, _ = Category.objects.get_or_create(name='Python Programming')
cat_dbms, _ = Category.objects.get_or_create(name='Database Management Systems (DBMS)')
cat_os, _ = Category.objects.get_or_create(name='Operating Systems')

questions_data = [
    # Python Questions
    (cat_python, "Which data structure in Python is immutable?", "List", "Dictionary", "Tuple", "Set", "c", 2),
    (cat_python, "What keyword is used to define a function in Python?", "func", "def", "function", "lambda", "b", 2),
    (cat_python, "What is the output of print(2 ** 3) in Python?", "6", "8", "9", "5", "b", 2),
    (cat_python, "Which of the following is NOT a built-in module in Python?", "os", "sys", "django", "math", "c", 2),
    (cat_python, "What does the 'len()' function do?", "Returns the length of an object", "Converts string to lowercase", "Calculates logarithm", "Sorts a list", "a", 2),
    (cat_python, "Which keyword is used for exception handling in Python?", "catch", "except", "error", "rescue", "b", 2),

    # DBMS Questions
    (cat_dbms, "What does ACID stand for in DBMS?", "Atomicity, Consistency, Isolation, Durability", "Accuracy, Control, Integrity, Data", "Action, Commit, Index, Database", "None of these", "a", 2),
    (cat_dbms, "Which SQL command is used to retrieve data from a table?", "FETCH", "GET", "SELECT", "PULL", "c", 2),
    (cat_dbms, "Which key uniquely identifies each record in a relational database?", "Foreign Key", "Primary Key", "Candidate Key", "Super Key", "b", 2),
    (cat_dbms, "What is the normal form that eliminates transitive dependency?", "1NF", "2NF", "3NF", "BCNF", "c", 2),
    (cat_dbms, "Which SQL clause is used to filter rows before aggregation?", "HAVING", "WHERE", "GROUP BY", "ORDER BY", "b", 2),
    (cat_dbms, "What does DDL stand for in SQL?", "Data Definition Language", "Data Distribution Level", "Database Design Layer", "Direct Data Loading", "a", 2),

    # OS Questions
    (cat_os, "Which algorithm is non-preemptive CPU scheduling?", "Round Robin", "Shortest Job First (non-preemptive)", "SRTF", "Priority (preemptive)", "b", 2),
    (cat_os, "What is the condition where two processes wait indefinitely for each other?", "Starvation", "Paging", "Deadlock", "Segmentation", "c", 2),
    (cat_os, "Which memory management scheme allows non-contiguous physical memory allocation?", "Contiguous Allocation", "Paging", "Single Partition", "None of these", "b", 2),
]

for cat, text, oa, ob, oc, od, ans, marks in questions_data:
    Question.objects.get_or_create(
        category=cat,
        text=text,
        defaults={
            'option_a': oa,
            'option_b': ob,
            'option_c': oc,
            'option_d': od,
            'correct_option': ans,
            'marks': marks,
        }
    )

print(f"  [OK] {Question.objects.count()} technical MCQs inserted across 3 subjects.")

print("\n--- 4. Creating Active Scheduled Examinations ---")
now = timezone.now()
exam1, _ = Exam.objects.get_or_create(
    title="Python Core & OOPs Assessment",
    defaults={
        'category': cat_python,
        'duration_minutes': 15,
        'total_questions': 5,
        'passing_marks': 6,
        'scheduled_start': now - timedelta(hours=1),
        'scheduled_end': now + timedelta(days=7),
        'created_by': faculty,
    }
)

exam2, _ = Exam.objects.get_or_create(
    title="DBMS SQL & Relational Architecture Test",
    defaults={
        'category': cat_dbms,
        'duration_minutes': 15,
        'total_questions': 5,
        'passing_marks': 6,
        'scheduled_start': now - timedelta(hours=1),
        'scheduled_end': now + timedelta(days=7),
        'created_by': faculty,
    }
)
print(f"  [OK] Exam 1: '{exam1.title}' (Active now)")
print(f"  [OK] Exam 2: '{exam2.title}' (Active now)")

print("\n--- 5. Seeding Sample Completed Attempt for Analytics ---")
existing_attempt = ExamAttempt.objects.filter(exam=exam1, student=rahul).first()
if not existing_attempt:
    rahul_attempt = ExamAttempt.objects.create(
        exam=exam1,
        student=rahul,
        ends_at=now + timedelta(minutes=15),
        status='submitted',
        submitted_at=now - timedelta(minutes=10),
        tab_switch_count=2, # Demo violation for report testing
    )
    q_pool = list(Question.objects.filter(category=cat_python)[:5])
    for idx, q in enumerate(q_pool, 1):
        eq = ExamQuestion.objects.create(attempt=rahul_attempt, question=q, order=idx)
        sel = q.correct_option if idx <= 4 else ('a' if q.correct_option != 'a' else 'b')
        Response.objects.create(attempt=rahul_attempt, exam_question=eq, selected_option=sel)
    evaluate_attempt(rahul_attempt)
    print(f"  [OK] Candidate 'rahul' completed Exam 1: Score {rahul_attempt.result.score}/10, 2 tab-switches logged.")

print("\n========================================================")
print("=== DEMO DATABASE SEEDED SUCCESSFULLY! ===")
print("========================================================")
