from django.db import models

class Payment(models.Model):
    METHOD_CHOICES = [
        ('cash', 'Cash'),
        ('bank', 'Bank Transfer'),
        ('mpesa', 'M-Pesa'),
        ('airtel', 'Airtel Money'),
        ('cheque', 'Cheque'),
        ('other', 'Other'),
        ('mixx', 'Mixx by Yas'),
    ]
    
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
        ('reversed', 'Reversed'),
    ]
    
    loan = models.ForeignKey('loans.Loan', on_delete=models.CASCADE, related_name='payments')
    schedule = models.ForeignKey('loans.LoanSchedule', on_delete=models.CASCADE, 
                                 related_name='payments', null=True, blank=True)
    
    # Payment details
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2)
    principal_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    interest_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    penalty_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    payment_method = models.CharField(max_length=10, choices=METHOD_CHOICES)
    transaction_ref = models.CharField(max_length=50, unique=True)
    payment_date = models.DateTimeField()
    
    # Additional info
    received_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True,
                                    related_name='received_payments')
    notes = models.TextField(blank=True)
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='completed')
    
    # Mobile money specific
    msisdn = models.CharField(max_length=15, blank=True)
    mpesa_receipt = models.CharField(max_length=20, blank=True)
    
    # Auditing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'payments'
        ordering = ['-payment_date']
        indexes = [
            models.Index(fields=['transaction_ref']),
            models.Index(fields=['payment_date']),
        ]
    
    def __str__(self):
        return f"{self.transaction_ref} - {self.amount_paid}"
    
    def save(self, *args, **kwargs):
        if not self.transaction_ref:
            import uuid
            self.transaction_ref = f"PAY-{uuid.uuid4().hex[:8].upper()}"
        
        super().save(*args, **kwargs)