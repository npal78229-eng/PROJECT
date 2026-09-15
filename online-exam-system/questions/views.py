from django.contrib import messages
from django.db.models import Count
from django.shortcuts import get_object_or_404, redirect, render

from accounts.decorators import admin_required
from .forms import CategoryForm, QuestionForm
from .models import Category, Question


@admin_required
def category_list(request):
    if request.method == 'POST':
        form = CategoryForm(request.POST)
        if form.is_valid():
            cat = form.save()
            messages.success(request, f'Category "{cat.name}" created successfully.')
            return redirect('category_list')
    else:
        form = CategoryForm()

    categories = Category.objects.annotate(question_count=Count('questions')).order_by('name')
    return render(request, 'questions/category_list.html', {
        'categories': categories,
        'form': form,
    })


@admin_required
def category_delete(request, pk):
    category = get_object_or_404(Category, pk=pk)
    if request.method == 'POST':
        name = category.name
        category.delete()
        messages.success(request, f'Category "{name}" and associated questions deleted.')
        return redirect('category_list')
    return render(request, 'questions/category_confirm_delete.html', {'category': category})


@admin_required
def question_list(request):
    category_id = request.GET.get('category')
    categories = Category.objects.all().order_by('name')

    questions = Question.objects.select_related('category').order_by('-created_at')
    if category_id:
        questions = questions.filter(category_id=category_id)

    selected_category = None
    if category_id:
        try:
            selected_category = Category.objects.get(pk=category_id)
        except Category.DoesNotExist:
            pass

    return render(request, 'questions/question_list.html', {
        'questions': questions,
        'categories': categories,
        'selected_category': selected_category,
    })


@admin_required
def question_create(request):
    if request.method == 'POST':
        form = QuestionForm(request.POST)
        if form.is_valid():
            question = form.save()
            messages.success(request, 'Question added successfully to the question bank.')
            return redirect('question_list')
    else:
        initial = {}
        category_id = request.GET.get('category')
        if category_id:
            initial['category'] = category_id
        form = QuestionForm(initial=initial)

    return render(request, 'questions/question_form.html', {
        'form': form,
        'title': 'Add New Question',
        'button_text': 'Add Question',
    })


@admin_required
def question_edit(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.method == 'POST':
        form = QuestionForm(request.POST, instance=question)
        if form.is_valid():
            form.save()
            messages.success(request, 'Question updated successfully.')
            return redirect('question_list')
    else:
        form = QuestionForm(instance=question)

    return render(request, 'questions/question_form.html', {
        'form': form,
        'question': question,
        'title': 'Edit Question',
        'button_text': 'Update Question',
    })


@admin_required
def question_delete(request, pk):
    question = get_object_or_404(Question, pk=pk)
    if request.method == 'POST':
        question.delete()
        messages.success(request, 'Question deleted successfully.')
        return redirect('question_list')
    return render(request, 'questions/question_confirm_delete.html', {'question': question})
