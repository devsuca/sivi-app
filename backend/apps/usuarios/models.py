from django.contrib.auth.models import AbstractUser
from django.db import models
from apps.core.models import Orgao

from apps.authentication.models import Perfil

class Usuario(AbstractUser):
    nome = models.CharField(max_length=150)
    perfil = models.ForeignKey(Perfil, on_delete=models.SET_NULL, null=True, blank=True)
    orgao = models.ForeignKey(Orgao, null=True, blank=True, on_delete=models.SET_NULL)
    is_active = models.BooleanField(default=True)
    data_criacao = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        # Se não há órgão definido, usar DSI como padrão
        if not self.orgao:
            try:
                dsi_orgao = Orgao.objects.filter(
                    nome__icontains='DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL'
                ).first()
                if dsi_orgao:
                    self.orgao = dsi_orgao
                else:
                    # Se não encontrar DSI, usar o primeiro órgão disponível
                    first_orgao = Orgao.objects.first()
                    if first_orgao:
                        self.orgao = first_orgao
            except Orgao.DoesNotExist:
                pass  # Se não há órgãos, deixar como está
        
        super().save(*args, **kwargs)

    def __str__(self):
        return self.username
