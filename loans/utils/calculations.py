from decimal import Decimal
from datetime import datetime, timedelta
from dateutil.relativedelta import relativedelta
import logging

logger = logging.getLogger(__name__)

class LoanCalculator:
    """
    Professional Loan Calculation Engine for Microfinance.
    Supports multiple repayment frequencies and calculation methods.
    """
    
    def __init__(self, principal, annual_interest_rate, term_months, 
                 disbursement_date, repayment_frequency='monthly'):
        """
        Initialize the loan calculator.
        
        Args:
            principal (Decimal): Loan principal amount
            annual_interest_rate (float): Annual interest rate (e.g., 2 for 2%)
            term_months (int): Loan term in months
            disbursement_date (date): When the loan is disbursed
            repayment_frequency (str): 'weekly', 'monthly', or 'daily'
        """
        self.principal = Decimal(str(principal))
        self.annual_rate = Decimal(str(annual_interest_rate)) / Decimal('100')
        self.term_months = term_months
        self.disbursement_date = disbursement_date
        self.frequency = repayment_frequency
        self.monthly_rate = self.annual_rate / Decimal('12')
        
    def get_total_installments(self):
        """Calculate the total number of installments based on frequency."""
        if self.frequency == 'weekly':
            return self.term_months * 4  # Approximate
        elif self.frequency == 'daily':
            return self.term_months * 30
        else:  # monthly
            return self.term_months
    
    def calculate_amortization_schedule(self, method='declining_balance'):
        """
        Generate the full repayment schedule.
        
        Args:
            method (str): 'declining_balance' or 'flat_rate'
        
        Returns:
            list: List of dictionaries with schedule details
        """
        schedule = []
        total_installments = self.get_total_installments()
        
        if total_installments <= 0:
            return schedule
            
        # Calculate payment amounts based on method
        if method == 'flat_rate':
            # Simple flat rate: Interest is calculated on the full principal for the entire term
            total_interest = self.principal * self.monthly_rate * self.term_months
            total_amount = self.principal + total_interest
            installment_amount = total_amount / Decimal(str(total_installments))
            interest_per_installment = total_interest / Decimal(str(total_installments))
            principal_per_installment = self.principal / Decimal(str(total_installments))
            
            for i in range(total_installments):
                due_date = self.get_due_date(i)
                schedule.append({
                    'installment_no': i + 1,
                    'due_date': due_date,
                    'principal_amount': principal_per_installment,
                    'interest_amount': interest_per_installment,
                    'penalty_amount': Decimal('0'),
                    'total_due': installment_amount,
                    'status': 'pending',
                    'balance_after': self.principal - (principal_per_installment * (i + 1))
                })
                
        else:  # Declining balance (standard for microfinance)
            # Calculate equal installment using annuity formula
            monthly_payment = self.calculate_monthly_payment()
            
            remaining_balance = self.principal
            
            for i in range(total_installments):
                if remaining_balance <= 0:
                    break
                    
                # Calculate interest for this period
                period_interest = remaining_balance * (self.monthly_rate / Decimal('12'))
                
                # Principal portion
                period_principal = monthly_payment - period_interest
                
                # Handle last payment adjustment
                if i == total_installments - 1 or period_principal >= remaining_balance:
                    period_principal = remaining_balance
                    period_interest = remaining_balance * (self.monthly_rate / Decimal('12'))
                    monthly_payment = period_principal + period_interest
                
                due_date = self.get_due_date(i)
                schedule.append({
                    'installment_no': i + 1,
                    'due_date': due_date,
                    'principal_amount': period_principal,
                    'interest_amount': period_interest,
                    'penalty_amount': Decimal('0'),
                    'total_due': monthly_payment,
                    'status': 'pending',
                    'balance_after': remaining_balance - period_principal
                })
                
                remaining_balance -= period_principal
                
        return schedule
    
    def calculate_monthly_payment(self):
        """
        Calculate the fixed monthly payment using the standard annuity formula:
        P = (r * PV) / (1 - (1 + r)^-n)
        Where:
        P = monthly payment
        r = monthly interest rate
        PV = present value (principal)
        n = number of payments
        """
        n = self.term_months
        r = self.monthly_rate
        
        if r == 0:
            return self.principal / Decimal(str(n))
        
        # (1 + r)^-n
        discount_factor = (Decimal('1') + r) ** (-n)
        denominator = Decimal('1') - discount_factor
        monthly_payment = (r * self.principal) / denominator
        
        return monthly_payment.quantize(Decimal('0.01'))
    
    def get_due_date(self, installment_index):
        """Calculate the due date for a specific installment."""
        if self.frequency == 'weekly':
            return self.disbursement_date + timedelta(days=(installment_index + 1) * 7)
        elif self.frequency == 'daily':
            return self.disbursement_date + timedelta(days=installment_index + 1)
        else:  # monthly
            return self.disbursement_date + relativedelta(months=installment_index + 1)
    
    def calculate_penalty(self, overdue_amount, days_overdue, penalty_rate=2.0):
        """
        Calculate penalty for overdue payments.
        
        Args:
            overdue_amount (Decimal): Amount overdue
            days_overdue (int): Number of days overdue
            penalty_rate (float): Penalty rate per day (e.g., 2%)
        
        Returns:
            Decimal: Penalty amount
        """
        if days_overdue <= 0:
            return Decimal('0')
            
        daily_rate = Decimal(str(penalty_rate)) / Decimal('100')
        penalty = overdue_amount * daily_rate * Decimal(str(days_overdue))
        return penalty.quantize(Decimal('0.01'))
    
    def generate_summary(self, method='declining_balance'):
        """
        Generate a summary of the loan calculations.
        
        Returns:
            dict: Summary with key metrics
        """
        schedule = self.calculate_amortization_schedule(method)
        total_interest = sum(item['interest_amount'] for item in schedule)
        total_principal = sum(item['principal_amount'] for item in schedule)
        total_payable = total_principal + total_interest
        
        return {
            'principal': self.principal,
            'total_interest': total_interest,
            'total_payable': total_payable,
            'number_of_installments': len(schedule),
            'first_due_date': schedule[0]['due_date'] if schedule else None,
            'last_due_date': schedule[-1]['due_date'] if schedule else None,
            'schedule': schedule
        }