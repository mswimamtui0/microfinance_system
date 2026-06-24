from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django.db import models
from django.utils import timezone
from .models import Customer, Guarantor
from .serializers import CustomerSerializer, GuarantorSerializer

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        queryset = super().get_queryset()
        user = self.request.user
        
        # Filter based on user role
        if user.is_superuser or user.role == 'admin':
            # Admin sees all customers
            pass
        elif user.role == 'manager':
            # Manager sees only their branch customers
            if user.branch:
                queryset = queryset.filter(branch=user.branch)
            else:
                queryset = queryset.none()  # No branch assigned
        elif user.role == 'officer':
            # Officer sees only customers they created
            queryset = queryset.filter(created_by=user)
        elif user.role == 'teller':
            # Teller sees all branch customers
            if user.branch:
                queryset = queryset.filter(branch=user.branch)
            else:
                queryset = queryset.none()
        elif user.role == 'viewer':
            # Viewer sees all (read-only)
            pass
        
        # Search filter
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(customer_no__icontains=search) |
                models.Q(phone__icontains=search) |
                models.Q(nida_number__icontains=search)
            )
        
        # Status filter
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Risk level filter
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)
        
        return queryset
    
    def perform_create(self, serializer):
        import uuid
        customer_no = f"CUST{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:4].upper()}"
        serializer.save(
            created_by=self.request.user,
            customer_no=customer_no,
            branch=self.request.user.branch  # Auto-assign to user's branch
        )
    
    @action(detail=True, methods=['get'])
    def guarantors(self, request, pk=None):
        customer = self.get_object()
        guarantors = customer.guarantors.all()
        serializer = GuarantorSerializer(guarantors, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def add_guarantor(self, request, pk=None):
        customer = self.get_object()
        data = request.data
        data['customer'] = customer.id
        serializer = GuarantorSerializer(data=data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)