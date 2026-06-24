from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from .models import Payment
from .serializers import PaymentSerializer
from loans.models import Loan, LoanSchedule
import logging

logger = logging.getLogger(__name__)


class PaymentViewSet(viewsets.ModelViewSet):
    queryset = Payment.objects.all()
    serializer_class = PaymentSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
    queryset = super().get_queryset()
    user = self.request.user
    
    # Filter based on user role
    if user.is_superuser or user.role == 'admin':
        pass
    elif user.role == 'manager':
        if user.branch:
            queryset = queryset.filter(loan__branch=user.branch)
        else:
            queryset = queryset.none()
    elif user.role == 'officer':
        queryset = queryset.filter(loan__created_by=user)
    elif user.role == 'teller':
        if user.branch:
            queryset = queryset.filter(loan__branch=user.branch)
        else:
            queryset = queryset.none()
    elif user.role == 'viewer':
        pass
    
    # Additional filters
    loan_id = self.request.query_params.get('loan')
    if loan_id:
        queryset = queryset.filter(loan_id=loan_id)
    
    customer_id = self.request.query_params.get('customer')
    if customer_id:
        queryset = queryset.filter(loan__customer_id=customer_id)
    
    start_date = self.request.query_params.get('start_date')
    end_date = self.request.query_params.get('end_date')
    if start_date:
        queryset = queryset.filter(payment_date__gte=start_date)
    if end_date:
        queryset = queryset.filter(payment_date__lte=end_date)
    
    return queryset
        
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new payment"""
        try:
            data = request.data
            print("=" * 50)
            print("PAYMENT CREATION REQUEST")
            print("Data:", data)
            print("User:", request.user)
            print("=" * 50)
            
            required_fields = ['loan', 'amount_paid', 'payment_method', 'payment_date']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'error': f'Missing required field: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                loan = Loan.objects.get(id=data['loan'])
                print(f"Loan found: {loan.loan_no}")
            except Loan.DoesNotExist:
                return Response({
                    'error': 'Loan does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if loan.status not in ['active', 'disbursed']:
                return Response({
                    'error': f'Loan is not active (status: {loan.status})'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                amount = float(data['amount_paid'])
                if amount <= 0:
                    return Response({
                        'error': 'Amount must be greater than 0'
                    }, status=status.HTTP_400_BAD_REQUEST)
                if amount > float(loan.outstanding_balance):
                    return Response({
                        'error': f'Amount exceeds outstanding balance of {loan.outstanding_balance}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid amount'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            user = request.user
            if not user or not user.id:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Create payment
            import uuid
            payment = Payment(
                loan=loan,
                amount_paid=amount,
                payment_method=data['payment_method'],
                payment_date=data['payment_date'],
                received_by=user,
                notes=data.get('notes', ''),
                transaction_ref=f"PAY-{uuid.uuid4().hex[:8].upper()}"
            )
            payment.save()
            print(f"Payment created: {payment.id}")
            
            # UPDATE LOAN - THIS IS CRITICAL
            loan.amount_paid = float(loan.amount_paid) + amount
            loan.outstanding_balance = float(loan.total_payable) - float(loan.amount_paid)
            
            # Check if loan is fully paid
            if loan.outstanding_balance <= 0:
                loan.status = 'paid'
                loan.closed_date = timezone.now().date()
                payment.status = 'completed'  # Full payment
                print(f"Loan {loan.loan_no} FULLY PAID!")
            else:
                loan.status = 'active'
                payment.status = 'partial'  # Partial payment
                print(f"Loan {loan.loan_no} PARTIALLY PAID. Remaining: {loan.outstanding_balance}")
            
            loan.save()
            payment.save()
            
            print(f"Loan updated: {loan.loan_no}, outstanding: {loan.outstanding_balance}")
            
            serializer = self.get_serializer(payment)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            print(f"ERROR: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Failed to create payment: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payment summary"""
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