from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VisitanteViewSet, EfetivoViewSet


router = DefaultRouter()
router.register(r'visitantes', VisitanteViewSet)
router.register(r'efetivos', EfetivoViewSet)

urlpatterns = [
    path('', include(router.urls)),
]
