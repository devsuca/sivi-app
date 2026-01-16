from django.db import models
from django.contrib.auth import get_user_model
from apps.core.models import Orgao
from apps.pessoas.models import Visitante
from apps.visitas.models import Visita

User = get_user_model()


class DSINotification(models.Model):
    """
    Modelo para notificações do Departamento de Segurança Institucional (DSI)
    """
    URGENCIA_CHOICES = [
        ('baixa', 'Baixa'),
        ('media', 'Média'),
        ('alta', 'Alta'),
    ]
    
    STATUS_CHOICES = [
        ('pendente', 'Pendente'),
        ('visualizada', 'Visualizada'),
        ('processada', 'Processada'),
    ]
    
    # Informações da visita
    visitante = models.ForeignKey(
        Visitante,
        on_delete=models.CASCADE,
        related_name='dsi_notifications',
        verbose_name='Visitante'
    )
    
    visita = models.ForeignKey(
        Visita,
        on_delete=models.CASCADE,
        related_name='dsi_notifications',
        verbose_name='Visita',
        null=True,
        blank=True
    )
    
    orgao = models.ForeignKey(
        Orgao,
        on_delete=models.CASCADE,
        related_name='dsi_notifications',
        verbose_name='Órgão'
    )
    
    # Dados da notificação
    nome_pessoa = models.CharField(max_length=255, verbose_name='Nome da Pessoa')
    data_visita = models.DateField(verbose_name='Data da Visita')
    hora_visita = models.TimeField(verbose_name='Hora da Visita')
    observacoes = models.TextField(blank=True, null=True, verbose_name='Observações')
    urgencia = models.CharField(
        max_length=10,
        choices=URGENCIA_CHOICES,
        default='media',
        verbose_name='Urgência'
    )
    
    # Controle de envio e processamento
    enviado_por = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='notifications_sent',
        verbose_name='Enviado por'
    )
    
    data_envio = models.DateTimeField(auto_now_add=True, verbose_name='Data de Envio')
    status = models.CharField(
        max_length=15,
        choices=STATUS_CHOICES,
        default='pendente',
        verbose_name='Status'
    )
    
    # Usuário que processou a notificação
    processado_por = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='notifications_processed',
        verbose_name='Processado por'
    )
    
    data_processamento = models.DateTimeField(null=True, blank=True, verbose_name='Data de Processamento')
    
    # Metadados
    created_at = models.DateTimeField(auto_now_add=True, verbose_name='Criado em')
    updated_at = models.DateTimeField(auto_now=True, verbose_name='Atualizado em')
    
    class Meta:
        verbose_name = 'Notificação DSI'
        verbose_name_plural = 'Notificações DSI'
        ordering = ['-data_envio']
        indexes = [
            models.Index(fields=['status', 'data_envio']),
            models.Index(fields=['orgao', 'status']),
            models.Index(fields=['urgencia', 'status']),
        ]
    
    def __str__(self):
        return f"Notificação DSI - {self.nome_pessoa} ({self.get_urgencia_display()})"
    
    def save(self, *args, **kwargs):
        # Se está sendo processada, definir data de processamento
        if self.status == 'processada' and not self.data_processamento:
            from django.utils import timezone
            self.data_processamento = timezone.now()
        
        super().save(*args, **kwargs)
    
    @property
    def is_pending(self):
        return self.status == 'pendente'
    
    @property
    def is_high_priority(self):
        return self.urgencia == 'alta'
    
    @property
    def time_since_created(self):
        from django.utils import timezone
        now = timezone.now()
        diff = now - self.data_envio
        
        if diff.days > 0:
            return f"{diff.days} dia(s) atrás"
        elif diff.seconds > 3600:
            hours = diff.seconds // 3600
            return f"{hours} hora(s) atrás"
        elif diff.seconds > 60:
            minutes = diff.seconds // 60
            return f"{minutes} minuto(s) atrás"
        else:
            return "Agora mesmo"
