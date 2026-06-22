from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AuthViewSet

# Create router for auth views
router = DefaultRouter()
router.register(r'', AuthViewSet, basename='auth')

urlpatterns = [
    path('', include(router.urls)),
]