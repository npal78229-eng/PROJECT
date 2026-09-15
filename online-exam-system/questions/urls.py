from django.urls import path
from . import views

urlpatterns = [
    path('', views.question_list, name='question_list'),
    path('add/', views.question_create, name='question_create'),
    path('<int:pk>/edit/', views.question_edit, name='question_edit'),
    path('<int:pk>/delete/', views.question_delete, name='question_delete'),
    path('categories/', views.category_list, name='category_list'),
    path('categories/<int:pk>/delete/', views.category_delete, name='category_delete'),
]
