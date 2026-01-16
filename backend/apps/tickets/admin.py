from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.utils.safestring import mark_safe
from .models import Ticket, TicketComment, TicketAttachment, TicketTemplate

@admin.register(Ticket)
class TicketAdmin(admin.ModelAdmin):
    list_display = [
        'numero', 'titulo', 'categoria', 'prioridade', 'status',
        'solicitante', 'atribuido_para', 'data_criacao', 'tempo_resolucao'
    ]
    list_filter = [
        'categoria', 'prioridade', 'status', 'data_criacao',
        'atribuido_para', 'solicitante'
    ]
    search_fields = ['numero', 'titulo', 'descricao']
    readonly_fields = ['numero', 'data_criacao', 'data_atualizacao', 'tempo_resolucao']
    raw_id_fields = ['solicitante', 'atribuido_para']
    date_hierarchy = 'data_criacao'
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('numero', 'titulo', 'descricao', 'categoria', 'prioridade', 'status')
        }),
        ('Usuários', {
            'fields': ('solicitante', 'atribuido_para')
        }),
        ('Datas', {
            'fields': ('data_criacao', 'data_atualizacao', 'data_resolucao', 'data_fechamento')
        }),
        ('Avaliação', {
            'fields': ('satisfacao_usuario', 'comentario_satisfacao')
        }),
        ('Outros', {
            'fields': ('tags',)
        })
    )
    
    def tempo_resolucao(self, obj):
        """Exibe o tempo de resolução formatado"""
        tempo = obj.calcular_tempo_resolucao()
        if tempo:
            if tempo < 24:
                return f"{tempo:.1f}h"
            else:
                dias = tempo / 24
                return f"{dias:.1f}d"
        return "-"
    tempo_resolucao.short_description = "Tempo Resolução"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'solicitante', 'atribuido_para'
        )

@admin.register(TicketComment)
class TicketCommentAdmin(admin.ModelAdmin):
    list_display = ['ticket', 'autor', 'data_criacao', 'interno']
    list_filter = ['interno', 'data_criacao', 'autor']
    search_fields = ['comentario', 'ticket__numero', 'ticket__titulo']
    readonly_fields = ['data_criacao', 'data_atualizacao']
    raw_id_fields = ['ticket', 'autor']
    date_hierarchy = 'data_criacao'
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'ticket', 'autor'
        )

@admin.register(TicketAttachment)
class TicketAttachmentAdmin(admin.ModelAdmin):
    list_display = ['nome_original', 'ticket', 'upload_por', 'tamanho_formatado', 'data_upload']
    list_filter = ['data_upload', 'tipo_mime', 'upload_por']
    search_fields = ['nome_original', 'ticket__numero', 'ticket__titulo']
    readonly_fields = ['nome_original', 'tamanho', 'tipo_mime', 'data_upload']
    raw_id_fields = ['ticket', 'upload_por']
    date_hierarchy = 'data_upload'
    
    def tamanho_formatado(self, obj):
        """Formata o tamanho do arquivo"""
        size = obj.tamanho
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"
    tamanho_formatado.short_description = "Tamanho"
    
    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'ticket', 'upload_por'
        )

@admin.register(TicketTemplate)
class TicketTemplateAdmin(admin.ModelAdmin):
    list_display = ['nome', 'categoria', 'prioridade', 'ativo']
    list_filter = ['categoria', 'prioridade', 'ativo']
    search_fields = ['nome', 'titulo_template']
    list_editable = ['ativo']
    
    fieldsets = (
        ('Informações Básicas', {
            'fields': ('nome', 'categoria', 'prioridade', 'ativo')
        }),
        ('Template', {
            'fields': ('titulo_template', 'descricao_template')
        }),
        ('Outros', {
            'fields': ('tags',)
        })
    )