from rest_framework import serializers
from .models import Loan, LoanProduct, LoanSchedule
from customers.models import Customer
from customers.serializers import CustomerSerializer

class LoanProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanProduct
        fields = '__all__'

class LoanScheduleSerializer(serializers.ModelSerializer):
    class Meta:
        model = LoanSchedule
        fields = '__all__'

class LoanSerializer(serializers.ModelSerializer):
    customer_details = CustomerSerializer(source='customer', read_only=True)
    product_details = LoanProductSerializer(source='product', read_only=True)
    
    class Meta:
        model = Loan
        fields = '__all__'
        read_only_fields = ['loan_no', 'created_by', 'created_at', 'updated_at']
    
    def validate(self, data):
        """Validate loan data"""
        print(f"🔍 Validating loan data: {data}")
        
        # Check if customer exists
        customer = data.get('customer')
        if customer:
            try:
                customer_instance = Customer.objects.get(id=customer.id if hasattr(customer, 'id') else customer)
                print(f"✅ Customer found: {customer_instance.full_name}")
            except Customer.DoesNotExist:
                raise serializers.ValidationError({"customer": "Customer does not exist"})
        
        # Check if product exists and is active
        product = data.get('product')
        if product:
            try:
                product_instance = product if hasattr(product, 'id') else LoanProduct.objects.get(id=product)
                if not product_instance.is_active:
                    raise serializers.ValidationError({"product": "Product is not active"})
                print(f"✅ Product found: {product_instance.product_name}")
            except LoanProduct.DoesNotExist:
                raise serializers.ValidationError({"product": "Product does not exist"})
        
        # Validate principal amount
        principal = data.get('principal')
        if principal:
            if principal < product_instance.min_amount:
                raise serializers.ValidationError({
                    "principal": f"Amount must be at least {product_instance.min_amount}"
                })
            if principal > product_instance.max_amount:
                raise serializers.ValidationError({
                    "principal": f"Amount cannot exceed {product_instance.max_amount}"
                })
        
        # Validate term
        term_months = data.get('term_months')
        if term_months:
            if term_months < product_instance.min_term_months:
                raise serializers.ValidationError({
                    "term_months": f"Term must be at least {product_instance.min_term_months} months"
                })
            if term_months > product_instance.max_term_months:
                raise serializers.ValidationError({
                    "term_months": f"Term cannot exceed {product_instance.max_term_months} months"
                })
        
        return data

    def create(self, validated_data):
        """Create a new loan with schedule"""
        print(f"📝 Creating loan with data: {validated_data}")
        
        # Get or create customer
        customer = validated_data.get('customer')
        if isinstance(customer, int):
            customer = Customer.objects.get(id=customer)
            validated_data['customer'] = customer
        
        # Get or create product
        product = validated_data.get('product')
        if isinstance(product, int):
            product = LoanProduct.objects.get(id=product)
            validated_data['product'] = product
        
        # Generate loan number
        import uuid
        validated_data['loan_no'] = f"LN-{timezone.now().strftime('%Y%m%d')}-{uuid.uuid4().hex[:6].upper()}"
        
        # Set default status if not provided
        if 'status' not in validated_data:
            validated_data['status'] = 'draft'
        
        # Set application date if not provided
        if 'application_date' not in validated_data:
            validated_data['application_date'] = timezone.now().date()
        
        # Create loan
        loan = Loan.objects.create(**validated_data)
        print(f"✅ Loan created: {loan.loan_no}")
        
        return loan