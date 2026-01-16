from django.db import models
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.utils.translation import gettext_lazy as _

class Perfil(models.Model):
    class NivelAcesso(models.TextChoices):
        ADMIN = 'admin', _('Administrador')
        PORTARIA = 'portaria', _('Portaria')
        SECRETARIA = 'secretaria', _('Secretaria')
        RECEPCAO = 'recepcao', _('Recepção')
        SUPORTE = 'suporte', _('Suporte Técnico')

    nome = models.CharField(_('nome do perfil'), max_length=100, unique=True)
    nivel_acesso = models.CharField(
        _('nível de acesso'),
        max_length=20,
        choices=NivelAcesso.choices,
        default=NivelAcesso.PORTARIA,
    )

    class Meta:
        verbose_name = _('perfil')
        verbose_name_plural = _('perfis')

    def __str__(self):
        return self.nome

class UtilizadorManager(BaseUserManager):
    def create_user(self, username, email, password=None, **extra_fields):
        if not email:
            raise ValueError(_('The Email must be set'))
        email = self.normalize_email(email)
        user = self.model(username=username, email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password, username=None, **extra_fields):
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        extra_fields.setdefault('is_active', True)

        # Removido bloco if e código legado do antigo modelo Utilizador

class HistoricoAcessos(models.Model):
    class TipoAcao(models.TextChoices):
        LOGIN = 'login', _('Login')
        LOGOUT = 'logout', _('Logout')
        FALHA = 'falha', _('Falha de Login')

    from django.conf import settings
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    data_hora = models.DateTimeField(auto_now_add=True)
    ip = models.GenericIPAddressField(null=True, blank=True)
    tipo_acao = models.CharField(max_length=20, choices=TipoAcao.choices)
    sucesso = models.BooleanField(default=False)

    class Meta:
        verbose_name = _('histórico de acesso')
        # Ajuste: user pode ser ForeignKey para Usuario ou para AbstractUser
        # user = models.ForeignKey(Utilizador, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return f"{self.user} - {self.get_tipo_acao_display()} em {self.data_hora}"
