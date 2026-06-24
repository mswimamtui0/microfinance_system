from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator

class Customer(models.Model):
    GENDER_CHOICES = [
        ('M', 'Male'),
        ('F', 'Female'),
        ('O', 'Other'),
    ]
    
    STATUS_CHOICES = [
        ('active', 'Active'),
        ('inactive', 'Inactive'),
        ('blacklisted', 'Blacklisted'),
        ('deceased', 'Deceased'),
    ]
    
    RISK_LEVEL_CHOICES = [
        ('low', 'Low Risk'),
        ('medium', 'Medium Risk'),
        ('high', 'High Risk'),
    ]
    
    customer_no = models.CharField(max_length=20, unique=True)
    phone = models.CharField(max_length=15)
    nida_number = models.CharField(max_length=20, unique=True, null=True, blank=True)
    email = models.EmailField(blank=True)
    
    # REMOVE THESE FIELDS (Customer Portal)
    # username = models.CharField(max_length=50, unique=True, null=True, blank=True)
    # password = models.CharField(max_length=128, null=True, blank=True)
    # is_portal_active = models.BooleanField(default=False)
    # last_login = models.DateTimeField(null=True, blank=True)
    # login_attempts = models.IntegerField(default=0)
    # locked_until = models.DateTimeField(null=True, blank=True)
    
    first_name = models.CharField(max_length=50)
    middle_name = models.CharField(max_length=50, blank=True)
    last_name = models.CharField(max_length=50)
    gender = models.CharField(max_length=1, choices=GENDER_CHOICES)
    date_of_birth = models.DateField()
    
    region = models.CharField(max_length=50)
    district = models.CharField(max_length=50)
    ward = models.CharField(max_length=50, blank=True)
    street = models.CharField(max_length=100, blank=True)
    
    occupation = models.CharField(max_length=100)
    monthly_income = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    risk_level = models.CharField(max_length=10, choices=RISK_LEVEL_CHOICES, default='medium')
    status = models.CharField(max_length=15, choices=STATUS_CHOICES, default='active')
    
    created_by = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, related_name='created_customers')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, related_name='customers')
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'customers'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['customer_no']),
            models.Index(fields=['nida_number']),
            models.Index(fields=['phone']),
        ]
    
    def __str__(self):
        return f"{self.customer_no} - {self.first_name} {self.last_name}"
    
    @property
    def full_name(self):
        return f"{self.first_name} {self.middle_name} {self.last_name}".strip()
    
    @property
    def age(self):
        from datetime import date
        today = date.today()
        return today.year - self.date_of_birth.year - ((today.month, today.day) < (self.date_of_birth.month, self.date_of_birth.day))