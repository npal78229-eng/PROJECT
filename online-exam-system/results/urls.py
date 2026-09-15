from django.urls import path
from . import views

urlpatterns = [
    path('attempt/<int:attempt_id>/', views.exam_result, name='exam_result'),
]
