import json
import random
from datetime import timedelta
from django.contrib import messages
from django.db.models import Count
from django.http import JsonResponse
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone
from django.views.decorators.http import require_POST

from accounts.decorators import admin_required, student_required
from questions.models import Question
from results.models import Response
from results.services import evaluate_attempt
from .forms import ExamForm
from .models import Exam, ExamAttempt, ExamQuestion


@admin_required
def exam_list(request):
    exams = Exam.objects.select_related('category', 'created_by').annotate(
        attempt_count=Count('attempts')
    ).order_by('-scheduled_start')

    now = timezone.now()
    for exam in exams:
        if exam.scheduled_start > now:
            exam.state = 'Upcoming'
            exam.state_badge = 'info'
        elif exam.scheduled_end < now:
            exam.state = 'Completed'
            exam.state_badge = 'secondary'
        else:
            exam.state = 'Active'
            exam.state_badge = 'success'

    return render(request, 'exams/exam_list.html', {
        'exams': exams,
        'now': now,
    })


@admin_required
def exam_create(request):
    if request.method == 'POST':
        form = ExamForm(request.POST)
        if form.is_valid():
            exam = form.save(commit=False)
            exam.created_by = request.user
            exam.save()
            messages.success(request, f'Exam "{exam.title}" created successfully.')
            return redirect('exam_list')
    else:
        form = ExamForm()

    return render(request, 'exams/exam_form.html', {
        'form': form,
        'title': 'Create New Exam',
        'button_text': 'Create Exam',
    })


@admin_required
def exam_detail(request, pk):
    exam = get_object_or_404(Exam.objects.select_related('category', 'created_by'), pk=pk)
    attempts = exam.attempts.select_related('student', 'result').order_by('-started_at')
    now = timezone.now()

    if exam.scheduled_start > now:
        state = 'Upcoming'
        state_badge = 'info'
    elif exam.scheduled_end < now:
        state = 'Completed'
        state_badge = 'secondary'
    else:
        state = 'Active'
        state_badge = 'success'

    return render(request, 'exams/exam_detail.html', {
        'exam': exam,
        'attempts': attempts,
        'state': state,
        'state_badge': state_badge,
        'now': now,
    })


@admin_required
def exam_edit(request, pk):
    exam = get_object_or_404(Exam, pk=pk)
    if request.method == 'POST':
        form = ExamForm(request.POST, instance=exam)
        if form.is_valid():
            form.save()
            messages.success(request, f'Exam "{exam.title}" updated successfully.')
            return redirect('exam_detail', pk=exam.pk)
    else:
        form = ExamForm(instance=exam)

    return render(request, 'exams/exam_form.html', {
        'form': form,
        'exam': exam,
        'title': f'Edit Exam: {exam.title}',
        'button_text': 'Update Exam',
    })


@admin_required
def exam_delete(request, pk):
    exam = get_object_or_404(Exam, pk=pk)
    if request.method == 'POST':
        title = exam.title
        exam.delete()
        messages.success(request, f'Exam "{title}" deleted successfully.')
        return redirect('exam_list')
    return render(request, 'exams/exam_confirm_delete.html', {'exam': exam})


@student_required
def start_exam(request, pk):
    """
    Initiates or resumes an ExamAttempt for a student.
    - Locks in randomly selected questions (via ExamQuestion) on first attempt creation.
    - Never re-randomizes on subsequent page loads.
    - Enforces window scheduling and question bank availability.
    """
    exam = get_object_or_404(Exam, pk=pk)
    now = timezone.now()

    # 1. Check if exam window is active
    if not exam.is_open(now):
        if now < exam.scheduled_start:
            messages.error(request, f'This exam has not started yet. It opens at {exam.scheduled_start.strftime("%d %b %Y, %I:%M %p")}.')
        else:
            messages.error(request, 'This exam has already closed.')
        return redirect('student_dashboard')

    # 2. Check for an existing attempt
    existing_attempt = ExamAttempt.objects.filter(exam=exam, student=request.user).first()
    if existing_attempt:
        if existing_attempt.status == 'submitted':
            messages.info(request, 'You have already completed and submitted this exam.')
            return redirect('exam_result', attempt_id=existing_attempt.id)

        if existing_attempt.status == 'expired' or now > existing_attempt.ends_at:
            existing_attempt.status = 'expired'
            existing_attempt.submitted_at = now
            existing_attempt.save(update_fields=['status', 'submitted_at'])
            evaluate_attempt(existing_attempt)
            messages.warning(request, 'Your exam time expired. Your answers have been automatically evaluated.')
            return redirect('exam_result', attempt_id=existing_attempt.id)

        # Resume in-progress attempt with locked questions
        messages.info(request, 'Resuming your in-progress exam attempt.')
        return redirect('take_exam', attempt_id=existing_attempt.id)

    # 3. Verify category question availability
    available_questions = list(Question.objects.filter(category=exam.category))
    if len(available_questions) < exam.total_questions:
        messages.error(
            request,
            f'Unable to start exam: the question bank requires {exam.total_questions} questions, '
            f'but only {len(available_questions)} are currently available. Please notify your instructor.'
        )
        return redirect('student_dashboard')

    # 4. Server authoritative ends_at
    calculated_end = now + timedelta(minutes=exam.duration_minutes)
    authoritative_ends_at = min(calculated_end, exam.scheduled_end)

    # 5. Create ExamAttempt
    attempt = ExamAttempt.objects.create(
        exam=exam,
        student=request.user,
        ends_at=authoritative_ends_at,
        status='in_progress',
    )

    # 6. Randomly select questions once and lock into ExamQuestion rows
    chosen_questions = random.sample(available_questions, exam.total_questions)
    exam_questions = [
        ExamQuestion(attempt=attempt, question=q, order=i + 1)
        for i, q in enumerate(chosen_questions)
    ]
    ExamQuestion.objects.bulk_create(exam_questions)

    # 7. Pre-create empty Response rows
    persisted_eqs = ExamQuestion.objects.filter(attempt=attempt)
    responses = [
        Response(attempt=attempt, exam_question=eq, selected_option=None)
        for eq in persisted_eqs
    ]
    Response.objects.bulk_create(responses)

    return redirect('take_exam', attempt_id=attempt.id)


