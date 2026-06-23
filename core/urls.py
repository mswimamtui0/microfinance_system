from django.contrib import admin

from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView

from accounts.views import CustomTokenObtainPairView
from accounts.views_api import RegisterView, BranchesView, ProfileView
from loans.views import LoanViewSet, LoanProductViewSet
from customers.views import CustomerViewSet
from payments.views import PaymentViewSet
from reports.views import PortfolioReportView, CollectionsReportView

# API Router for main models
router = DefaultRouter()
router.register(r'loans', LoanViewSet, basename='loan')
router.register(r'loan-products', LoanProductViewSet, basename='loan-product')
router.register(r'customers', CustomerViewSet, basename='customer')
router.register(r'payments', PaymentViewSet, basename='payment')

def home(request):
    return JsonResponse({
        'message': 'MicroFinance System API',
        'version': '1.0.0',
        'status': 'running'
    })

urlpatterns = [
    path('', home, name='home'),
    path('admin/', admin.site.urls),
    
    # JWT Authentication endpoints
    path('api/auth/login/', CustomTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('api/auth/verify/', TokenVerifyView.as_view(), name='token_verify'),
    
    # Custom auth endpoints using APIView
    path('api/auth/register/', RegisterView.as_view(), name='auth-register'),
    path('api/auth/branches/', BranchesView.as_view(), name='auth-branches'),
    path('api/auth/profile/', ProfileView.as_view(), name='auth-profile'),
    
    # API router for main models
    path('api/', include(router.urls)),
    
    # Reports
    path('api/reports/portfolio/', PortfolioReportView.as_view(), name='portfolio-report'),
    path('api/reports/collections/', CollectionsReportView.as_view(), name='collections-report'),
] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)