from datetime import timedelta
from django.contrib import messages
from django.db.models import Count
from django.shortcuts import get_object_or_404, redirect, render
from django.utils import timezone

from accounts.decorators import admin_required, student_required
from questions.models import Question
from .forms import ExamForm
from .models import Exam, ExamAttempt


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
    attempts = exam.attempts.select_related('student').order_by('-started_at')
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
    Handles student starting or resuming an exam attempt.
    Enforces server-side scheduling, question bank sufficiency, and creates/resumes ExamAttempt.
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
            return redirect('student_dashboard')

        if existing_attempt.status == 'expired' or now > existing_attempt.ends_at:
            existing_attempt.status = 'expired'
            existing_attempt.save(update_fields=['status'])
            messages.warning(request, 'Your exam time has expired.')
            return redirect('student_dashboard')

        # Resume in-progress attempt
        messages.info(request, 'Resuming your in-progress exam attempt.')
        return redirect('exam_take_placeholder', attempt_id=existing_attempt.id)

    # 3. Verify category question availability
    category_questions = Question.objects.filter(category=exam.category).count()
    if category_questions < exam.total_questions:
        messages.error(
            request,
            f'Unable to start exam: the question bank requires {exam.total_questions} questions, '
            f'but only {category_questions} are currently available. Please notify your instructor.'
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
    messages.success(request, f'Exam attempt started! You have {exam.duration_minutes} minutes.')
    return redirect('exam_take_placeholder', attempt_id=attempt.id)


@student_required
def exam_take_placeholder(request, attempt_id):
    """
    Day 2 shell view for taking an exam.
    Confirms attempt record is created and server-locked. Day 3 will replace this with the full exam engine.
    """
    attempt = get_object_or_404(ExamAttempt.objects.select_related('exam', 'student'), pk=attempt_id, student=request.user)
    now = timezone.now()

    if attempt.status == 'submitted':
        messages.info(request, 'This exam attempt has already been submitted.')
        return redirect('student_dashboard')

    if attempt.status == 'expired' or now > attempt.ends_at:
        attempt.status = 'expired'
        attempt.save(update_fields=['status'])
        messages.warning(request, 'Your exam time has expired.')
        return redirect('student_dashboard')

    remaining_seconds = max(0, int((attempt.ends_at - now).total_seconds()))

    return render(request, 'exams/exam_take_placeholder.html', {
        'attempt': attempt,
        'exam': attempt.exam,
        'remaining_seconds': remaining_seconds,
        'now': now,
    })
