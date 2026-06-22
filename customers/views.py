from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from django.utils import timezone
from .models import Customer, Guarantor
from .serializers import CustomerSerializer, GuarantorSerializer
from django.db import models  # Add this import

class CustomerViewSet(viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer
    
    def get_queryset(self):
        queryset = super().get_queryset()
        
        # Search
        search = self.request.query_params.get('search')
        if search:
            queryset = queryset.filter(
                models.Q(first_name__icontains=search) |
                models.Q(last_name__icontains=search) |
                models.Q(customer_no__icontains=search) |
                models.Q(phone__icontains=search) |
                models.Q(nida_number__icontains=search)
            )
        
        # Filter by status
        status = self.request.query_params.get('status')
        if status:
            queryset = queryset.filter(status=status)
        
        # Filter by risk level
        risk_level = self.request.query_params.get('risk_level')
        if risk_level:
            queryset = queryset.filter(risk_level=risk_level)
        
        # Filter by branch
        branch_id = self.request.query_params.get('branch')
        if branch_id:
            queryset = queryset.filter(branch_id=branch_id)
        
        return queryset
    
    def perform_create(self, serializer):
        # Generate customer number
        import uuid
        customer_no = f"CUST{timezone.now().strftime('%Y%m%d')}{uuid.uuid4().hex[:4].upper()}"
        serializer.save(
            created_by=self.request.user,
            customer_no=customer_no
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