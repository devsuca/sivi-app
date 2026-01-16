from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import health_check, OrgaoViewSet, LogSistemaViewSet

router = DefaultRouter()
router.register(r'orgaos', OrgaoViewSet)
router.register(r'audit-logs', LogSistemaViewSet, basename='audit-logs')

urlpatterns = [
    path('', include(router.urls)),
    path('health/', health_check, name='healthcheck'),
]
