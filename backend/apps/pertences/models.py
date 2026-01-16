from django.db import models
from apps.pessoas.models import Efetivo
from apps.visitas.models import Visita

class Pertence(models.Model):
    class EstadoPertence(models.TextChoices):
        EM_POSSE = 'em_posse', 'Em Posse'
        LEVANTADO = 'levantado', 'Levantado'

    descricao = models.CharField(max_length=255)
    tipo = models.CharField(max_length=100, blank=True)
    quantidade = models.PositiveIntegerField(verbose_name='Quantidade', default=1)
    estado = models.CharField(max_length=20, choices=EstadoPertence.choices, default=EstadoPertence.EM_POSSE)
    entregue_por = models.ForeignKey(Efetivo, on_delete=models.PROTECT, related_name='pertences_entregues')
    levantado_por = models.ForeignKey(Efetivo, on_delete=models.SET_NULL, null=True, blank=True, related_name='pertences_levantados')
    visita = models.ForeignKey(Visita, on_delete=models.CASCADE, null=True, blank=True, related_name='pertences')
    efetivo = models.ForeignKey(Efetivo, on_delete=models.CASCADE, null=True, blank=True, related_name='pertences_pessoais')
    data_entrega = models.DateTimeField(auto_now_add=True)
    data_levantamento = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"{self.descricao} ({self.get_estado_display()})"

class MovimentoPertence(models.Model):
    class AcaoMovimento(models.TextChoices):
        ENTREGA = 'entrega', 'Entrega'
        LEVANTAMENTO = 'levantamento', 'Levantamento'

    pertence = models.ForeignKey(Pertence, on_delete=models.CASCADE, related_name='movimentos')
    agente = models.ForeignKey(Efetivo, on_delete=models.PROTECT, related_name='movimentos_pertences')
    data_hora = models.DateTimeField(auto_now_add=True)
    acao = models.CharField(max_length=20, choices=AcaoMovimento.choices)
    observacoes = models.TextField(blank=True)

    def __str__(self):
        return f"Movimento de {self.pertence} por {self.agente} em {self.data_hora}"
