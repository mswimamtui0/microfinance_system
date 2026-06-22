from django.db import models

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('create', 'Create'),
        ('update', 'Update'),
        ('delete', 'Delete'),
        ('login', 'Login'),
        ('logout', 'Logout'),
        ('view', 'View'),
        ('approve', 'Approve'),
        ('reject', 'Reject'),
    ]
    
    user = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, 
                             null=True, related_name='audit_logs')
    action = models.CharField(max_length=20, choices=ACTION_CHOICES)
    table_name = models.CharField(max_length=50)
    record_id = models.CharField(max_length=20)
    
    # Details
    old_values = models.JSONField(default=dict, blank=True)
    new_values = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    user_agent = models.TextField(blank=True)
    
    # Timestamp
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'audit_logs'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['table_name', 'record_id']),
            models.Index(fields=['user', 'action']),
        ]
    
    def __str__(self):
        return f"{self.user} - {self.action} - {self.table_name}"