from django.contrib import admin
from .models import DSINotification


@admin.register(DSINotification)
class DSINotificationAdmin(admin.ModelAdmin):
    list_display = [
        'nome_pessoa',
        'orgao',
        'data_visita',
        'hora_visita',
        'urgencia',
        'status',
        'enviado_por',
        'data_envio',
        'processado_por',
        'data_processamento'
    ]
    
    list_filter = [
        'status',
        'urgencia',
        'orgao',
        'data_visita',
        'data_envio',
        'enviado_por'
    ]
    
    search_fields = [
        'nome_pessoa',
        'observacoes',
        'orgao__nome',
        'enviado_por__nome'
    ]
    
    readonly_fields = [
        'data_envio',
        'data_processamento',
        'created_at',
        'updated_at'
    ]
    
    fieldsets = (
        ('Informações da Visita', {
            'fields': (
                'visitante',
                'visita',
                'orgao',
                'nome_pessoa',
                'data_visita',
                'hora_visita',
                'observacoes'
            )
        }),
        ('Controle da Notificação', {
            'fields': (
                'urgencia',
                'status',
                'enviado_por',
                'data_envio',
                'processado_por',
                'data_processamento'
            )
        }),
        ('Metadados', {
            'fields': (
                'created_at',
                'updated_at'
            ),
            'classes': ('collapse',)
        })
    )
    
    ordering = ['-data_envio']
    
    def get_queryset(self, request):
        """
        Filtrar notificações baseado no usuário
        """
        qs = super().get_queryset(request)
        
        # Admin pode ver todas
        if request.user.is_superuser:
            return qs
        
        # Portaria pode ver todas
        if hasattr(request.user, 'perfil') and request.user.perfil.nivel_acesso == 'portaria':
            return qs
        
        # Outros usuários veem apenas do seu órgão
        if hasattr(request.user, 'efetivo') and request.user.efetivo.orgao:
            return qs.filter(orgao=request.user.efetivo.orgao)
        
        return qs.none()
