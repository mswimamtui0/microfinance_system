from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate, get_user_model
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from django.core.mail import send_mail
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from .serializers import (
    UserRegistrationSerializer, 
    UserProfileSerializer, 
    UserUpdateSerializer
)
from branches.models import Branch

User = get_user_model()


@method_decorator(csrf_exempt, name='dispatch')
class CustomTokenObtainPairView(TokenObtainPairView):
    """Custom login view that doesn't require CSRF"""
    permission_classes = [AllowAny]
    
    def post(self, request, *args, **kwargs):
        print("=" * 50)
        print("LOGIN ATTEMPT")
        print(f"Username: {request.data.get('username')}")
        print(f"Password provided: {'Yes' if request.data.get('password') else 'No'}")
        
        username = request.data.get('username')
        password = request.data.get('password')
        
        if not username or not password:
            return Response({
                'detail': 'Username and password are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Authenticate user
        user = authenticate(username=username, password=password)
        
        if user is None:
            print(f"❌ Authentication failed for: {username}")
            # Check if user exists
            try:
                user_exists = User.objects.get(username=username)
                print(f"User exists but password is incorrect: {username}")
            except User.DoesNotExist:
                print(f"User does not exist: {username}")
            
            return Response({
                'detail': 'Invalid username or password'
            }, status=status.HTTP_401_UNAUTHORIZED)
        
        if not user.is_active:
            print(f"❌ User is inactive: {username}")
            return Response({
                'detail': 'User account is disabled'
            }, status=status.HTTP_403_FORBIDDEN)
        
        print(f"✅ Authentication successful for: {username}")
        
        # Generate tokens
        refresh = RefreshToken.for_user(user)
        
        response_data = {
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'first_name': user.first_name,
                'last_name': user.last_name,
                'role': user.role,
                'branch': user.branch_id,
                'branch_name': user.branch.name if user.branch else None,
                'is_superuser': user.is_superuser,
            }
        }
        print("Login successful, returning tokens")
        print("=" * 50)
        
        return Response(response_data, status=status.HTTP_200_OK)


class AuthViewSet(viewsets.GenericViewSet):
    permission_classes = [AllowAny]
    
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['post'], url_path='register')
    def register(self, request):
        """Register a new user"""
        print("=" * 50)
        print("REGISTRATION ATTEMPT")
        print(f"Data: {request.data}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                print(f"✅ User created: {user.username}")
                
                # Send welcome email (optional)
                try:
                    self._send_welcome_email(user)
                except Exception as e:
                    print(f"Email error: {e}")
                
                # Generate tokens
                refresh = RefreshToken.for_user(user)
                
                # Get user profile data
                profile_serializer = UserProfileSerializer(user)
                
                print("Registration successful, returning tokens")
                print("=" * 50)
                
                return Response({
                    'success': True,
                    'message': 'Registration successful!',
                    'user': profile_serializer.data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=status.HTTP_201_CREATED)
        else:
            print(f"❌ Registration errors: {serializer.errors}")
            print("=" * 50)
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=status.HTTP_400_BAD_REQUEST)
    
    @method_decorator(csrf_exempt)
    @action(detail=False, methods=['get'], url_path='branches')
    def branches(self, request):
        """Get list of active branches for registration"""
        try:
            print("📊 Fetching branches...")
            branches = Branch.objects.filter(is_active=True)
            print(f"📊 Found {branches.count()} active branches")
            
            data = []
            for branch in branches:
                data.append({
                    'id': branch.id,
                    'name': branch.name,
                    'code': branch.code,
                    'region': branch.region,
                    'district': branch.district,
                })
            
            print(f"📤 Returning branches: {data}")
            return Response(data)
        except Exception as e:
            print(f"❌ Error fetching branches: {e}")
            return Response([], status=status.HTTP_200_OK)
    
    @action(detail=False, methods=['get'], url_path='profile', permission_classes=[IsAuthenticated])
    def profile(self, request):
        """Get current user profile"""
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)
    
    @action(detail=False, methods=['put', 'patch'], url_path='update_profile', permission_classes=[IsAuthenticated])
    def update_profile(self, request):
        """Update current user profile"""
        serializer = UserUpdateSerializer(
            request.user, 
            data=request.data, 
            partial=True
        )
        if serializer.is_valid():
            serializer.save()
            return Response({
                'success': True,
                'message': 'Profile updated successfully',
                'user': UserProfileSerializer(request.user).data
            })
        return Response({
            'success': False,
            'errors': serializer.errors
        }, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=False, methods=['post'], url_path='change_password', permission_classes=[IsAuthenticated])
    def change_password(self, request):
        """Change user password"""
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        confirm_password = request.data.get('confirm_password')
        
        if not old_password or not new_password or not confirm_password:
            return Response({
                'success': False,
                'message': 'All password fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if new_password != confirm_password:
            return Response({
                'success': False,
                'message': 'New passwords do not match'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if not user.check_password(old_password):
            return Response({
                'success': False,
                'message': 'Current password is incorrect'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        user.set_password(new_password)
        user.save()
        
        return Response({
            'success': True,
            'message': 'Password changed successfully'
        })
    
    def _send_welcome_email(self, user):
        """Send welcome email to new user"""
        try:
            subject = 'Welcome to MicroFinance System'
            html_message = render_to_string('emails/welcome.html', {
                'user': user,
                'login_url': 'http://localhost:3000/login',
            })
            plain_message = strip_tags(html_message)
            
            send_mail(
                subject,
                plain_message,
                'noreply@microfinance.com',
                [user.email],
                html_message=html_message,
                fail_silently=True,
            )
        except Exception as e:
            print(f"Failed to send welcome email: {e}")