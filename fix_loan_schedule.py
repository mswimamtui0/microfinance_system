import os
import django
import requests
import json
from datetime import datetime, timedelta

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from loans.models import Loan
from loans.utils.calculations import RepaymentScheduleGenerator

def fix_loan_schedule(loan_number):
    """
    Fix the loan schedule for a specific loan
    """
    print("=" * 60)
    print(f"Fixing loan: {loan_number}")
    print("=" * 60)
    
    try:
        # Find the loan
        loan = Loan.objects.get(loan_no=loan_number)
        print(f"✅ Loan found: {loan.loan_no}")
        print(f"   Status: {loan.status}")
        print(f"   Outstanding: {loan.outstanding_balance}")
        print(f"   Disbursement: {loan.disbursement_date}")
        print(f"   Schedules: {loan.schedules.count()}")
        
        # Delete old schedules
        old_count = loan.schedules.count()
        loan.schedules.all().delete()
        print(f"   Deleted {old_count} old schedules")
        
        # Generate new schedules
        generator = RepaymentScheduleGenerator()
        generator.generate_schedule(loan)
        print(f"   Generated {loan.schedules.count()} new schedules")
        
        # Update due dates based on disbursement date
        if loan.disbursement_date:
            period_days = loan.product.get_frequency_days()
            schedules = loan.schedules.all()
            for idx, schedule in enumerate(schedules):
                schedule.due_date = loan.disbursement_date + timedelta(days=period_days * (idx + 1))
                schedule.save()
            print(f"   Updated {schedules.count()} schedule due dates")
        
        # Update loan
        loan.save()
        print(f"✅ Loan updated successfully!")
        
        # Show first few schedules
        print("\n📅 First 5 Schedules:")
        for schedule in loan.schedules.all()[:5]:
            print(f"   #{schedule.installment_no}: Due {schedule.due_date} - TZS {schedule.total_due}")
        
        return True
        
    except Loan.DoesNotExist:
        print(f"❌ Loan {loan_number} not found!")
        print("\nAvailable loans:")
        for l in Loan.objects.all():
            print(f"   - {l.loan_no} ({l.status}) - {l.customer.full_name}")
        return False
    except Exception as e:
        print(f"❌ Error: {str(e)}")
        import traceback
        traceback.print_exc()
        return False

def fix_all_active_loans():
    """
    Fix all active loans
    """
    print("=" * 60)
    print("Fixing ALL active loans")
    print("=" * 60)
    
    loans = Loan.objects.filter(status__in=['active', 'disbursed'])
    print(f"Found {loans.count()} active loans")
    
    for loan in loans:
        print(f"\n--- Processing {loan.loan_no} ---")
        fix_loan_schedule(loan.loan_no)
    
    print("\n✅ All active loans fixed!")

def check_loan_status(loan_number):
    """
    Check the status of a loan
    """
    try:
        loan = Loan.objects.get(loan_no=loan_number)
        print(f"\n📊 Loan: {loan.loan_no}")
        print(f"   Status: {loan.status}")
        print(f"   Principal: TZS {loan.principal:,.2f}")
        print(f"   Outstanding: TZS {loan.outstanding_balance:,.2f}")
        print(f"   Disbursement: {loan.disbursement_date}")
        print(f"   Maturity: {loan.maturity_date}")
        print(f"   Schedules: {loan.schedules.count()}")
        
        if loan.schedules.count() > 0:
            first = loan.schedules.first()
            print(f"   First due: {first.due_date} - TZS {first.total_due:,.2f}")
            last = loan.schedules.last()
            print(f"   Last due: {last.due_date} - TZS {last.total_due:,.2f}")
        
        return True
    except Loan.DoesNotExist:
        print(f"❌ Loan {loan_number} not found!")
        return False

if __name__ == "__main__":
    print("=" * 60)
    print("🔧 LOAN SCHEDULE FIXER")
    print("=" * 60)
    print("\nOptions:")
    print("1. Fix a specific loan (LN-20260623-857251)")
    print("2. Fix all active loans")
    print("3. Check loan status")
    print("4. Exit")
    
    while True:
        choice = input("\nEnter choice (1-4): ")
        
        if choice == '1':
            loan_number = input("Enter loan number (default: LN-20260623-857251): ").strip()
            if not loan_number:
                loan_number = 'LN-20260623-857251'
            fix_loan_schedule(loan_number)
            
        elif choice == '2':
            confirm = input("Are you sure? This will regenerate schedules for ALL active loans. (y/n): ")
            if confirm.lower() == 'y':
                fix_all_active_loans()
            
        elif choice == '3':
            loan_number = input("Enter loan number: ").strip()
            check_loan_status(loan_number)
            
        elif choice == '4':
            print("Exiting...")
            break
        
        print("\n" + "=" * 60)