from django.db import models

from exams.models import ExamAttempt, ExamQuestion


class Response(models.Model):
    """A student's saved answer to one question within one attempt (saved via AJAX as they go)."""
    attempt = models.ForeignKey(ExamAttempt, on_delete=models.CASCADE, related_name='responses')
    exam_question = models.ForeignKey(ExamQuestion, on_delete=models.CASCADE, related_name='responses')
    selected_option = models.CharField(max_length=1, blank=True, null=True)
    answered_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ('attempt', 'exam_question')

    def __str__(self):
        return f"Attempt #{self.attempt_id} -> {self.selected_option or '(unanswered)'}"


class Result(models.Model):
    """Computed once, when an attempt is submitted/auto-submitted and evaluated."""
    attempt = models.OneToOneField(ExamAttempt, on_delete=models.CASCADE, related_name='result')
    score = models.PositiveIntegerField(default=0)
    total_marks = models.PositiveIntegerField(default=0)
    percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    passed = models.BooleanField(default=False)
    evaluated_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.attempt.student.username} - {self.attempt.exam.title}: {self.score}/{self.total_marks}"
