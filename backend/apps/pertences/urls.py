from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PertenceViewSet

router = DefaultRouter()
router.register(r'pertences', PertenceViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
