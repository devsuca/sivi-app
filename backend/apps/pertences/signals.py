import json
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from .models import Pertence
from apps.core.models import LogSistema

from apps.core.middleware import get_current_user

@receiver(post_save, sender=Pertence)
def log_pertence_save(sender, instance, created, **kwargs):
    user = get_current_user()
    if created:
        acao = "criacao"
        dados_novos = json.dumps(instance.__dict__, default=str)
        LogSistema.objects.create(entidade="Pertence", acao=acao, user=user, dados_novos=dados_novos)
    else:
        acao = "atualizacao"
        # For updates, getting old data requires pre_save or fetching the old instance
        # For simplicity, we'll just log the new data for now.
        dados_novos = json.dumps(instance.__dict__, default=str)
        LogSistema.objects.create(entidade="Pertence", acao=acao, user=user, dados_novos=dados_novos)

@receiver(post_delete, sender=Pertence)
def log_pertence_delete(sender, instance, **kwargs):
    user = get_current_user()
    acao = "exclusao"
    dados_anteriores = json.dumps(instance.__dict__, default=str)
    LogSistema.objects.create(entidade="Pertence", acao=acao, user=user, dados_anteriores=dados_anteriores)
