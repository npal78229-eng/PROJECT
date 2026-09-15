from django.urls import path
from . import views

urlpatterns = [
    path('', views.exam_list, name='exam_list'),
    path('create/', views.exam_create, name='exam_create'),
    path('<int:pk>/', views.exam_detail, name='exam_detail'),
    path('<int:pk>/edit/', views.exam_edit, name='exam_edit'),
    path('<int:pk>/delete/', views.exam_delete, name='exam_delete'),
    path('<int:pk>/start/', views.start_exam, name='start_exam'),
    path('attempt/<int:attempt_id>/', views.take_exam, name='take_exam'),
    path('attempt/<int:attempt_id>/save-response/', views.save_response, name='save_response'),
    path('attempt/<int:attempt_id>/submit/', views.submit_exam, name='submit_exam'),
    path('attempt/<int:attempt_id>/record-tab-switch/', views.record_tab_switch, name='record_tab_switch'),
]
