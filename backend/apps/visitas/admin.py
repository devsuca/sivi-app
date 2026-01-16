from django.contrib import admin
from .models import Visita, Acompanhante, Viatura

class AcompanhanteInline(admin.TabularInline):
    model = Acompanhante
    extra = 1

class ViaturaInline(admin.TabularInline):
    model = Viatura
    extra = 1
    
    
@admin.register(Visita)
class VisitaAdmin(admin.ModelAdmin):
    list_display = ('visitante', 'orgao', 'estado', 'data_hora_entrada', 'data_hora_saida')
    list_filter = ('estado', 'orgao', 'data_registo')
    search_fields = ('visitante__nome', 'orgao__nome')
    inlines = [AcompanhanteInline, ViaturaInline]