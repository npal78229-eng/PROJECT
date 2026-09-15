from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.shortcuts import get_object_or_404, redirect, render

from exams.models import ExamAttempt
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
