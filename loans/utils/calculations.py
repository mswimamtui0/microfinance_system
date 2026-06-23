from decimal import Decimal
from datetime import datetime, timedelta, date
from dateutil.relativedelta import relativedelta
import logging

logger = logging.getLogger(__name__)


class LoanCalculator:
    """
    Professional Loan Calculation Engine for Microfinance.
    Supports flexible repayment frequencies and real-time calculations.
    """
    
    def __init__(self, loan):
        """
        Initialize the loan calculator with a loan object.
        """
        self.loan = loan
        self.principal = Decimal(str(loan.principal))
        self.annual_rate = Decimal(str(loan.interest_rate)) / Decimal('100')
        self.term_months = loan.term_months
        self.disbursement_date = loan.disbursement_date or loan.application_date
        self.frequency = loan.repayment_frequency
        self.total_payable = Decimal(str(loan.total_payable))
        
        # Get product settings
        self.product = loan.product
        self.penalty_rate = Decimal(str(self.product.penalty_rate)) / Decimal('100')
        self.grace_period = self.product.grace_period_days
        self.percentage = self.product.get_repayment_percentage()
        
    def get_total_days(self):
        """Get total days for the loan term"""
        return self.term_months * 30
    
    def get_period_days(self):
        """Get days per payment period"""
        if self.frequency == 'daily':
            return 1
        elif self.frequency == 'weekly':
            return 7
        elif self.frequency == 'monthly':
            return 30
        elif self.frequency == 'custom':
            return self.product.custom_frequency_days or 30
        return 30
    
    def get_total_payments(self):
        """Get total number of payments"""
        total_days = self.get_total_days()
        period_days = self.get_period_days()
        return total_days // period_days
    
    def get_payment_amount(self):
        """Get amount due per payment period"""
        percentage = self.percentage
        return self.total_payable * Decimal(str(percentage))
    
    def get_daily_amount(self):
        """Get daily payment amount"""
        return self.total_payable / Decimal(str(self.get_total_days()))
    
    def get_second_amount(self):
        """Get per second payment amount"""
        return self.daily_amount() / Decimal('86400')
    
    def get_minute_amount(self):
        """Get per minute payment amount"""
        return self.get_second_amount() * Decimal('60')
    
    def get_hour_amount(self):
        """Get per hour payment amount"""
        return self.get_minute_amount() * Decimal('60')
    
    def get_week_amount(self):
        """Get per week payment amount"""
        return self.get_daily_amount() * Decimal('7')
    
    def get_month_amount(self):
        """Get per month payment amount"""
        return self.get_daily_amount() * Decimal('30')
    
    def daily_amount(self):
        """Alias for get_daily_amount"""
        return self.get_daily_amount()
    
    def calculate_amortization_schedule(self):
        """
        Generate the full repayment schedule based on frequency.
        """
        schedule = []
        total_payments = self.get_total_payments()
        payment_amount = self.get_payment_amount()
        
        if total_payments <= 0:
            return schedule
        
        current_date = self.disbursement_date
        period_days = self.get_period_days()
        
        for i in range(total_payments):
            # Calculate due date
            due_date = current_date + timedelta(days=period_days * (i + 1))
            
            # For last payment, adjust to match total
            if i == total_payments - 1:
                remaining = self.total_payable - (payment_amount * Decimal(str(total_payments - 1)))
                amount = remaining
            else:
                amount = payment_amount
            
            schedule.append({
                'installment_no': i + 1,
                'due_date': due_date,
                'principal_amount': amount * Decimal('0.7'),  # Approximate principal portion
                'interest_amount': amount * Decimal('0.3'),   # Approximate interest portion
                'penalty_amount': Decimal('0'),
                'total_due': amount,
                'status': 'pending',
                'balance_after': self.total_payable - (amount * Decimal(str(i + 1)))
            })
            
            current_date = due_date
        
        return schedule
    
    def calculate_penalty(self, due_date, payment_date):
        """
        Calculate penalty for late payment.
        """
        if payment_date <= due_date:
            return Decimal('0')
        
        days_overdue = (payment_date - due_date).days
        
        # Check grace period
        if days_overdue <= self.grace_period:
            return Decimal('0')
        
        # Calculate penalty
        period_days = self.get_period_days()
        overdue_periods = days_overdue / period_days
        penalty = self.get_payment_amount() * self.penalty_rate * Decimal(str(overdue_periods))
        
        return penalty.quantize(Decimal('0.01'))
    
    def get_current_status(self, as_of_date=None):
        """
        Get the current loan status including real-time amounts.
        """
        if as_of_date is None:
            as_of_date = date.today()
        
        # Calculate elapsed time
        elapsed_days = (as_of_date - self.disbursement_date).days
        
        # Calculate expected payments
        period_days = self.get_period_days()
        payments_due = elapsed_days // period_days
        expected_paid = self.get_payment_amount() * Decimal(str(payments_due))
        
        # Calculate daily amounts
        daily = self.get_daily_amount()
        hourly = self.get_hour_amount()
        minute = self.get_minute_amount()
        second = self.get_second_amount()
        
        # Check if overdue
        is_overdue = False
        days_overdue = 0
        penalty = Decimal('0')
        
        # Find next due date
        next_due_date = self.disbursement_date + timedelta(days=period_days * (payments_due + 1))
        
        if as_of_date > next_due_date:
            is_overdue = True
            days_overdue = (as_of_date - next_due_date).days
            penalty = self.calculate_penalty(next_due_date, as_of_date)
        
        return {
            'loan_id': self.loan.id,
            'loan_no': self.loan.loan_no,
            'principal': self.principal,
            'total_payable': self.total_payable,
            'amount_paid': self.loan.amount_paid,
            'outstanding_balance': self.total_payable - self.loan.amount_paid,
            
            'time_elapsed': {
                'days': elapsed_days,
                'hours': elapsed_days * 24,
                'minutes': elapsed_days * 24 * 60,
                'seconds': elapsed_days * 24 * 60 * 60,
            },
            
            'per_second': second,
            'per_minute': minute,
            'per_hour': hourly,
            'per_day': daily,
            'per_week': self.get_week_amount(),
            'per_month': self.get_month_amount(),
            
            'payments_due': payments_due,
            'expected_paid': expected_paid,
            'next_due_date': next_due_date,
            'is_overdue': is_overdue,
            'days_overdue': days_overdue,
            'penalty': penalty,
            
            'status': self.loan.status,
            'maturity_date': self.disbursement_date + timedelta(days=self.get_total_days()),
        }
    
    def calculate_early_repayment(self, payment_date=None):
        """
        Calculate early repayment amount.
        Early repayment = Full total payable (no interest reduction)
        Only penalty if applicable.
        """
        if payment_date is None:
            payment_date = date.today()
        
        total_payable = self.total_payable
        amount_paid = self.loan.amount_paid
        
        # Check if any penalty applies
        total_penalty = Decimal('0')
        
        # Check all overdue schedules
        schedules = self.loan.schedules.filter(status__in=['pending', 'overdue'])
        for schedule in schedules:
            if schedule.due_date < payment_date:
                penalty = self.calculate_penalty(schedule.due_date, payment_date)
                total_penalty += penalty
        
        final_amount = total_payable - amount_paid + total_penalty
        
        return {
            'total_payable': total_payable,
            'amount_paid': amount_paid,
            'outstanding': total_payable - amount_paid,
            'penalty': total_penalty,
            'final_amount': final_amount,
            'early_repayment_fee': self.product.early_repayment_fee,
            'fee_amount': final_amount * (Decimal(str(self.product.early_repayment_fee)) / Decimal('100')),
            'total_to_pay': final_amount + (final_amount * (Decimal(str(self.product.early_repayment_fee)) / Decimal('100'))),
            'message': 'Loan will be fully paid after this payment'
        }
    
    def generate_summary(self):
        """
        Generate a complete summary of the loan.
        """
        schedule = self.calculate_amortization_schedule()
        current_status = self.get_current_status()
        
        return {
            'loan': {
                'id': self.loan.id,
                'loan_no': self.loan.loan_no,
                'customer': str(self.loan.customer),
                'product': str(self.loan.product),
                'principal': self.principal,
                'interest_rate': self.annual_rate * 100,
                'term_months': self.term_months,
                'total_interest': self.loan.total_interest,
                'total_payable': self.total_payable,
            },
            'repayment': {
                'frequency': self.frequency,
                'period_days': self.get_period_days(),
                'payment_amount': self.get_payment_amount(),
                'total_payments': self.get_total_payments(),
                'daily_amount': self.get_daily_amount(),
                'hourly_amount': self.get_hour_amount(),
                'minute_amount': self.get_minute_amount(),
                'second_amount': self.get_second_amount(),
            },
            'schedule': schedule,
            'current_status': current_status,
            'next_due_date': current_status['next_due_date'],
        }


