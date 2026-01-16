from django.contrib import admin
from apps.core.models import Orgao

# Register your models here.

@admin.register(Orgao)
class OrgaoAdmin(admin.ModelAdmin):
    """
    Admin for the Orgao model, which is located in the core app.
    """
    list_display = ('nome', 'sigla', 'bloco', 'numero_porta', 'telefone_interno', 'responsavel')
    search_fields = ('nome', 'sigla', 'bloco', 'responsavel__username')
    list_filter = ('bloco', 'ativo')
    autocomplete_fields = ('responsavel',)