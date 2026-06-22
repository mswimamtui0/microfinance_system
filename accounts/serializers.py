from django.contrib.auth import get_user_model
from rest_framework import serializers
from django.contrib.auth.password_validation import validate_password
from django.core.validators import EmailValidator
from rest_framework_simplejwt.tokens import RefreshToken
from .models import User

User = get_user_model()

class UserRegistrationSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(
        write_only=True,
        required=True,
        label="Confirm Password"
    )
    email = serializers.EmailField(
        required=True,
        validators=[EmailValidator()]
    )

    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'password', 'password2',
            'first_name', 'last_name', 'phone', 'role', 'branch'
        ]
        extra_kwargs = {
            'first_name': {'required': True},
            'last_name': {'required': True},
            'role': {'required': True},
        }

    def validate(self, attrs):
        # Check passwords match
        if attrs['password'] != attrs['password2']:
            raise serializers.ValidationError({
                "password2": "Password fields didn't match."
            })
        
        # Check username uniqueness
        if User.objects.filter(username=attrs['username']).exists():
            raise serializers.ValidationError({
                "username": "This username is already taken."
            })
        
        # Check email uniqueness
        if User.objects.filter(email=attrs['email']).exists():
            raise serializers.ValidationError({
                "email": "This email is already registered."
            })
        
        return attrs

    def create(self, validated_data):
        # Remove password2 from validated data
        validated_data.pop('password2')
        
        # Create user with hashed password
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data['email'],
            password=validated_data['password'],
            first_name=validated_data['first_name'],
            last_name=validated_data['last_name'],
            phone=validated_data.get('phone', ''),
            role=validated_data.get('role', 'officer'),
            branch=validated_data.get('branch', None)
        )
        
        return user

class UserProfileSerializer(serializers.ModelSerializer):
    full_name = serializers.SerializerMethodField()
    branch_name = serializers.SerializerMethodField()
    
    class Meta:
        model = User
        fields = [
            'id', 'username', 'email', 'first_name', 'last_name', 'full_name',
            'phone', 'role', 'branch', 'branch_name', 'is_active',
            'date_joined', 'last_login'
        ]
        read_only_fields = ['id', 'is_active', 'date_joined', 'last_login']
    
    def get_full_name(self, obj):
        return obj.get_full_name()
    
    def get_branch_name(self, obj):
        return obj.branch.name if obj.branch else None

class UserUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = [
            'first_name', 'last_name', 'email', 'phone', 'role', 'branch'
        ]