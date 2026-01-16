from django.db import models
from django.conf import settings
from apps.pessoas.models import Visitante


class Atendimento(models.Model):
    visitante = models.ForeignKey(Visitante, on_delete=models.PROTECT)
    assunto = models.CharField(max_length=255)
    data_atendimento = models.DateTimeField(auto_now_add=True)
    atendido_por = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.PROTECT,
        related_name='atendimentos_realizados'
    )
    observacoes = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Atendimento de {self.visitante} em {self.data_atendimento}"