@student_required
def take_exam(request, attempt_id):
    """
    The interactive exam room interface for a student.
    Supplies questions (without correct answers), synchronized timer data, and autosave endpoints.
    """
    attempt = get_object_or_404(
        ExamAttempt.objects.select_related('exam', 'student', 'exam__category'),
        pk=attempt_id,
        student=request.user
    )
    now = timezone.now()

    if attempt.status == 'submitted':
        return redirect('exam_result', attempt_id=attempt.id)

    # Time expiration check
    if attempt.status == 'expired' or now > attempt.ends_at:
        attempt.status = 'expired'
        attempt.submitted_at = now
        attempt.save(update_fields=['status', 'submitted_at'])
        evaluate_attempt(attempt)
        messages.warning(request, 'Your exam time has expired. Your attempt has been evaluated.')
        return redirect('exam_result', attempt_id=attempt.id)

    # Fetch locked questions and student responses
    exam_questions = attempt.exam_questions.select_related('question').order_by('order')
    saved_responses = {
        r.exam_question_id: r.selected_option
        for r in Response.objects.filter(attempt=attempt)
    }

    questions_data = []
    answered_count = 0
    for eq in exam_questions:
        q = eq.question
        chosen = saved_responses.get(eq.id) or ''
        if chosen:
            answered_count += 1

        questions_data.append({
            'eq_id': eq.id,
            'order': eq.order,
            'text': q.text,
            'option_a': q.option_a,
            'option_b': q.option_b,
            'option_c': q.option_c,
            'option_d': q.option_d,
            'marks': q.marks,
            'selected_option': chosen,
        })

    remaining_seconds = max(0, int((attempt.ends_at - now).total_seconds()))

    return render(request, 'exams/take_exam.html', {
        'attempt': attempt,
        'exam': attempt.exam,
        'questions': questions_data,
        'total_questions': len(questions_data),
        'answered_count': answered_count,
        'remaining_seconds': remaining_seconds,
        'ends_at_iso': attempt.ends_at.isoformat(),
    })


@student_required
@require_POST
def save_response(request, attempt_id):
    """
    Asynchronous AJAX endpoint to save student's selected answer as they progress.
    """
    attempt = get_object_or_404(ExamAttempt, pk=attempt_id, student=request.user)
    now = timezone.now()

    # Grace period of 10s for network latency before rejecting
    if attempt.status != 'in_progress' or now > (attempt.ends_at + timedelta(seconds=10)):
        return JsonResponse({
            'status': 'expired',
            'message': 'Exam time has expired or attempt is no longer active.'
        }, status=403)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        data = request.POST

    eq_id = data.get('exam_question_id')
    selected_option = (data.get('selected_option') or '').strip().lower()

    if selected_option not in ['a', 'b', 'c', 'd']:
        selected_option = None

    eq = get_object_or_404(ExamQuestion, pk=eq_id, attempt=attempt)

    Response.objects.update_or_create(
        attempt=attempt,
        exam_question=eq,
        defaults={'selected_option': selected_option}
    )

    answered_count = Response.objects.filter(attempt=attempt).exclude(
        selected_option__isnull=True
    ).exclude(selected_option='').count()

    total_count = attempt.exam_questions.count()

    return JsonResponse({
        'status': 'success',
        'answered_count': answered_count,
        'total_count': total_count,
        'selected_option': selected_option,
    })


@student_required
@require_POST
def submit_exam(request, attempt_id):
    """
    Submits the student's exam attempt, marks status='submitted',
    runs server-side automatic evaluation, and redirects to the scorecard.
    """
    attempt = get_object_or_404(ExamAttempt, pk=attempt_id, student=request.user)
    now = timezone.now()

    if attempt.status == 'submitted':
        return redirect('exam_result', attempt_id=attempt.id)

    # Server-side validation against ends_at
    if now > (attempt.ends_at + timedelta(seconds=15)):
        attempt.status = 'expired'
    else:
        attempt.status = 'submitted'

    attempt.submitted_at = now
    attempt.save(update_fields=['status', 'submitted_at'])

    # Evaluate attempt
    evaluate_attempt(attempt)
    messages.success(request, 'Your exam has been submitted and evaluated successfully!')
    return redirect('exam_result', attempt_id=attempt.id)
