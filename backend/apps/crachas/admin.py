from django.contrib import admin
from .models import Cracha

@admin.register(Cracha)
class CrachaAdmin(admin.ModelAdmin):
    """
    Admin options for the Cracha model.
    """
    list_display = ('numero', 'estado', 'visita')
    list_filter = ('estado',)
    search_fields = ('numero',)
    autocomplete_fields = ('visita',)