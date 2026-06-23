from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from customers.models import Customer
from django.utils import timezone
from .models import Loan, LoanProduct, LoanSchedule
from .serializers import LoanSerializer, LoanProductSerializer
from .utils.calculations import LoanCalculator
import logging

logger = logging.getLogger(__name__)

class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset

        # In loans/views.py
from rest_framework import viewsets
from .models import Loan, LoanProduct
from .serializers import LoanSerializer, LoanProductSerializer

class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer

class LoanProductViewSet(viewsets.ModelViewSet):  # Add this
    queryset = LoanProduct.objects.all()
    serializer_class = LoanProductSerializer
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new loan and generate schedule"""
        try:
            data = request.data
            logger.info(f"📝 Creating loan with data: {data}")
            
            # Validate required fields
            required_fields = ['customer', 'product', 'principal', 'term_months']
            for field in required_fields:
                if field not in data:
                    return Response({
                        'error': f'Missing required field: {field}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get product
            try:
                product = LoanProduct.objects.get(id=data['product'], is_active=True)
                logger.info(f"📦 Product found: {product.product_name}")
            except LoanProduct.DoesNotExist:
                return Response({
                    'error': 'Invalid or inactive loan product'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get customer
            try:
                customer = Customer.objects.get(id=data['customer'])
                logger.info(f"👤 Customer found: {customer.full_name}")
            except Customer.DoesNotExist:
                return Response({
                    'error': 'Customer does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate amount
            try:
                principal = float(data['principal'])
                if principal < product.min_amount or principal > product.max_amount:
                    return Response({
                        'error': f'Principal must be between {product.min_amount} and {product.max_amount}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid principal amount'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate term
            try:
                term_months = int(data['term_months'])
                if term_months < product.min_term_months or term_months > product.max_term_months:
                    return Response({
                        'error': f'Term must be between {product.min_term_months} and {product.max_term_months} months'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid term months'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Create loan
            loan = Loan(
                loan_no=f"LN-{timezone.now().strftime('%Y%m%d')}-{timezone.now().microsecond}",
                customer=customer,
                product=product,
                branch=request.user.branch if request.user.branch else None,
                principal=principal,
                interest_rate=product.interest_rate,
                term_months=term_months,
                repayment_frequency=product.repayment_frequency,
                interest_method=product.interest_method,
                status='draft',
                created_by=request.user,
                application_date=timezone.now().date()
            )
            loan.save()
            logger.info(f"✅ Loan created: {loan.loan_no}")
            
            # Generate repayment schedule
            calculator = LoanCalculator(
                principal=loan.principal,
                annual_interest_rate=float(loan.interest_rate),
                term_months=loan.term_months,
                disbursement_date=loan.application_date,
                repayment_frequency=loan.repayment_frequency
            )
            
            schedule_summary = calculator.generate_summary(method=loan.interest_method)
            
            # Save schedule
            for item in schedule_summary['schedule']:
                LoanSchedule.objects.create(
                    loan=loan,
                    installment_no=item['installment_no'],
                    due_date=item['due_date'],
                    principal_amount=item['principal_amount'],
                    interest_amount=item['interest_amount'],
                    total_due=item['total_due'],
                    status='pending'
                )
            
            # Update loan totals
            loan.total_interest = schedule_summary['total_interest']
            loan.total_payable = schedule_summary['total_payable']
            loan.outstanding_balance = schedule_summary['total_payable']
            loan.save()
            
            serializer = self.get_serializer(loan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"❌ Error creating loan: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Failed to create loan: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)