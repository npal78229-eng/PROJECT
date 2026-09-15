from django.contrib import admin
from .models import Response, Result


admin.site.register(Response)


@admin.register(Result)
class ResultAdmin(admin.ModelAdmin):
    list_display = ('attempt', 'score', 'total_marks', 'percentage', 'passed', 'evaluated_at')
    list_filter = ('passed',)
