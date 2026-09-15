from django.urls import path
from . import views

urlpatterns = [
    path('reports/', views.exam_reports, name='exam_reports'),
    path('attempt/<int:attempt_id>/', views.exam_result, name='exam_result'),
]
