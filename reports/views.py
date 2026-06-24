# In reports/views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db.models import Sum, Count, Q
from django.utils import timezone
from loans.models import Loan
from payments.models import Payment
from customers.models import Customer

class PortfolioReportView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        user = request.user
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        # Base queryset with branch filtering
        loans = Loan.objects.all()
        payments = Payment.objects.filter(status='completed')
        
        # Filter by user role
        if user.is_superuser or user.role == 'admin':
            pass
        elif user.role == 'manager':
            if user.branch:
                loans = loans.filter(branch=user.branch)
                payments = payments.filter(loan__branch=user.branch)
            else:
                loans = loans.none()
                payments = payments.none()
        elif user.role == 'officer':
            loans = loans.filter(created_by=user)
            payments = payments.filter(loan__created_by=user)
        elif user.role == 'teller':
            if user.branch:
                loans = loans.filter(branch=user.branch)
                payments = payments.filter(loan__branch=user.branch)
            else:
                loans = loans.none()
                payments = payments.none()
        elif user.role == 'viewer':
            pass
        
        if start_date:
            loans = loans.filter(disbursement_date__gte=start_date)
            payments = payments.filter(payment_date__date__gte=start_date)
        if end_date:
            loans = loans.filter(disbursement_date__lte=end_date)
            payments = payments.filter(payment_date__date__lte=end_date)
        
        # Portfolio metrics
        total_portfolio = loans.aggregate(total=Sum('principal'))['total'] or 0
        active_loans = loans.filter(status='active').count()
        total_customers = Customer.objects.filter(status='active').count()
        
        # Collection metrics
        total_collected = payments.aggregate(total=Sum('amount_paid'))['total'] or 0
        expected_collections = loans.filter(status='active').aggregate(
            total=Sum('total_payable')
        )['total'] or 0
        
        collection_rate = (total_collected / expected_collections * 100) if expected_collections > 0 else 0
        
        # Portfolio quality
        total_loans = loans.count()
        overdue_loans = loans.filter(is_overdue=True).count()
        defaulted_loans = loans.filter(status='defaulted').count()
        
        performing_loans = total_loans - overdue_loans - defaulted_loans
        performing_rate = (performing_loans / total_loans * 100) if total_loans > 0 else 0
        overdue_rate = (overdue_loans / total_loans * 100) if total_loans > 0 else 0
        default_rate = (defaulted_loans / total_loans * 100) if total_loans > 0 else 0
        
        return Response({
            'total_portfolio': total_portfolio,
            'active_loans': active_loans,
            'total_customers': total_customers,
            'collection_rate': round(collection_rate, 2),
            'performing': round(performing_rate, 2),
            'overdue_rate': round(overdue_rate, 2),
            'default_rate': round(default_rate, 2),
            'overdue_loans': overdue_loans,
            'defaulted_loans': defaulted_loans,
        })