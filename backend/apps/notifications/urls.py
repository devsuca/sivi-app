from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DSINotificationViewSet

router = DefaultRouter()
router.register(r'notifications', DSINotificationViewSet, basename='dsi-notifications')

urlpatterns = [
    path('', include(router.urls)),
]
