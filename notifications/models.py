from django.db import models
from django.utils import timezone

class Notification(models.Model):
    TYPE_CHOICES = [
        ('payment_reminder', 'Payment Reminder'),
        ('payment_received', 'Payment Received'),
        ('loan_approved', 'Loan Approved'),
        ('loan_disbursed', 'Loan Disbursed'),
        ('loan_overdue', 'Loan Overdue'),
        ('loan_defaulted', 'Loan Defaulted'),
        ('system', 'System Notification'),
    ]
    
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='notifications')
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, related_name='notifications', null=True, blank=True)
    
    title = models.CharField(max_length=200)
    message = models.TextField()
    notification_type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    
    # Delivery
    is_read = models.BooleanField(default=False)
    is_sent = models.BooleanField(default=False)
    sent_at = models.DateTimeField(null=True, blank=True)
    
    # Channels
    send_sms = models.BooleanField(default=False)
    send_email = models.BooleanField(default=False)
    send_app = models.BooleanField(default=True)
    
    # Tracking
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        db_table = 'notifications'
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.title} - {self.customer.full_name}"


class SMSLog(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
    ]
    
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='sms_logs')
    phone = models.CharField(max_length=15)
    message = models.TextField()
    delivery_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    provider_response = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    delivered_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'sms_logs'
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"SMS to {self.phone} - {self.delivery_status}"


class EmailLog(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('sent', 'Sent'),
        ('delivered', 'Delivered'),
        ('failed', 'Failed'),
        ('opened', 'Opened'),
        ('clicked', 'Clicked'),
    ]
    
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='email_logs')
    email = models.EmailField()
    subject = models.CharField(max_length=200)
    message = models.TextField()
    delivery_status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    provider_response = models.TextField(blank=True)
    sent_at = models.DateTimeField(auto_now_add=True)
    opened_at = models.DateTimeField(null=True, blank=True)
    
    class Meta:
        db_table = 'email_logs'
        ordering = ['-sent_at']
    
    def __str__(self):
        return f"Email to {self.email} - {self.delivery_status}"