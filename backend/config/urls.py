
from django.contrib import admin
from django.urls import path, include
from drf_spectacular.views import SpectacularAPIView, SpectacularRedocView, SpectacularSwaggerView
from apps.core.views import health_check

urlpatterns = [
    path('admin/', admin.site.urls),
    
    # Health check endpoint
    path('api/health/', health_check, name='health_check'),
    
    path('api/auth/', include('apps.authentication.urls')),
    path('api/pessoas/', include('apps.pessoas.urls')),
    path('api/', include('apps.visitas.urls')),
    path('api/', include('apps.pertences.urls')),
    path('api/', include('apps.acessos.urls')),
    path('api/', include('apps.atendimento.urls')),
    path('api/', include('apps.crachas.urls')),
    path('api/', include('apps.core.urls')),
    path('api/usuarios/', include('apps.usuarios.urls')),
    path('api/relatorios/', include('apps.relatorios.urls')),
    path('api/', include('apps.notifications.urls')),
    path('api/', include('apps.configuracoes.urls')),
    path('api/', include('apps.tickets.urls')),

    # Documentação da API
    path('api/schema/', SpectacularAPIView.as_view(), name='schema'),
    # Optional UI:
    path('api/schema/swagger-ui/', SpectacularSwaggerView.as_view(url_name='schema'), name='swagger-ui'),
    path('api/schema/redoc/', SpectacularRedocView.as_view(url_name='schema'), name='redoc'),
]
