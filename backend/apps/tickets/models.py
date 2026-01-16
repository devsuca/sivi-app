from django.db import models
from django.contrib.auth import get_user_model
from django.utils.translation import gettext_lazy as _
from django.core.validators import MinValueValidator, MaxValueValidator
from simple_history.models import HistoricalRecords
import uuid

User = get_user_model()

class TicketCategory(models.TextChoices):
    GERAL = 'geral', _('Geral')
    TECNICO = 'tecnico', _('Problema Técnico')
    USUARIO = 'usuario', _('Dúvida de Usuário')
    SISTEMA = 'sistema', _('Problema do Sistema')
    SEGURANCA = 'seguranca', _('Segurança')
    MELHORIA = 'melhoria', _('Sugestão de Melhoria')

class TicketPriority(models.TextChoices):
    BAIXA = 'baixa', _('Baixa')
    MEDIA = 'media', _('Média')
    ALTA = 'alta', _('Alta')
    URGENTE = 'urgente', _('Urgente')

class TicketStatus(models.TextChoices):
    ABERTO = 'aberto', _('Aberto')
    EM_ANDAMENTO = 'em_andamento', _('Em Andamento')
    AGUARDANDO_USUARIO = 'aguardando_usuario', _('Aguardando Usuário')
    RESOLVIDO = 'resolvido', _('Resolvido')
    FECHADO = 'fechado', _('Fechado')
    CANCELADO = 'cancelado', _('Cancelado')

class Ticket(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    numero = models.CharField(max_length=20, unique=True, verbose_name=_('Número do Ticket'))
    
    # Informações básicas
    titulo = models.CharField(max_length=200, verbose_name=_('Título'))
    descricao = models.TextField(verbose_name=_('Descrição'))
    categoria = models.CharField(
        max_length=20,
        choices=TicketCategory.choices,
        default=TicketCategory.GERAL,
        verbose_name=_('Categoria')
    )
    prioridade = models.CharField(
        max_length=10,
        choices=TicketPriority.choices,
        default=TicketPriority.MEDIA,
        verbose_name=_('Prioridade')
    )
    status = models.CharField(
        max_length=20,
        choices=TicketStatus.choices,
        default=TicketStatus.ABERTO,
        verbose_name=_('Status')
    )
    
    # Usuários envolvidos
    solicitante = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='tickets_solicitados',
        verbose_name=_('Solicitante')
    )
    atribuido_para = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tickets_atribuidos',
        verbose_name=_('Atribuído para')
    )
    
    # Datas importantes
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name=_('Data de Criação'))
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name=_('Data de Atualização'))
    data_resolucao = models.DateTimeField(null=True, blank=True, verbose_name=_('Data de Resolução'))
    data_fechamento = models.DateTimeField(null=True, blank=True, verbose_name=_('Data de Fechamento'))
    
    # Campos adicionais
    tempo_resolucao_horas = models.DecimalField(
        max_digits=8,
        decimal_places=2,
        null=True,
        blank=True,
        verbose_name=_('Tempo de Resolução (horas)')
    )
    satisfacao_usuario = models.IntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(1), MaxValueValidator(5)],
        verbose_name=_('Satisfação do Usuário (1-5)')
    )
    comentario_satisfacao = models.TextField(
        null=True,
        blank=True,
        verbose_name=_('Comentário sobre Satisfação')
    )
    
    # Tags para categorização
    tags = models.JSONField(default=list, blank=True, verbose_name=_('Tags'))
    
    # Histórico
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = _('Ticket')
        verbose_name_plural = _('Tickets')
        ordering = ['-data_criacao']
        indexes = [
            models.Index(fields=['status']),
            models.Index(fields=['prioridade']),
            models.Index(fields=['categoria']),
            models.Index(fields=['solicitante']),
            models.Index(fields=['atribuido_para']),
            models.Index(fields=['data_criacao']),
        ]
    
    def __str__(self):
        return f"#{self.numero} - {self.titulo}"
    
    def save(self, *args, **kwargs):
        if not self.numero:
            self.numero = self.generate_ticket_number()
        super().save(*args, **kwargs)
    
    def generate_ticket_number(self):
        """Gera um número único para o ticket"""
        from datetime import datetime
        import time
        
        year = datetime.now().year
        month = datetime.now().month
        
        # Usar timestamp para garantir unicidade
        timestamp = int(time.time())
        
        # Conta tickets do mês atual
        count = Ticket.objects.filter(
            data_criacao__year=year,
            data_criacao__month=month
        ).count() + 1
        
        # Usar timestamp + contador para garantir unicidade
        return f"TK{year}{month:02d}{count:04d}{timestamp % 10000:04d}"
    
    def calcular_tempo_resolucao(self):
        """Calcula o tempo de resolução em horas"""
        if self.data_resolucao and self.data_criacao:
            delta = self.data_resolucao - self.data_criacao
            return delta.total_seconds() / 3600
        return None
    
    def pode_ser_editado_por(self, user):
        """Verifica se o usuário pode editar o ticket"""
        return (
            user == self.solicitante or
            user == self.atribuido_para or
            user.is_staff or
            user.is_superuser
        )
    
    def pode_ser_fechado_por(self, user):
        """Verifica se o usuário pode fechar o ticket"""
        return (
            user == self.solicitante or
            user.is_staff or
            user.is_superuser
        )

