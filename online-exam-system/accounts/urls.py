from django.urls import path
from . import views

urlpatterns = [
    path('', views.RoleBasedLoginView.as_view(), name='login'),
    path('register/', views.register, name='register'),
    path('logout/', views.RoleBasedLogoutView.as_view(), name='logout'),
    path('dashboard/admin/', views.admin_dashboard, name='admin_dashboard'),
    path('dashboard/student/', views.student_dashboard, name='student_dashboard'),
]
