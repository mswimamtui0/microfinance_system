from rest_framework import serializers
from .models import Customer, Guarantor

class GuarantorSerializer(serializers.ModelSerializer):
    class Meta:
        model = Guarantor
        fields = '__all__'
        read_only_fields = ['created_at', 'updated_at']

class CustomerSerializer(serializers.ModelSerializer):
    age = serializers.IntegerField(read_only=True)
    full_name = serializers.CharField(read_only=True)
    
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['customer_no', 'created_by', 'created_at', 'updated_at']