from django.contrib import admin
from .models import Exam, ExamAttempt, ExamQuestion


@admin.register(Exam)
class ExamAdmin(admin.ModelAdmin):
    list_display = ('title', 'category', 'duration_minutes', 'total_questions', 'scheduled_start', 'scheduled_end')
    list_filter = ('category',)
    search_fields = ('title',)


@admin.register(ExamAttempt)
class ExamAttemptAdmin(admin.ModelAdmin):
    list_display = ('student', 'exam', 'status', 'started_at', 'ends_at', 'tab_switch_count')
    list_filter = ('status', 'exam')


admin.site.register(ExamQuestion)