class RepaymentScheduleGenerator:
    """
    Generate and manage repayment schedules.
    """
    
    @staticmethod
    def generate_schedule(loan):
        """
        Generate repayment schedule for a loan.
        """
        calculator = LoanCalculator(loan)
        schedule_data = calculator.calculate_amortization_schedule()
        
        # Save schedule to database
        from ..models import LoanSchedule
        
        for item in schedule_data:
            LoanSchedule.objects.create(
                loan=loan,
                installment_no=item['installment_no'],
                due_date=item['due_date'],
                principal_amount=item['principal_amount'],
                interest_amount=item['interest_amount'],
                penalty_amount=item['penalty_amount'],
                total_due=item['total_due'],
                status='pending'
            )
        
        return schedule_data
    
    @staticmethod
    def update_penalties(loan):
        """
        Update penalties for all overdue schedules.
        """
        from ..models import LoanSchedule
        from django.utils import timezone
        
        today = timezone.now().date()
        calculator = LoanCalculator(loan)
        
        schedules = loan.schedules.filter(status__in=['pending', 'overdue'])
        total_penalty = Decimal('0')
        
        for schedule in schedules:
            if schedule.due_date < today:
                penalty = calculator.calculate_penalty(schedule.due_date, today)
                schedule.penalty_amount = penalty
                schedule.total_due = schedule.total_due + penalty
                schedule.status = 'overdue'
                schedule.save()
                total_penalty += penalty
        
        return total_penalty