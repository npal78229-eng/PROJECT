from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', include('accounts.urls')),
    path('accounts/', include('accounts.urls')),
    path('questions/', include('questions.urls')),
    path('exams/', include('exams.urls')),
    path('results/', include('results.urls')),
]
