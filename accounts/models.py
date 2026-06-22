from django.contrib.auth.models import AbstractUser
from django.db import models
from django.utils import timezone

class User(AbstractUser):
    ROLE_CHOICES = [
        ('admin', 'System Admin'),
        ('manager', 'Branch Manager'),
        ('officer', 'Loan Officer'),
        ('teller', 'Teller'),
        ('viewer', 'Read Only'),
    ]
    
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default='officer')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True)
    phone = models.CharField(max_length=15, blank=True)
    is_active = models.BooleanField(default=True)
    last_login_ip = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'users'
        ordering = ['-date_joined']
    
    def __str__(self):
        return f"{self.get_full_name()} ({self.username})"