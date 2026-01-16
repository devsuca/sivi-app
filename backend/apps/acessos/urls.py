from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import AcessoViewSet

router = DefaultRouter()
router.register(r'acessos', AcessoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
