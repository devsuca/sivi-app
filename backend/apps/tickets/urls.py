from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TicketViewSet, TicketTemplateViewSet

router = DefaultRouter()
router.register(r'tickets', TicketViewSet, basename='ticket')
router.register(r'templates', TicketTemplateViewSet, basename='ticket-template')

urlpatterns = [
    path('', include(router.urls)),
]
