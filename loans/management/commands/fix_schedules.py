from django.core.management.base import BaseCommand
from loans.models import Loan
from loans.utils.calculations import RepaymentScheduleGenerator
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
        self.stdout.write(f'Fixing {loan.loan_no}...')
        
        old_count = loan.schedules.count()
        loan.schedules.all().delete()
        self.stdout.write(f'   Deleted {old_count} old schedules')
        
        generator = RepaymentScheduleGenerator()
        generator.generate_schedule(loan)
        self.stdout.write(f'   Generated {loan.schedules.count()} new schedules')
        
        if loan.disbursement_date:
            period_days = loan.product.get_frequency_days()
            for idx, schedule in enumerate(loan.schedules.all()):
                schedule.due_date = loan.disbursement_date + timedelta(days=period_days * (idx + 1))
                schedule.save()
            self.stdout.write(f'   Updated {loan.schedules.count()} schedule due dates')
        
        loan.save()
        self.stdout.write(self.style.SUCCESS(f'✅ Fixed {loan.loan_no}'))

    def show_all_loans(self):
        self.stdout.write('\n📋 Available loans:')
        for loan in Loan.objects.all():
            self.stdout.write(f'   - {loan.loan_no} ({loan.status}) - {loan.customer.full_name}')