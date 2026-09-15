from django.contrib.auth.models import User
from django.db.models.signals import post_save
from django.dispatch import receiver

from .models import Profile


@receiver(post_save, sender=User)
def create_profile_for_new_user(sender, instance, created, **kwargs):
    """
    Every User automatically gets a Profile.
    Superusers (e.g. created via `createsuperuser`) get role='admin' automatically;
    everyone else defaults to 'student'. Faculty/admin accounts for existing users
    can be promoted later from the Django admin site (edit their Profile -> role).
    """
    if created:
        Profile.objects.get_or_create(
            user=instance,
            defaults={'role': 'admin' if instance.is_superuser else 'student'},
        )