class TicketComment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='comentarios',
        verbose_name=_('Ticket')
    )
    autor = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name=_('Autor')
    )
    comentario = models.TextField(verbose_name=_('Comentário'))
    data_criacao = models.DateTimeField(auto_now_add=True, verbose_name=_('Data de Criação'))
    data_atualizacao = models.DateTimeField(auto_now=True, verbose_name=_('Data de Atualização'))
    
    # Indica se é um comentário interno (apenas para equipe)
    interno = models.BooleanField(default=False, verbose_name=_('Comentário Interno'))
    
    # Histórico
    history = HistoricalRecords()
    
    class Meta:
        verbose_name = _('Comentário do Ticket')
        verbose_name_plural = _('Comentários dos Tickets')
        ordering = ['data_criacao']
    
    def __str__(self):
        return f"Comentário em #{self.ticket.numero} por {self.autor.username}"

class TicketAttachment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    ticket = models.ForeignKey(
        Ticket,
        on_delete=models.CASCADE,
        related_name='anexos',
        verbose_name=_('Ticket')
    )
    arquivo = models.FileField(
        upload_to='tickets/anexos/%Y/%m/%d/',
        verbose_name=_('Arquivo')
    )
    nome_original = models.CharField(max_length=255, verbose_name=_('Nome Original'))
    tamanho = models.BigIntegerField(verbose_name=_('Tamanho (bytes)'))
    tipo_mime = models.CharField(max_length=100, verbose_name=_('Tipo MIME'))
    data_upload = models.DateTimeField(auto_now_add=True, verbose_name=_('Data de Upload'))
    upload_por = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        verbose_name=_('Upload por')
    )
    
    class Meta:
        verbose_name = _('Anexo do Ticket')
        verbose_name_plural = _('Anexos dos Tickets')
        ordering = ['-data_upload']
    
    def __str__(self):
        return f"Anexo: {self.nome_original} - #{self.ticket.numero}"
    
    def save(self, *args, **kwargs):
        if self.arquivo:
            self.nome_original = self.arquivo.name
            self.tamanho = self.arquivo.size
            # Aqui você pode adicionar lógica para detectar o tipo MIME
            self.tipo_mime = 'application/octet-stream'  # Default
        super().save(*args, **kwargs)

class TicketTemplate(models.Model):
    """Templates para criação rápida de tickets"""
    nome = models.CharField(max_length=100, verbose_name=_('Nome do Template'))
    categoria = models.CharField(
        max_length=20,
        choices=TicketCategory.choices,
        verbose_name=_('Categoria')
    )
    prioridade = models.CharField(
        max_length=10,
        choices=TicketPriority.choices,
        verbose_name=_('Prioridade')
    )
    titulo_template = models.CharField(max_length=200, verbose_name=_('Título Template'))
    descricao_template = models.TextField(verbose_name=_('Descrição Template'))
    tags = models.JSONField(default=list, blank=True, verbose_name=_('Tags'))
    ativo = models.BooleanField(default=True, verbose_name=_('Ativo'))
    
    class Meta:
        verbose_name = _('Template de Ticket')
        verbose_name_plural = _('Templates de Tickets')
        ordering = ['nome']
    
    def __str__(self):
        return self.nome