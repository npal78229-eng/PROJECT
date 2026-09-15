from django import forms
from django.utils import timezone
from questions.models import Question
from .models import Exam


class ExamForm(forms.ModelForm):
    class Meta:
        model = Exam
        fields = [
            'title',
            'category',
            'duration_minutes',
            'total_questions',
            'passing_marks',
            'scheduled_start',
            'scheduled_end',
        ]
        widgets = {
            'title': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. Midterm Examination 2026'}),
            'category': forms.Select(attrs={'class': 'form-select'}),
            'duration_minutes': forms.NumberInput(attrs={'class': 'form-control', 'min': 1, 'placeholder': '60'}),
            'total_questions': forms.NumberInput(attrs={'class': 'form-control', 'min': 1, 'placeholder': '20'}),
            'passing_marks': forms.NumberInput(attrs={'class': 'form-control', 'min': 1, 'placeholder': '12'}),
            'scheduled_start': forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
            'scheduled_end': forms.DateTimeInput(attrs={'type': 'datetime-local', 'class': 'form-control'}),
        }

    def clean(self):
        cleaned_data = super().clean()
        start = cleaned_data.get('scheduled_start')
        end = cleaned_data.get('scheduled_end')
        category = cleaned_data.get('category')
        total_questions = cleaned_data.get('total_questions')

        if start and end and end <= start:
            self.add_error('scheduled_end', 'Scheduled end time must be after the start time.')

        if category and total_questions:
            available_q_count = Question.objects.filter(category=category).count()
            if total_questions > available_q_count:
                self.add_error(
                    'total_questions',
                    f'The selected category "{category.name}" only has {available_q_count} questions in the bank. '
                    f'You cannot request {total_questions} questions.'
                )

        return cleaned_data
