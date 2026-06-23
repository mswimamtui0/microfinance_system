from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from django.http import JsonResponse
from .models import Loan, LoanProduct, LoanSchedule
from .serializers import LoanSerializer, LoanProductSerializer
from .utils.calculations import LoanCalculator, RepaymentScheduleGenerator
from customers.models import Customer
import logging
from .models import Loan, LoanProduct, LoanSchedule
from .serializers import LoanSerializer, LoanProductSerializer, LoanScheduleSerializer



logger = logging.getLogger(__name__)


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on user role
        if user.role == 'admin' or user.is_superuser:
            pass  # Admin sees all
        elif user.role == 'manager':
            queryset = queryset.filter(branch=user.branch)
        elif user.role == 'officer':
            queryset = queryset.filter(customer__created_by=user)
        elif user.role == 'teller':
            queryset = queryset.filter(branch=user.branch)
        elif user.role == 'viewer':
            pass  # Viewer sees all but read-only
        
        # Additional filters
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new loan and generate schedule"""
        try:
            data = request.data
            logger.info(f"Creating loan with data: {data}")
            
            # Validate required fields
            required_fields = ['customer', 'product', 'principal', 'term_months']
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                return Response({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get product
            try:
                product = LoanProduct.objects.get(id=data['product'], is_active=True)
                logger.info(f"Product found: {product.product_name}")
            except LoanProduct.DoesNotExist:
                return Response({
                    'error': 'Invalid or inactive loan product'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get customer
            try:
                customer = Customer.objects.get(id=data['customer'])
                logger.info(f"Customer found: {customer.full_name}")
            except Customer.DoesNotExist:
                return Response({
                    'error': 'Customer does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate amount
            try:
                principal = float(data['principal'])
                if principal < product.min_amount:
                    return Response({
                        'error': f'Principal amount must be at least {product.min_amount}'
                    }, status=status.HTTP_400_BAD_REQUEST)
                if principal > product.max_amount:
                    return Response({
                        'error': f'Principal amount cannot exceed {product.max_amount}'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid principal amount'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate term
            try:
                term_months = int(data['term_months'])
                if term_months < product.min_term_months:
                    return Response({
                        'error': f'Term must be at least {product.min_term_months} months'
                    }, status=status.HTTP_400_BAD_REQUEST)
                if term_months > product.max_term_months:
                    return Response({
                        'error': f'Term cannot exceed {product.max_term_months} months'
                    }, status=status.HTTP_400_BAD_REQUEST)
            except ValueError:
                return Response({
                    'error': 'Invalid term months'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            # Get user
            user = request.user
            if not user or not user.id:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            # Get branch from user
            branch = None
            if hasattr(user, 'branch') and user.branch:
                branch = user.branch
            
            # Create loan with calculations
            loan = Loan(
                loan_no=f"LN-{timezone.now().strftime('%Y%m%d')}-{timezone.now().microsecond}",
                customer=customer,
                product=product,
                branch=branch,
                principal=principal,
                interest_rate=product.interest_rate,
                term_months=term_months,
                repayment_frequency=product.repayment_frequency,
                interest_method=product.interest_method,
                status='draft',
                created_by=user,
                application_date=timezone.now().date()
            )
            
            # Calculate total payable
            loan.total_interest = loan.calculate_total_interest()
            loan.total_payable = loan.get_total_payable()
            loan.outstanding_balance = loan.total_payable
            loan.save()
            
            logger.info(f"Loan created: {loan.loan_no}")
            
            # Generate repayment schedule
            schedule_generator = RepaymentScheduleGenerator()
            schedule_generator.generate_schedule(loan)
            
            # Update loan with schedule info
            loan.save()
            
            serializer = self.get_serializer(loan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating loan: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Failed to create loan: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['get'])
    def calculate_summary(self, request, pk=None):
        """Get loan summary with real-time calculations"""
        loan = self.get_object()
        calculator = LoanCalculator(loan)
        summary = calculator.generate_summary()
        return Response(summary)
    
    @action(detail=True, methods=['get'])
    def realtime_status(self, request, pk=None):
        """Get real-time loan status"""
        loan = self.get_object()
        calculator = LoanCalculator(loan)
        status_data = calculator.get_current_status()
        return Response(status_data)
    
    @action(detail=True, methods=['post'])
    def calculate_early_repayment(self, request, pk=None):
        """Calculate early repayment amount"""
        loan = self.get_object()
        payment_date = request.data.get('payment_date')
        
        if payment_date:
            from datetime import datetime
            payment_date = datetime.strptime(payment_date, '%Y-%m-%d').date()
        
        calculator = LoanCalculator(loan)
        result = calculator.calculate_early_repayment(payment_date)
        return Response(result)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        """Approve a loan"""
        loan = self.get_object()
        
        if loan.status != 'draft':
            return Response({
                'error': 'Loan can only be approved from draft status'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        loan.status = 'pending'
        loan.approved_by = request.user
        loan.approval_date = timezone.now().date()
        loan.approved_amount = loan.principal
        loan.save()
        
        return Response({'message': 'Loan approved successfully'})
    
    @action(detail=True, methods=['post'])
    def disburse(self, request, pk=None):
        """Disburse approved loan"""
        loan = self.get_object()
        
        if loan.status != 'pending':
            return Response({
                'error': 'Loan must be in pending status to disburse'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        loan.status = 'disbursed'
        loan.disbursed_by = request.user
        loan.disbursement_date = timezone.now().date()
        
        # Calculate maturity date
        total_days = loan.term_months * 30
        loan.maturity_date = loan.disbursement_date + timezone.timedelta(days=total_days)
        
        # Update first payment date
        period_days = loan.product.get_frequency_days()
        loan.first_payment_date = loan.disbursement_date + timezone.timedelta(days=period_days)
        
        loan.save()
        
        # Update schedules
        calculator = LoanCalculator(loan)
        schedules = loan.schedules.all()
        period_days = loan.product.get_frequency_days()
        
        for idx, schedule in enumerate(schedules):
            schedule.due_date = loan.disbursement_date + timezone.timedelta(days=period_days * (idx + 1))
            schedule.save()
        
        return Response({'message': 'Loan disbursed successfully'})
    
    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        """Get loan repayment schedule"""
        loan = self.get_object()
        schedules = loan.schedules.all()
        from .serializers import LoanScheduleSerializer
        serializer = LoanScheduleSerializer(schedules, many=True)
        return Response(serializer.data)


        # Add this class to loans/views.py

class LoanProductViewSet(viewsets.ModelViewSet):
    """
    ViewSet for Loan Products
    """
    queryset = LoanProduct.objects.all()
    serializer_class = LoanProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Filter by active status
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        
        # Search by name or code
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                Q(product_name__icontains=search) |
                Q(product_code__icontains=search)
            )
        
        return queryset