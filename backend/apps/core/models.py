from django.db import models
from django.conf import settings

class Orgao(models.Model):
    nome = models.CharField(max_length=255, unique=True)
    sigla = models.CharField(max_length=20, blank=True, help_text="Sigla do órgão (ex: DG, RH)")
    bloco = models.CharField(max_length=50, blank=True)
    numero_porta = models.CharField(max_length=20, blank=True)
    telefone_interno = models.CharField(max_length=20, blank=True)
    responsavel = models.ForeignKey(
        settings.AUTH_USER_MODEL,  # Using AUTH_USER_MODEL to avoid circular import
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='orgaos_responsaveis'
    )
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.pk and self.responsavel:
            efetivo = getattr(self.responsavel, 'efetivo', None)
            if not efetivo or efetivo.orgao != self:
                raise ValidationError('O responsável deve pertencer ao órgão.')

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)

class LogSistema(models.Model):
    entidade = models.CharField(max_length=100)
    acao = models.CharField(max_length=50)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)
    dados_anteriores = models.JSONField(null=True, blank=True)
    dados_novos = models.JSONField(null=True, blank=True)

    def __str__(self):
        return f"{self.entidade} - {self.acao} por {self.user} em {self.data_hora}"
