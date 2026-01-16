from django.contrib import admin
from .models import Acesso

@admin.register(Acesso)
class AcessoAdmin(admin.ModelAdmin):
    list_display = ('get_visitante', 'get_orgao', 'data_entrada', 'data_saida')
    search_fields = ('visita__visitante__nome', 'visita__orgao__nome')
    list_filter = ('data_entrada', 'data_saida', 'visita__orgao')
    readonly_fields = ('visita', 'data_entrada', 'data_saida', 'registrado_por_entrada', 'registrado_por_saida')

    fieldsets = (
        ('Informações da Visita', {
            'fields': ('visita',)
        }),
        ('Registro de Acesso', {
            'fields': ('data_entrada', 'registrado_por_entrada', 'data_saida', 'registrado_por_saida')
        }),
    )

    def get_visitante(self, obj):
        if obj.visita:
            return obj.visita.visitante
        return "N/A"
    get_visitante.short_description = 'Visitante'
    get_visitante.admin_order_field = 'visita__visitante'

    def get_orgao(self, obj):
        if obj.visita:
            return obj.visita.orgao
        return "N/A"
    get_orgao.short_description = 'Órgão de Destino'
    get_orgao.admin_order_field = 'visita__orgao'

    def get_queryset(self, request):
        # Otimiza as queries para carregar os dados relacionados
        return super().get_queryset(request).select_related('visita__visitante', 'visita__orgao')

    def has_add_permission(self, request):
        # Desabilita a criação de Acessos diretamente no admin
        # A criação deve ser feita via API (registrar_entrada)
        return False