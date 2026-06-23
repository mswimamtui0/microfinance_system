from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import transaction
from django.utils import timezone
from .models import Loan, LoanProduct, LoanSchedule
from .serializers import LoanSerializer, LoanProductSerializer
from .utils.calculations import LoanCalculator
from customers.models import Customer
import logging

logger = logging.getLogger(__name__)


class LoanViewSet(viewsets.ModelViewSet):
    queryset = Loan.objects.all()
    serializer_class = LoanSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        status_filter = self.request.query_params.get('status')
        if status_filter:
            queryset = queryset.filter(status=status_filter)
        
        customer_id = self.request.query_params.get('customer')
        if customer_id:
            queryset = queryset.filter(customer_id=customer_id)
        
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset
    
    @transaction.atomic
    def create(self, request, *args, **kwargs):
        """Create a new loan and generate schedule"""
        try:
            data = request.data
            logger.info(f"Creating loan with data: {data}")
            
            required_fields = ['customer', 'product', 'principal', 'term_months']
            missing_fields = [f for f in required_fields if f not in data]
            if missing_fields:
                return Response({
                    'error': f'Missing required fields: {", ".join(missing_fields)}'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                product = LoanProduct.objects.get(id=data['product'], is_active=True)
                logger.info(f"Product found: {product.product_name}")
            except LoanProduct.DoesNotExist:
                return Response({
                    'error': 'Invalid or inactive loan product'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            try:
                customer = Customer.objects.get(id=data['customer'])
                logger.info(f"Customer found: {customer.full_name}")
            except Customer.DoesNotExist:
                return Response({
                    'error': 'Customer does not exist'
                }, status=status.HTTP_400_BAD_REQUEST)
            
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
            
            user = request.user
            if not user or not user.id:
                return Response({
                    'error': 'Authentication required'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            branch = None
            if hasattr(user, 'branch') and user.branch:
                branch = user.branch
            
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
            loan.save()
            logger.info(f"Loan created: {loan.loan_no}")
            
            try:
                calculator = LoanCalculator(
                    principal=loan.principal,
                    annual_interest_rate=float(loan.interest_rate),
                    term_months=loan.term_months,
                    disbursement_date=loan.application_date,
                    repayment_frequency=loan.repayment_frequency
                )
                
                schedule_summary = calculator.generate_summary(method=loan.interest_method)
                
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
                
                loan.total_interest = schedule_summary['total_interest']
                loan.total_payable = schedule_summary['total_payable']
                loan.outstanding_balance = schedule_summary['total_payable']
                loan.save()
                
            except Exception as e:
                logger.error(f"Error generating schedule: {str(e)}")
            
            serializer = self.get_serializer(loan)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating loan: {str(e)}")
            import traceback
            traceback.print_exc()
            return Response({
                'error': f'Failed to create loan: {str(e)}'
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
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
        loan = self.get_object()
        
        if loan.status != 'pending':
            return Response({
                'error': 'Loan must be in pending status to disburse'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        loan.status = 'disbursed'
        loan.disbursed_by = request.user
        loan.disbursement_date = timezone.now().date()
        loan.first_payment_date = timezone.now().date() + timezone.timedelta(days=30)
        loan.maturity_date = timezone.now().date() + timezone.timedelta(days=loan.term_months * 30)
        loan.save()
        
        for schedule in loan.schedules.all():
            schedule.due_date = loan.disbursement_date + timezone.timedelta(
                days=schedule.installment_no * (30 if loan.repayment_frequency == 'monthly' else 7)
            )
            schedule.save()
        
        return Response({'message': 'Loan disbursed successfully'})
    
    @action(detail=True, methods=['get'])
    def schedule(self, request, pk=None):
        loan = self.get_object()
        schedule = loan.schedules.all()
        from .serializers import LoanScheduleSerializer
        serializer = LoanScheduleSerializer(schedule, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def calculate_penalty(self, request, pk=None):
        loan = self.get_object()
        data = request.data
        days_overdue = data.get('days_overdue', loan.days_overdue)
        overdue_amount = data.get('overdue_amount', loan.outstanding_balance)
        
        calculator = LoanCalculator(
            principal=loan.principal,
            annual_interest_rate=float(loan.interest_rate),
            term_months=loan.term_months,
            disbursement_date=loan.disbursement_date or loan.application_date,
            repayment_frequency=loan.repayment_frequency
        )
        
        penalty = calculator.calculate_penalty(
            overdue_amount=overdue_amount,
            days_overdue=days_overdue,
            penalty_rate=float(loan.product.late_penalty_rate)
        )
        
        return Response({'penalty_amount': penalty})


class LoanProductViewSet(viewsets.ModelViewSet):
    queryset = LoanProduct.objects.all()
    serializer_class = LoanProductSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        is_active = self.request.query_params.get('is_active')
        if is_active is not None:
            queryset = queryset.filter(is_active=is_active.lower() == 'true')
        return queryset