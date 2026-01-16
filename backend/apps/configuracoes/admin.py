from django.contrib import admin
from .models import ConfiguracaoSistema

@admin.register(ConfiguracaoSistema)
class ConfiguracaoSistemaAdmin(admin.ModelAdmin):
    list_display = ('chave', 'tipo', 'valor', 'ativo', 'logotipo_preview')
    search_fields = ('chave', 'valor', 'tipo')
    list_filter = ('ativo', 'tipo')

    def logotipo_preview(self, obj):
        if obj.logotipo:
            return f'<img src="{obj.logotipo.url}" style="max-height:40px;max-width:80px;" />'
        return ""
    logotipo_preview.allow_tags = True
    logotipo_preview.short_description = "Logotipo"
