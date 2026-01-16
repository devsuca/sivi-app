from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ConfiguracaoSistemaViewSet

router = DefaultRouter()
router.register(r'configuracoes', ConfiguracaoSistemaViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
