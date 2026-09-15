from functools import wraps
from django.contrib import messages
from django.shortcuts import redirect


def admin_required(view_func):
    """
    Decorator for views that checks that the logged-in user has an 'admin' role.
    Redirects non-admin users to the student dashboard with a warning message.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'admin':
            messages.error(request, 'Access denied. Administrator / Faculty privileges required.')
            return redirect('student_dashboard')
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def student_required(view_func):
    """
    Decorator for views that checks that the logged-in user has a 'student' role.
    Redirects non-student users to the admin dashboard with a warning message.
    """
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_authenticated:
            return redirect('login')
        profile = getattr(request.user, 'profile', None)
        if not profile or profile.role != 'student':
            messages.error(request, 'Access denied. Student portal only.')
            return redirect('admin_dashboard')
        return view_func(request, *args, **kwargs)
    return _wrapped_view
