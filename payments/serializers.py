from rest_framework import serializers
from .models import Payment
from loans.serializers import LoanSerializer

class PaymentSerializer(serializers.ModelSerializer):
    loan_details = LoanSerializer(source='loan', read_only=True)
    received_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = Payment
        fields = '__all__'
        read_only_fields = ['transaction_ref', 'received_by', 'status', 'created_at', 'updated_at']
    
    def get_received_by_name(self, obj):
        if obj.received_by:
            return obj.received_by.get_full_name()
        return None
    
    def validate_amount_paid(self, value):
        if value <= 0:
            raise serializers.ValidationError("Amount must be greater than 0")
        
        # Check if amount exceeds outstanding balance
        loan = self.context.get('loan') or self.instance.loan if self.instance else None
        if not loan:
            # Try to get from request data
            loan_id = self.initial_data.get('loan')
            if loan_id:
                from loans.models import Loan
                loan = Loan.objects.get(id=loan_id)
        
        if loan and value > loan.outstanding_balance:
            raise serializers.ValidationError(
                f"Amount exceeds outstanding balance of {loan.outstanding_balance}"
            )
        
        return value