from django.contrib import messages
from django.contrib.auth.decorators import login_required
from django.contrib.auth.views import LoginView, LogoutView
from django.db.models import Count
from django.shortcuts import redirect, render
from django.urls import reverse_lazy
from django.utils import timezone

from exams.models import Exam, ExamAttempt
from questions.models import Category, Question
from .forms import StudentRegisterForm
from .models import Profile


def register(request):
    if request.method == 'POST':
        form = StudentRegisterForm(request.POST)
        if form.is_valid():
            user = form.save()
            Profile.objects.get_or_create(user=user, defaults={'role': 'student'})
            messages.success(request, 'Account created successfully. You can log in now.')
            return redirect('login')
    else:
        form = StudentRegisterForm()
    return render(request, 'accounts/register.html', {'form': form})


class RoleBasedLoginView(LoginView):
    """Sends admins/faculty and students to different dashboards after login."""
    template_name = 'accounts/login.html'
    redirect_authenticated_user = True

    def get_success_url(self):
        profile = getattr(self.request.user, 'profile', None)
        if profile and profile.role == 'admin':
            return str(reverse_lazy('admin_dashboard'))
        return str(reverse_lazy('student_dashboard'))


class RoleBasedLogoutView(LogoutView):
    next_page = reverse_lazy('login')


@login_required
def admin_dashboard(request):
    profile = getattr(request.user, 'profile', None)
    if not profile or profile.role != 'admin':
        return redirect('student_dashboard')

    now = timezone.now()
    total_categories = Category.objects.count()
    total_questions = Question.objects.count()
    total_exams = Exam.objects.count()
    recent_exams = Exam.objects.select_related('category').annotate(
        attempt_count=Count('attempts')
    ).order_by('-created_at')[:5]

    for exam in recent_exams:
        if exam.scheduled_start > now:
            exam.state = 'Upcoming'
            exam.state_badge = 'info'
        elif exam.scheduled_end < now:
            exam.state = 'Completed'
            exam.state_badge = 'secondary'
        else:
            exam.state = 'Active'
            exam.state_badge = 'success'

    return render(request, 'accounts/admin_dashboard.html', {
        'total_categories': total_categories,
        'total_questions': total_questions,
        'total_exams': total_exams,
        'recent_exams': recent_exams,
    })


@login_required
def student_dashboard(request):
    profile = getattr(request.user, 'profile', None)
    if not profile or profile.role != 'student':
        return redirect('admin_dashboard')

    now = timezone.now()
    student_attempts = {
        attempt.exam_id: attempt
        for attempt in ExamAttempt.objects.filter(student=request.user)
    }

    all_exams = Exam.objects.select_related('category').order_by('scheduled_start')

    available_exams = []
    upcoming_exams = []
    past_exams = []

    for exam in all_exams:
        attempt = student_attempts.get(exam.id)
        exam.user_attempt = attempt

        if exam.scheduled_start <= now <= exam.scheduled_end:
            if attempt and attempt.status == 'submitted':
                past_exams.append(exam)
            else:
                available_exams.append(exam)
        elif now < exam.scheduled_start:
            upcoming_exams.append(exam)
        else:
            past_exams.append(exam)

    return render(request, 'accounts/student_dashboard.html', {
        'available_exams': available_exams,
        'upcoming_exams': upcoming_exams,
        'past_exams': past_exams,
        'now': now,
    })
