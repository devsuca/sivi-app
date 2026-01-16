from django.core.exceptions import ValidationError
from django.db import models
from django.utils.translation import gettext_lazy as _
import json
# Para o histórico, é necessário instalar: pip install django-simple-history
from simple_history.models import HistoricalRecords

# Manager para lidar com o cache (sugestão de implementação)
class ConfiguracaoManager(models.Manager):
    def get_valor(self, chave):
        from django.core.cache import cache
        cache_key = f'config_{chave}'
        valor = cache.get(cache_key)
        if valor is None:
            try:
                config = self.get(chave=chave, ativo=True)
                valor = config.get_valor_convertido()
                # Cache por 1 hora (3600 segundos), ou para sempre se as configs mudam raramente
                cache.set(cache_key, valor, timeout=3600)
            except ConfiguracaoSistema.DoesNotExist:
                # Retorna None ou um valor padrão, dependendo da política do sistema
                return None
        return valor

class ConfiguracaoSistema(models.Model):
    """
    Modelo aprimorado para armazenar configurações dinâmicas do sistema.
    Inclui tipagem de dados, validação estrita e histórico de alterações.
    """
    class TipoConfiguracao(models.TextChoices):
        ROLE = 'role', _('Role/Perfil')
        PERMISSAO = 'permissao', _('Permissão')
        INSTITUICAO = 'instituicao', _('Nome da Instituição')
        API = 'api', _('Configuração de API')
        RELATORIO = 'relatorio', _('Relatórios')
        IMPRESSAO = 'impressao', _('Impressão')
        TEMA = 'tema', _('Tema (Escuro/Claro)')
        OUTRO = 'outro', _('Outro')

    class TipoDado(models.TextChoices):
        TEXTO = 'texto', _('Texto')
        NUMERO = 'numero', _('Número')
        BOOLEANO = 'booleano', _('Booleano (True/False)')
        JSON = 'json', _('JSON')

    chave = models.CharField(
        max_length=100,
        unique=True,
        help_text=_("A chave única para identificar a configuração (ex: 'EMAIL_HOST').")
    )
    valor = models.TextField(
        help_text=_("O valor da configuração, de acordo com o Tipo de Dado selecionado.")
    )
    tipo = models.CharField(
        max_length=20,
        choices=TipoConfiguracao.choices,
        default=TipoConfiguracao.OUTRO,
        help_text=_("O tipo de configuração para agrupamento e contexto de uso.")
    )
    tipo_dado = models.CharField(
        max_length=20,
        choices=TipoDado.choices,
        default=TipoDado.TEXTO,
        help_text=_("O tipo de dado do valor, para validação e conversão automática.")
    )
    descricao = models.CharField(
        max_length=255,
        blank=True,
        help_text=_("Uma breve descrição sobre o propósito desta configuração.")
    )
    ativo = models.BooleanField(
        default=True,
        help_text=_("Indica se a configuração está ativa e deve ser usada pelo sistema.")
    )
    sensivel = models.BooleanField(
        default=False,
        help_text=_("Marque se o valor for sensível (ex: senha, API key). O valor não será exibido em logs ou interfaces de forma clara.")
    )
    logotipo = models.ImageField(
        upload_to='configuracoes/logotipos/',
        blank=True,
        null=True,
        help_text=_("Logotipo para relatórios e impressão, se aplicável.")
    )
    manual_utilizador = models.FileField(
        upload_to='configuracoes/manuais/',
        blank=True,
        null=True,
        help_text=_("Manual do utilizador em formato PDF.")
    )
    criado_em = models.DateTimeField(auto_now_add=True)
    atualizado_em = models.DateTimeField(auto_now=True)

    # Histórico de alterações
    history = HistoricalRecords()

    # Manager customizado
    objects = ConfiguracaoManager()

    class Meta:
        verbose_name = _("Configuração do Sistema")
        verbose_name_plural = _("Configurações do Sistema")
        ordering = ['tipo', 'chave']

    def __str__(self):
        return f"{self.get_tipo_display()}: {self.chave}"

    def clean(self):
        """
        Validação customizada baseada no tipo de dado.
        """
        super().clean()
        
        # Valida o valor de acordo com o tipo_dado
        if self.tipo_dado == self.TipoDado.JSON:
            try:
                json.loads(self.valor)
            except json.JSONDecodeError:
                raise ValidationError({'valor': _("O valor deve ser um JSON válido.")})
        
        elif self.tipo_dado == self.TipoDado.NUMERO:
            try:
                float(self.valor)  # Tenta converter para float, que cobre inteiros e decimais
            except ValueError:
                raise ValidationError({'valor': _("O valor deve ser um número válido.")})

        elif self.tipo_dado == self.TipoDado.BOOLEANO:
            if self.valor.lower() not in ['true', 'false', '1', '0']:
                raise ValidationError({'valor': _("O valor para booleano deve ser 'true', 'false', '1' ou '0'.")})

    def save(self, *args, **kwargs):
        # Garante que a validação seja chamada antes de salvar
        self.full_clean()
        super().save(*args, **kwargs)
        
        # Invalida o cache após salvar
        from django.core.cache import cache
        cache.delete(f'config_{self.chave}')

    def get_valor_convertido(self):
        """
        Retorna o valor convertido para o tipo de dado correto.
        """
        if self.tipo_dado == self.TipoDado.JSON:
            return json.loads(self.valor)
        elif self.tipo_dado == self.TipoDado.NUMERO:
            # Pode ser int ou float
            if '.' in self.valor or 'e' in self.valor.lower():
                return float(self.valor)
            return int(self.valor)
        elif self.tipo_dado == self.TipoDado.BOOLEANO:
            return self.valor.lower() in ['true', '1']
        return self.valor