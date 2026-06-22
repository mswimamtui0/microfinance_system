from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Payment
from .serializers import PaymentSerializer

class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by loan
        loan_id = self.request.query_params.get('loan')
        if loan_id:
            queryset = queryset.filter(loan_id=loan_id)
        
        # Filter by customer (through loan)
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(loan__customer_id=customer_id)
        
        # Filter by date range
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            queryset = queryset.filter(payment_date__gte=start_date)
        if end_date:
            queryset = queryset.filter(payment_date__lte=end_date)
        
        return queryset
    
    @transaction.atomic
    def perform_create(self, serializer):
        payment = serializer.save(
            received_by=self.request.user,
            status='completed'
        )
        
        # Update loan outstanding balance
        loan = payment.loan
        loan.amount_paid += payment.amount_paid
        loan.outstanding_balance = loan.total_payable - loan.amount_paid
        
        # Update loan status if fully paid
        if loan.outstanding_balance <= 0:
            loan.status = 'paid'
            loan.closed_date = timezone.now().date()
        
        loan.save()
        
        # Update schedule if linked
        if payment.schedule:
            schedule = payment.schedule
            schedule.amount_paid = payment.amount_paid
            if schedule.amount_paid >= schedule.total_due:
                schedule.status = 'paid'
                schedule.paid_date = timezone.now().date()
            else:
                schedule.status = 'partial'
            schedule.save()
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payment summary for dashboard"""
        from django.db.models import Sum
        
        total_payments = Payment.objects.filter(status='completed').aggregate(
            total=Sum('amount_paid')
        )['total'] or 0
        
        today = timezone.now().date()
        today_payments = Payment.objects.filter(
            status='completed',
            payment_date__date=today
        ).aggregate(total=Sum('amount_paid'))['total'] or 0
        
        return Response({
            'total_collected': total_payments,
            'today_collected': today_payments,
            'total_transactions': Payment.objects.filter(status='completed').count(),
        })