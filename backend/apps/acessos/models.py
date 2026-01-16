from django.db import models
from django.conf import settings
from apps.visitas.models import Visita


class Acesso(models.Model):
    """
    Registra o evento de entrada e saída de um visitante, vinculado a uma Visita agendada.
    """
    visita = models.OneToOneField(
        Visita,
        on_delete=models.PROTECT,
        related_name='acesso',
        help_text="A visita agendada para a qual este acesso está sendo registrado.",
        null=True
    )
    data_entrada = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Data e hora em que o visitante entrou."
    )
    data_saida = models.DateTimeField(
        null=True, 
        blank=True,
        help_text="Data e hora em que o visitante saiu."
    )
    
    registrado_por_entrada = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        related_name='+',
        help_text="Utilizador que registrou a entrada."
    )
    registrado_por_saida = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='+',
        help_text="Utilizador que registrou a saída."
    )

    def __str__(self):
        return f"Acesso para Visita ID: {self.visita_id}"