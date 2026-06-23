from django.db import models
from django.core.validators import MinValueValidator, MaxValueValidator
from decimal import Decimal
from django.utils import timezone


class LoanProduct(models.Model):
    INTEREST_METHOD_CHOICES = [
        ('declining', 'Declining Balance'),
        ('flat', 'Flat Rate'),
    ]
    
    FREQUENCY_CHOICES = [
        ('daily', 'Daily'),
        ('weekly', 'Weekly'),
        ('monthly', 'Monthly'),
    ]
    
    product_name = models.CharField(max_length=100)
    product_code = models.CharField(max_length=20, unique=True)
    description = models.TextField(blank=True)
    
    # Amount range
    min_amount = models.DecimalField(max_digits=12, decimal_places=2)
    max_amount = models.DecimalField(max_digits=12, decimal_places=2)
    
    # Interest
    interest_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        validators=[MinValueValidator(0), MaxValueValidator(100)]
    )
    interest_method = models.CharField(
        max_length=20, 
        choices=INTEREST_METHOD_CHOICES, 
        default='declining'
    )
    
    # Term
    min_term_months = models.PositiveIntegerField(default=1)
    max_term_months = models.PositiveIntegerField(default=24)
    
    # Repayment
    repayment_frequency = models.CharField(
        max_length=10, 
        choices=FREQUENCY_CHOICES, 
        default='monthly'
    )
    
    # Fees
    processing_fee = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=0,
        help_text="Percentage of loan amount"
    )
    late_penalty_rate = models.DecimalField(
        max_digits=5, 
        decimal_places=2, 
        default=2,
        help_text="Daily penalty percentage"
    )
    
    # Status
    is_active = models.BooleanField(default=True)
    requires_guarantor = models.BooleanField(default=True)
    requires_collateral = models.BooleanField(default=False)
    
    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loan_products'
        ordering = ['product_name']
    
    def __str__(self):
        return f"{self.product_name} ({self.interest_rate}%)"


class Loan(models.Model):
    STATUS_CHOICES = [
        ('draft', 'Draft'),
        ('pending', 'Pending Approval'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed'),
        ('active', 'Active'),
        ('paid', 'Paid Off'),
        ('defaulted', 'Defaulted'),
        ('written_off', 'Written Off'),
        ('rejected', 'Rejected'),
    ]
    
    loan_no = models.CharField(max_length=20, unique=True)
    customer = models.ForeignKey('customers.Customer', on_delete=models.CASCADE, related_name='loans')
    product = models.ForeignKey(LoanProduct, on_delete=models.PROTECT, related_name='loans')
    branch = models.ForeignKey('branches.Branch', on_delete=models.SET_NULL, null=True, blank=True, related_name='loans')
    
    # Loan details
    principal = models.DecimalField(max_digits=12, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    term_months = models.PositiveIntegerField()
    repayment_frequency = models.CharField(max_length=10, choices=LoanProduct.FREQUENCY_CHOICES, default='monthly')
    interest_method = models.CharField(max_length=20, choices=LoanProduct.INTEREST_METHOD_CHOICES, default='declining')
    
    # Calculations
    total_interest = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_payable = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    outstanding_balance = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Dates
    application_date = models.DateField(auto_now_add=True)
    approval_date = models.DateField(null=True, blank=True)
    disbursement_date = models.DateField(null=True, blank=True)
    first_payment_date = models.DateField(null=True, blank=True)
    maturity_date = models.DateField(null=True, blank=True)
    closed_date = models.DateField(null=True, blank=True)
    
    # Status & Workflow
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='draft')
    is_overdue = models.BooleanField(default=False)
    days_overdue = models.IntegerField(default=0)
    notes = models.TextField(blank=True)
    
    # Approvals
    approved_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='approved_loans'
    )
    disbursed_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='disbursed_loans'
    )
    
    # Auditing
    created_by = models.ForeignKey(
        'accounts.User', 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True,
        related_name='created_loans'
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loans'
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['loan_no']),
            models.Index(fields=['customer', 'status']),
            models.Index(fields=['disbursement_date']),
            models.Index(fields=['maturity_date']),
        ]
    
    def __str__(self):
        return f"{self.loan_no} - {self.customer.full_name}"
    
    def calculate_schedule(self):
        """Generate repayment schedule using the loan calculator"""
        from .utils.calculations import LoanCalculator
        
        calculator = LoanCalculator(
            principal=self.principal,
            annual_interest_rate=float(self.interest_rate),
            term_months=self.term_months,
            disbursement_date=self.disbursement_date or self.application_date,
            repayment_frequency=self.repayment_frequency
        )
        
        schedule_data = calculator.generate_summary(
            method=self.interest_method
        )
        
        return schedule_data
    
    def update_outstanding(self):
        """Update outstanding balance based on payments"""
        total_paid = self.payments.filter(status='completed').aggregate(
            total=models.Sum('amount_paid')
        )['total'] or 0
        
        self.amount_paid = total_paid
        self.outstanding_balance = self.total_payable - total_paid
        
        if self.outstanding_balance <= 0:
            self.status = 'paid'
            self.closed_date = timezone.now().date()
        
        self.save()
    
    def check_overdue(self):
        """Check if loan has overdue payments"""
        from django.utils import timezone
        today = timezone.now().date()
        
        if self.status in ['paid', 'defaulted', 'written_off', 'rejected']:
            return
        
        overdue_schedules = self.schedules.filter(
            status__in=['pending', 'overdue'],
            due_date__lt=today
        )
        
        if overdue_schedules.exists():
            self.is_overdue = True
            self.days_overdue = (today - overdue_schedules.first().due_date).days
        else:
            self.is_overdue = False
            self.days_overdue = 0
        
        self.save()


class LoanSchedule(models.Model):
    STATUS_CHOICES = [
        ('pending', 'Pending'),
        ('paid', 'Paid'),
        ('overdue', 'Overdue'),
        ('partial', 'Partially Paid'),
    ]
    
    loan = models.ForeignKey(Loan, on_delete=models.CASCADE, related_name='schedules')
    installment_no = models.PositiveIntegerField()
    due_date = models.DateField()
    
    # Amounts
    principal_amount = models.DecimalField(max_digits=12, decimal_places=2)
    interest_amount = models.DecimalField(max_digits=12, decimal_places=2)
    penalty_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    total_due = models.DecimalField(max_digits=12, decimal_places=2)
    amount_paid = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    
    # Status
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default='pending')
    paid_date = models.DateField(null=True, blank=True)
    
    # Auditing
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        db_table = 'loan_schedules'
        ordering = ['loan', 'installment_no']
        unique_together = [['loan', 'installment_no']]
    
    def __str__(self):
        return f"{self.loan.loan_no} - Installment {self.installment_no}"
    
    @property
    def is_overdue(self):
        from django.utils import timezone
        return self.status in ['pending', 'partial'] and self.due_date < timezone.now().date()
    
    def mark_as_paid(self, amount=None):
        """Mark schedule as paid"""
        from django.utils import timezone
        
        if amount is None:
            amount = self.total_due
        
        self.amount_paid = amount
        self.status = 'paid' if amount >= self.total_due else 'partial'
        self.paid_date = timezone.now().date()
        self.save()