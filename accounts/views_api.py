from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import authenticate
from django.views.decorators.csrf import csrf_exempt
from django.utils.decorators import method_decorator
from django.db import transaction
from .serializers import UserRegistrationSerializer, UserProfileSerializer
from branches.models import Branch


@method_decorator(csrf_exempt, name='dispatch')
class RegisterView(APIView):
    permission_classes = [AllowAny]
    
    def post(self, request):
        print("=" * 50)
        print("REGISTRATION ATTEMPT")
        print(f"Data: {request.data}")
        
        serializer = UserRegistrationSerializer(data=request.data)
        if serializer.is_valid():
            with transaction.atomic():
                user = serializer.save()
                print(f"✅ User created: {user.username}")
                
                refresh = RefreshToken.for_user(user)
                profile_serializer = UserProfileSerializer(user)
                
                return Response({
                    'success': True,
                    'message': 'Registration successful!',
                    'user': profile_serializer.data,
                    'tokens': {
                        'refresh': str(refresh),
                        'access': str(refresh.access_token),
                    }
                }, status=201)
        else:
            print(f"❌ Registration errors: {serializer.errors}")
            return Response({
                'success': False,
                'errors': serializer.errors
            }, status=400)


@method_decorator(csrf_exempt, name='dispatch')
class BranchesView(APIView):
    permission_classes = [AllowAny]
    
    def get(self, request):
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
            return Response([], status=200)


class ProfileView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)