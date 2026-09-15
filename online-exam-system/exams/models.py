from django.conf import settings
from django.db import models

from questions.models import Category, Question


class Exam(models.Model):
    title = models.CharField(max_length=200)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='exams')
    duration_minutes = models.PositiveIntegerField(help_text='How long a student has, in minutes')
    total_questions = models.PositiveIntegerField(
        help_text='How many questions to randomly pick from this category for each attempt'
    )
    passing_marks = models.PositiveIntegerField()
    scheduled_start = models.DateTimeField()
    scheduled_end = models.DateTimeField()
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='exams_created'
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title

    def is_open(self, now):
        return self.scheduled_start <= now <= self.scheduled_end


class ExamAttempt(models.Model):
    """
    One student's attempt at an exam.
    `ends_at` is the SERVER-SIDE authoritative end time (Day 3's timer syncs to this,
    not to a value calculated fresh in the browser) — this is what stops the timer
    from resetting on refresh or being manipulated via dev tools.
    """
    STATUS_CHOICES = (
        ('in_progress', 'In Progress'),
        ('submitted', 'Submitted'),
        ('expired', 'Expired'),
    )

    exam = models.ForeignKey(Exam, on_delete=models.CASCADE, related_name='attempts')
    student = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='exam_attempts', db_index=True
    )
    started_at = models.DateTimeField(auto_now_add=True)
    ends_at = models.DateTimeField()
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='in_progress')
    submitted_at = models.DateTimeField(null=True, blank=True)
    tab_switch_count = models.PositiveIntegerField(default=0)  # used by Day 4's anti-cheat feature

    class Meta:
        indexes = [models.Index(fields=['student', 'exam'])]

    def __str__(self):
        return f"{self.student.username} - {self.exam.title} ({self.status})"


class ExamQuestion(models.Model):
    """
    The specific, randomly-chosen questions locked into ONE attempt.
    Selected once when the attempt starts and never re-randomized afterwards
    (see Day 3 notes: re-randomizing on every page load is the #1 exam-engine bug).
    """
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='exam_questions')
    question = models.ForeignKey(Question, on_delete=models.CASCADE)
    order = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ['order']
        unique_together = ('attempt', 'question')

    def __str__(self):
        return f"Q{self.order} for attempt #{self.attempt_id}"
