from django.contrib import admin
from .models import Atendimento

@admin.register(Atendimento)
class AtendimentoAdmin(admin.ModelAdmin):
    list_display = ('visitante', 'assunto', 'data_atendimento', 'atendido_por')
    search_fields = ('visitante__nome', 'assunto')
    list_filter = ('data_atendimento',)
