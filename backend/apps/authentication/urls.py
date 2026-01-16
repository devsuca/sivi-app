from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PerfilViewSet, MeView, EmailTokenObtainView, CrachaViewSet, AtendimentoViewSet, ChangePasswordView, UpdateProfileView
from rest_framework_simplejwt.views import TokenRefreshView
from .views import CustomTokenObtainPairView

router = DefaultRouter()
router.register(r'perfis', PerfilViewSet)
router.register(r'crachas', CrachaViewSet, basename='cracha')
router.register(r'atendimentos', AtendimentoViewSet, basename='atendimento')

urlpatterns = [
    path('', include(router.urls)),
    path('token/', EmailTokenObtainView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('me/', MeView.as_view(), name='auth_me'),
    path('token/email/', EmailTokenObtainView.as_view(), name='token_obtain_email'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('update-profile/', UpdateProfileView.as_view(), name='update_profile'),
]
