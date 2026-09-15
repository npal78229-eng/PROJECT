from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.db.models import Avg, Count, Max, Min, Sum
from django.shortcuts import get_object_or_404, redirect, render

from accounts.decorators import admin_required
from exams.models import Exam, ExamAttempt
from questions.models import Category
from .models import Response, Result
from .services import evaluate_attempt


@login_required
def exam_result(request, attempt_id):
    """
    Displays the scorecard and detailed question-by-question review for an ExamAttempt.
    Accessible by the student who took the exam or faculty/admin.
    """
    attempt = get_object_or_404(
        ExamAttempt.objects.select_related('exam', 'student', 'exam__category'),
        pk=attempt_id
    )

    profile = getattr(request.user, 'profile', None)
    is_owner = (attempt.student == request.user)
    is_admin = (profile and profile.role == 'admin')

    if not (is_owner or is_admin):
        messages.error(request, 'Access denied. You do not have permission to view this scorecard.')
        return redirect('student_dashboard')

    # Ensure evaluation has taken place
    result = getattr(attempt, 'result', None)
    if not result:
        result = evaluate_attempt(attempt)

    exam_questions = attempt.exam_questions.select_related('question').order_by('order')
    responses = {
        r.exam_question_id: r
        for r in Response.objects.filter(attempt=attempt)
    }

    review_items = []
    for eq in exam_questions:
        q = eq.question
        resp = responses.get(eq.id)
        selected = resp.selected_option if resp else None

        is_correct = bool(selected and selected.lower() == q.correct_option.lower())
        is_unanswered = (selected is None or selected == '')

        marks_awarded = q.marks if is_correct else 0

        # Text labels for chosen options
        options_map = {
            'a': q.option_a,
            'b': q.option_b,
            'c': q.option_c,
            'd': q.option_d,
        }

        review_items.append({
            'order': eq.order,
            'question': q,
            'selected_option': selected,
            'selected_text': options_map.get(selected.lower()) if selected else 'Not Answered',
            'correct_option': q.correct_option,
            'correct_text': options_map.get(q.correct_option.lower()),
            'is_correct': is_correct,
            'is_unanswered': is_unanswered,
            'marks_awarded': marks_awarded,
        })

    return render(request, 'results/scorecard.html', {
        'attempt': attempt,
        'exam': attempt.exam,
        'result': result,
        'review_items': review_items,
        'is_admin': is_admin,
    })


@admin_required
def exam_reports(request):
    """
    Faculty & Institutional Analytics View:
    Aggregates metrics across examinations, student performance, subject categories,
    and anti-cheat violation tracking.
    """
    total_exams = Exam.objects.count()
    total_attempts = ExamAttempt.objects.count()
    completed_attempts = Result.objects.count()
    unique_candidates = ExamAttempt.objects.values('student').distinct().count()

    overall_agg = Result.objects.aggregate(
        avg_score=Avg('score'),
        avg_percentage=Avg('percentage'),
        highest_score=Max('score'),
        lowest_score=Min('score'),
    )

    passed_count = Result.objects.filter(passed=True).count()
    failed_count = completed_attempts - passed_count
    overall_pass_rate = round((passed_count / completed_attempts * 100), 1) if completed_attempts > 0 else 0.0

    anti_cheat_agg = ExamAttempt.objects.aggregate(
        total_switches=Sum('tab_switch_count'),
        max_switches=Max('tab_switch_count')
    )
    total_switches = anti_cheat_agg['total_switches'] or 0
    max_switches = anti_cheat_agg['max_switches'] or 0
    flagged_attempts_count = ExamAttempt.objects.filter(tab_switch_count__gt=0).count()

    # Per-exam analytics
    exam_stats = []
    for exam in Exam.objects.select_related('category').prefetch_related('attempts__result').order_by('-created_at'):
        attempts = exam.attempts.all()
        att_count = attempts.count()
        results = [a.result for a in attempts if hasattr(a, 'result') and a.result is not None]
        res_count = len(results)

        if res_count > 0:
            scores = [r.score for r in results]
            pcts = [float(r.percentage) for r in results]
            p_cnt = sum(1 for r in results if r.passed)
            f_cnt = res_count - p_cnt
            p_rate = round((p_cnt / res_count) * 100, 1)
            avg_sc = round(sum(scores) / res_count, 1)
            avg_pct = round(sum(pcts) / res_count, 1)
            hi_sc = max(scores)
            lo_sc = min(scores)
        else:
            p_cnt = 0
            f_cnt = 0
            p_rate = 0.0
            avg_sc = 0.0
            avg_pct = 0.0
            hi_sc = 0
            lo_sc = 0

        switches = sum(a.tab_switch_count for a in attempts)
        flagged = sum(1 for a in attempts if a.tab_switch_count > 0)

        exam_stats.append({
            'exam': exam,
            'total_attempts': att_count,
            'completed_count': res_count,
            'pass_count': p_cnt,
            'fail_count': f_cnt,
            'pass_rate': p_rate,
            'avg_score': avg_sc,
            'avg_percentage': avg_pct,
            'highest_score': hi_sc,
            'lowest_score': lo_sc,
            'total_switches': switches,
            'flagged_attempts': flagged,
        })

    # Subject / Category breakdown
    category_stats = []
    for cat in Category.objects.all().prefetch_related('exams__attempts__result').order_by('name'):
        exams = cat.exams.all()
        cat_attempts = [a for e in exams for a in e.attempts.all()]
        cat_results = [a.result for a in cat_attempts if hasattr(a, 'result') and a.result is not None]

        if cat_results:
            cat_pcts = [float(r.percentage) for r in cat_results]
            cat_passed = sum(1 for r in cat_results if r.passed)
            cat_pass_rate = round((cat_passed / len(cat_results)) * 100, 1)
            cat_avg_pct = round(sum(cat_pcts) / len(cat_results), 1)
        else:
            cat_pass_rate = 0.0
            cat_avg_pct = 0.0

        category_stats.append({
            'category': cat,
            'exam_count': exams.count(),
            'total_attempts': len(cat_attempts),
            'completed_count': len(cat_results),
            'pass_rate': cat_pass_rate,
            'avg_percentage': cat_avg_pct,
        })

    # Recent student attempts (latest 10)
    recent_attempts = ExamAttempt.objects.select_related('exam', 'student', 'result', 'exam__category').order_by('-started_at')[:10]

    context = {
        'total_exams': total_exams,
        'total_attempts': total_attempts,
        'completed_attempts': completed_attempts,
        'unique_candidates': unique_candidates,
        'overall_agg': overall_agg,
        'passed_count': passed_count,
        'failed_count': failed_count,
        'overall_pass_rate': overall_pass_rate,
        'total_switches': total_switches,
        'max_switches': max_switches,
        'flagged_attempts_count': flagged_attempts_count,
        'exam_stats': exam_stats,
        'category_stats': category_stats,
        'recent_attempts': recent_attempts,
    }

    return render(request, 'results/reports.html', context)
