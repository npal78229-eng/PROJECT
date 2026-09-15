from django import forms
from .models import Category, Question


class CategoryForm(forms.ModelForm):
    class Meta:
        model = Category
        fields = ['name']
        widgets = {
            'name': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'e.g. Data Structures & Algorithms'}),
        }


class QuestionForm(forms.ModelForm):
    class Meta:
        model = Question
        fields = ['category', 'text', 'option_a', 'option_b', 'option_c', 'option_d', 'correct_option', 'marks']
        widgets = {
            'category': forms.Select(attrs={'class': 'form-select'}),
            'text': forms.Textarea(attrs={'class': 'form-control', 'rows': 3, 'placeholder': 'Enter the question text...'}),
            'option_a': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Option A'}),
            'option_b': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Option B'}),
            'option_c': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Option C'}),
            'option_d': forms.TextInput(attrs={'class': 'form-control', 'placeholder': 'Option D'}),
            'correct_option': forms.Select(attrs={'class': 'form-select'}),
            'marks': forms.NumberInput(attrs={'class': 'form-control', 'min': 1}),
        }
