from django.contrib import admin
from .models import Category, Question


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)
    search_fields = ('name',)


@admin.register(Question)
class QuestionAdmin(admin.ModelAdmin):
    list_display = ('text', 'category', 'correct_option', 'marks')
    list_filter = ('category',)
    search_fields = ('text',)
