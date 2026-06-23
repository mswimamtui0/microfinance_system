from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db.models import Q
from loans.models import Loan, LoanSchedule
from loans.utils.calculations import LoanCalculator
from notifications.models import Notification, SMSLog
from datetime import timedelta
import logging

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Run daily route for loan updates, penalties, and notifications'

    def handle(self, *args, **options):
        self.stdout.write(self.style.SUCCESS('=' * 60))
        self.stdout.write(self.style.SUCCESS('Starting Daily Route...'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        today = timezone.now().date()
        
        # 1. Update all active loans
        self.stdout.write('\n1. Updating active loans...')
        active_loans = Loan.objects.filter(
            status__in=['active', 'disbursed']
        )
        self.stdout.write(f'   Found {active_loans.count()} active loans')
        
        for loan in active_loans:
            self.update_loan_status(loan, today)
        
        # 2. Update penalties
        self.stdout.write('\n2. Updating penalties...')
        overdue_schedules = LoanSchedule.objects.filter(
            Q(status='pending') | Q(status='overdue'),
            due_date__lt=today
        )
        self.stdout.write(f'   Found {overdue_schedules.count()} overdue schedules')
        
        total_penalty = 0
        for schedule in overdue_schedules:
            penalty = self.update_penalty(schedule, today)
            total_penalty += penalty
        
        self.stdout.write(f'   Total penalties accrued: {total_penalty:.2f} TZS')
        
        # 3. Send reminders
        self.stdout.write('\n3. Sending payment reminders...')
        due_today = LoanSchedule.objects.filter(
            due_date=today,
            status__in=['pending', 'partial']
        )
        self.stdout.write(f'   Found {due_today.count()} payments due today')
        
        for schedule in due_today:
            self.send_payment_reminder(schedule, 'today')
        
        # 4. Send overdue alerts
        self.stdout.write('\n4. Sending overdue alerts...')
        overdue_alerts = LoanSchedule.objects.filter(
            due_date__lt=today,
            status__in=['pending', 'overdue']
        )
        self.stdout.write(f'   Found {overdue_alerts.count()} overdue payments')
        
        for schedule in overdue_alerts[:10]:  # Limit to 10 per run
            self.send_overdue_alert(schedule, today)
        
        # 5. Generate daily report
        self.stdout.write('\n5. Generating daily report...')
        report = self.generate_daily_report(today)
        
        self.stdout.write(self.style.SUCCESS('\n' + '=' * 60))
        self.stdout.write(self.style.SUCCESS('Daily Route Completed Successfully!'))
        self.stdout.write(self.style.SUCCESS('=' * 60))
        
        # Log summary
        logger.info(f'Daily Route completed: {report}')
    
    def update_loan_status(self, loan, today):
        """Update loan status and check for overdue"""
        try:
            calculator = LoanCalculator(loan)
            status_data = calculator.get_current_status()
            
            # Update loan fields
            if status_data['is_overdue']:
                loan.is_overdue = True
                loan.days_overdue = status_data['days_overdue']
                loan.status = 'active'  # Keep active but overdue
            
            # Update outstanding balance
            loan.outstanding_balance = status_data['outstanding_balance']
            
            # Check if loan should be defaulted
            max_overdue = loan.product.max_overdue_days or 30
            if loan.days_overdue > max_overdue:
                loan.status = 'defaulted'
                self.stdout.write(f'   ⚠️ Loan {loan.loan_no} marked as defaulted')
            
            loan.save()
            
        except Exception as e:
            logger.error(f'Error updating loan {loan.loan_no}: {str(e)}')
    
    def update_penalty(self, schedule, today):
        """Update penalty for overdue schedule"""
        try:
            loan = schedule.loan
            calculator = LoanCalculator(loan)
            penalty = calculator.calculate_penalty(schedule.due_date, today)
            
            schedule.penalty_amount = penalty
            schedule.total_due = schedule.total_due + penalty
            schedule.status = 'overdue'
            schedule.save()
            
            return penalty
            
        except Exception as e:
            logger.error(f'Error updating penalty for schedule {schedule.id}: {str(e)}')
            return 0
    
    def send_payment_reminder(self, schedule, reminder_type):
        """Send payment reminder notification"""
        try:
            loan = schedule.loan
            customer = loan.customer
            calculator = LoanCalculator(loan)
            
            # Determine message based on reminder type
            if reminder_type == 'today':
                subject = f'Payment Due Today - {loan.loan_no}'
                message = f"""Dear {customer.first_name} {customer.last_name},

Your payment of {schedule.total_due:.2f} TZS is due TODAY.

Loan: {loan.loan_no}
Installment: {schedule.installment_no}
Amount Due: {schedule.total_due:.2f} TZS
Due Date: {schedule.due_date}

Please make payment today to avoid penalties.

Thank you,
MicroFinance System"""
            else:
                days = int(reminder_type.replace('days_', ''))
                subject = f'Payment Reminder - {loan.loan_no}'
                message = f"""Dear {customer.first_name} {customer.last_name},

Your payment of {schedule.total_due:.2f} TZS is due in {days} days.

Loan: {loan.loan_no}
Installment: {schedule.installment_no}
Amount Due: {schedule.total_due:.2f} TZS
Due Date: {schedule.due_date}

Please prepare your payment.

Thank you,
MicroFinance System"""
            
            # Create notification
            notification = Notification.objects.create(
                customer=customer,
                loan=loan,
                title=subject,
                message=message,
                notification_type='payment_reminder',
                send_sms=True,
                send_email=True,
                send_app=True
            )
            
            # Send SMS (if customer has phone)
            if customer.phone:
                sms_message = f"MicroFinance: Payment of {schedule.total_due:.2f} TZS due {schedule.due_date} for loan {loan.loan_no}"
                SMSLog.objects.create(
                    customer=customer,
                    phone=customer.phone,
                    message=sms_message,
                    delivery_status='sent'
                )
            
            self.stdout.write(f'   📧 Reminder sent to {customer.first_name} for {loan.loan_no}')
            
        except Exception as e:
            logger.error(f'Error sending reminder for schedule {schedule.id}: {str(e)}')
    
    def send_overdue_alert(self, schedule, today):
        """Send overdue alert notification"""
        try:
            loan = schedule.loan
            customer = loan.customer
            days_overdue = (today - schedule.due_date).days
            
            subject = f'URGENT: Payment Overdue - {loan.loan_no}'
            message = f"""Dear {customer.first_name} {customer.last_name},

Your payment is {days_overdue} days overdue.

Loan: {loan.loan_no}
Installment: {schedule.installment_no}
Amount Due: {schedule.total_due:.2f} TZS
Penalty Accrued: {schedule.penalty_amount:.2f} TZS
Total Due: {schedule.total_due + schedule.penalty_amount:.2f} TZS

Please make payment immediately to avoid further penalties.

Thank you,
MicroFinance System"""
            
            # Create notification
            notification = Notification.objects.create(
                customer=customer,
                loan=loan,
                title=subject,
                message=message,
                notification_type='loan_overdue',
                send_sms=True,
                send_email=True,
                send_app=True
            )
            
            # Send SMS
            if customer.phone:
                sms_message = f"URGENT: Loan {loan.loan_no} is {days_overdue} days overdue. Due: {schedule.total_due:.2f} TZS"
                SMSLog.objects.create(
                    customer=customer,
                    phone=customer.phone,
                    message=sms_message,
                    delivery_status='sent'
                )
            
            self.stdout.write(f'   ⚠️ Overdue alert sent to {customer.first_name} for {loan.loan_no}')
            
        except Exception as e:
            logger.error(f'Error sending overdue alert for schedule {schedule.id}: {str(e)}')
    
    def generate_daily_report(self, today):
        """Generate daily report"""
        report = {}
        
        # Total loans
        report['total_loans'] = Loan.objects.count()
        report['active_loans'] = Loan.objects.filter(status='active').count()
        report['overdue_loans'] = Loan.objects.filter(is_overdue=True).count()
        report['defaulted_loans'] = Loan.objects.filter(status='defaulted').count()
        
        # Due today
        due_today = LoanSchedule.objects.filter(
            due_date=today,
            status__in=['pending', 'partial']
        )
        report['due_today_count'] = due_today.count()
        report['due_today_amount'] = sum(s.total_due for s in due_today)
        
        # Overdue
        overdue = LoanSchedule.objects.filter(
            due_date__lt=today,
            status__in=['pending', 'overdue']
        )
        report['overdue_count'] = overdue.count()
        report['overdue_amount'] = sum(s.total_due for s in overdue)
        report['overdue_penalty'] = sum(s.penalty_amount for s in overdue)
        
        # Collections (last 7 days)
        from payments.models import Payment
        week_ago = today - timedelta(days=7)
        recent_payments = Payment.objects.filter(
            payment_date__date__gte=week_ago,
            status='completed'
        )
        report['collections_7days'] = sum(p.amount_paid for p in recent_payments)
        report['collections_count'] = recent_payments.count()
        
        # Log report
        self.stdout.write(f'\n📊 DAILY REPORT - {today}')
        self.stdout.write('-' * 40)
        self.stdout.write(f'Total Loans: {report["total_loans"]}')
        self.stdout.write(f'Active Loans: {report["active_loans"]}')
        self.stdout.write(f'Overdue Loans: {report["overdue_loans"]}')
        self.stdout.write(f'Defaulted Loans: {report["defaulted_loans"]}')
        self.stdout.write('-' * 40)
        self.stdout.write(f'Due Today: {report["due_today_count"]} ({report["due_today_amount"]:.2f} TZS)')
        self.stdout.write(f'Overdue: {report["overdue_count"]} ({report["overdue_amount"]:.2f} TZS)')
        self.stdout.write(f'Overdue Penalty: {report["overdue_penalty"]:.2f} TZS')
        self.stdout.write('-' * 40)
        self.stdout.write(f'Collections (7 days): {report["collections_7days"]:.2f} TZS')
        self.stdout.write(f'Collection Count: {report["collections_count"]}')
        
        return report