from django import forms
from django.contrib.auth.forms import UserCreationForm
from django.contrib.auth.models import User


class StudentRegisterForm(UserCreationForm):
    """Public self-registration form. Always creates a 'student' role account
    (see accounts.signals) — admin/faculty accounts are promoted later via the
    Django admin site, not self-registered."""
    email = forms.EmailField(required=True)

    class Meta:
        model = User
        fields = ['username', 'email', 'password1', 'password2']
