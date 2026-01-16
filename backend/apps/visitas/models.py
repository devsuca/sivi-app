from django.db import models
from django.utils import timezone
from apps.pessoas.models import Visitante, Efetivo
from apps.core.models import Orgao

class Visita(models.Model):
    class EstadoVisita(models.TextChoices):
        AGENDADA = 'agendada', 'Agendada'
        EM_CURSO = 'em_curso', 'Em Curso'
        CONCLUIDA = 'concluida', 'Concluída'

    numero = models.CharField(
        max_length=25, # Aumentado para o prefixo
        unique=True, 
        editable=False, 
        help_text="Número único da visita (gerado automaticamente).",
        null=True # Temporariamente nulo para migração
    )
    visitante = models.ForeignKey(Visitante, on_delete=models.PROTECT, related_name='visitas')
    efetivo_visitar = models.ForeignKey(Efetivo, on_delete=models.SET_NULL, null=True, blank=True, related_name='visitas_recebidas')
    orgao = models.ForeignKey(Orgao, on_delete=models.PROTECT, related_name='visitas')
    motivo = models.TextField(blank=True)
    estado = models.CharField(max_length=20, choices=EstadoVisita.choices, default=EstadoVisita.AGENDADA)
    data_hora_entrada = models.DateTimeField(null=True, blank=True)
    data_hora_saida = models.DateTimeField(null=True, blank=True)
    observacoes = models.TextField(blank=True)
    registado_por = models.ForeignKey(Efetivo, on_delete=models.SET_NULL, null=True, related_name='visitas_registradas')
    data_registo = models.DateTimeField(auto_now_add=True)
    confirmada_recepcao = models.BooleanField(default=False, help_text='Recepção confirmou a passagem da visita por este órgão.')

    class Meta:
        ordering = ['-data_registo']  # Ordena por data de registro decrescente (mais recente primeiro)

    def __str__(self):
        return f"Visita {self.numero} - {self.visitante}"

    def _generate_numero_visita(self):
        """
        Gera um número de visita único no formato SIC-YYYYMMDD-NNN.
        """
        today = timezone.now().date()
        prefix = f"SIC-{today.strftime('%Y%m%d')}"
        
        # Encontra o último número para o prefixo de hoje
        last_visita = Visita.objects.filter(numero__startswith=prefix).order_by('numero').last()
        
        if last_visita:
            try:
                # Extrai a parte sequencial do número (ex: 'SIC-20250923-001' -> '001')
                last_seq = int(last_visita.numero.split('-')[2])
                new_seq = last_seq + 1
            except (IndexError, ValueError):
                new_seq = 1 # Fallback em caso de formato inesperado
        else:
            new_seq = 1
            
        return f"{prefix}-{new_seq:03d}"

    def save(self, *args, **kwargs):
        if not self.pk and not self.numero:
            # Loop para garantir a unicidade do número em caso de race conditions
            while True:
                numero_provisorio = self._generate_numero_visita()
                if not Visita.objects.filter(numero=numero_provisorio).exists():
                    self.numero = numero_provisorio
                    break
        super().save(*args, **kwargs)

class Acompanhante(models.Model):
    nome = models.CharField(max_length=255)
    documento_tipo = models.CharField(max_length=20, choices=Visitante.DocumentoTipo.choices)
    documento_numero = models.CharField(max_length=50)
    nacionalidade = models.CharField(max_length=100, blank=True)
    visita = models.ForeignKey(Visita, on_delete=models.CASCADE, related_name='acompanhantes')

    def __str__(self):
        return self.nome

class Viatura(models.Model):
    tipo = models.CharField(max_length=50, blank=True)
    marca = models.CharField(max_length=50, blank=True)
    cor = models.CharField(max_length=30, blank=True)
    matricula = models.CharField(max_length=20)
    visita = models.ForeignKey(Visita, on_delete=models.CASCADE, related_name='viaturas')

    class Meta:
        unique_together = ('matricula', 'visita')

    def __str__(self):
        return f"{self.marca} {self.matricula}"
