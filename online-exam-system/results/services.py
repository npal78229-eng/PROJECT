from django.utils import timezone
from .models import Response, Result


def evaluate_attempt(attempt):
    """
    Evaluates a completed or expired ExamAttempt.
    Compares student Responses with Question.correct_option for each ExamQuestion,
    sums the earned marks, calculates the percentage, determines pass/fail,
    and creates or updates the Result record.
    """
    exam_questions = attempt.exam_questions.select_related('question').all()
    responses = {
        r.exam_question_id: r
        for r in Response.objects.filter(attempt=attempt)
    }

    total_score = 0
    total_possible_marks = 0

    for eq in exam_questions:
        q = eq.question
        total_possible_marks += q.marks
        resp = responses.get(eq.id)
        if resp and resp.selected_option and resp.selected_option.lower() == q.correct_option.lower():
            total_score += q.marks

    if total_possible_marks > 0:
        percentage = round((total_score / total_possible_marks) * 100, 2)
    else:
        percentage = 0.0

    passed = (total_score >= attempt.exam.passing_marks)

    result, _ = Result.objects.update_or_create(
        attempt=attempt,
        defaults={
            'score': total_score,
            'total_marks': total_possible_marks,
            'percentage': percentage,
            'passed': passed,
            'evaluated_at': timezone.now(),
        }
    )
    return result
