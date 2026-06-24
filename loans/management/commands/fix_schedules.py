from django.core.management.base import BaseCommand
from loans.models import Loan, LoanSchedule
from loans.utils.calculations import LoanCalculator, RepaymentScheduleGenerator
from datetime import timedelta

class Command(BaseCommand):
    help = 'Fix loan schedules'

    def add_arguments(self, parser):
        parser.add_argument('--loan', type=str, help='Specific loan number')
        parser.add_argument('--all', action='store_true', help='Fix all active loans')

    def handle(self, *args, **options):
        if options['loan']:
            loan_number = options['loan']
            try:
                loan = Loan.objects.get(loan_no=loan_number)
                self.fix_loan(loan)
            except Loan.DoesNotExist:
                self.stdout.write(self.style.ERROR(f'Loan {loan_number} not found'))
                self.show_all_loans()
        
        elif options['all']:
            loans = Loan.objects.filter(status__in=['active', 'disbursed'])
            for loan in loans:
                self.fix_loan(loan)
        
        else:
            self.stdout.write(self.style.WARNING('Specify --loan or --all'))
            self.show_all_loans()

    def fix_loan(self, loan):
        self.stdout.write(f'\n🔧 Fixing {loan.loan_no}...')
        
        # Delete old schedules
        old_count = loan.schedules.count()
        loan.schedules.all().delete()
        self.stdout.write(f'   Deleted {old_count} old schedules')
        
        # Use the calculator directly
        calculator = LoanCalculator(loan)
        
        # Generate the amortization schedule
        schedule_items = calculator.calculate_amortization_schedule()
        
        if not schedule_items:
            self.stdout.write(self.style.ERROR(f'   No schedule items generated for {loan.loan_no}'))
            return
        
        # Save new schedules
        for item in schedule_items:
            LoanSchedule.objects.create(
                loan=loan,
                installment_no=item['installment_no'],
                due_date=item['due_date'],
                principal_amount=item['principal_amount'],
                interest_amount=item['interest_amount'],
                penalty_amount=item.get('penalty_amount', 0),
                total_due=item['total_due'],
                status='pending'
            )
        
        # Update loan totals using calculator properties
        loan.total_interest = calculator.loan.total_interest
        loan.total_payable = calculator.loan.total_payable
        loan.outstanding_balance = calculator.loan.total_payable - loan.amount_paid
        
        # Update due dates based on disbursement date
        if loan.disbursement_date:
            period_days = loan.product.get_frequency_days()
            schedules = loan.schedules.all()
            for idx, schedule in enumerate(schedules):
                schedule.due_date = loan.disbursement_date + timedelta(days=period_days * (idx + 1))
                schedule.save()
            self.stdout.write(f'   Updated {schedules.count()} schedule due dates')
        
        loan.save()
        self.stdout.write(self.style.SUCCESS(f'✅ Fixed {loan.loan_no} - {loan.schedules.count()} schedules generated'))

    def show_all_loans(self):
        self.stdout.write('\n📋 Available loans:')
        for loan in Loan.objects.all():
            self.stdout.write(f'   - {loan.loan_no} ({loan.status}) - {loan.customer.full_name}')