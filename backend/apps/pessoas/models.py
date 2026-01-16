import uuid
from django.db import models
from django.conf import settings

class Efetivo(models.Model):
    class TipoEfetivo(models.TextChoices):
        INTERNO = 'interno', 'Interno'
        EXTERNO = 'externo', 'Externo'

    usuario = models.OneToOneField(
        settings.AUTH_USER_MODEL, 
        on_delete=models.SET_NULL, 
        null=True, 
        blank=True, 
        related_name='efetivo'
    )
    nome_completo = models.CharField(max_length=255)
    numero_funcional = models.CharField(max_length=50, unique=True, null=True, blank=True)
    tipo = models.CharField(max_length=10, choices=TipoEfetivo.choices, default=TipoEfetivo.INTERNO)
    orgao = models.ForeignKey('core.Orgao', on_delete=models.PROTECT, related_name='efetivos', null=True, blank=True)
    email = models.EmailField(max_length=255, blank=True)
    telefone = models.CharField(max_length=20, blank=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome_completo

class Visitante(models.Model):
    class TipoPessoa(models.TextChoices):
        SINGULAR = 'singular', 'Singular'
        COLETIVA = 'coletiva', 'Coletiva'
        

    class Genero(models.TextChoices):
        MASCULINO = 'M', 'Masculino'
        FEMININO = 'F', 'Feminino'
        OUTRO = 'O', 'Outro'

    class DocumentoTipo(models.TextChoices):
        BI = 'BI', 'Bilhete de Identidade'
        PASSAPORTE = 'PASSAPORTE', 'Passaporte'
        CARTA_CONDUCAO = 'CARTA', 'Carta de Condução'
        OUTRO = 'OUTRO', 'Outro'

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    tipo_pessoa = models.CharField(max_length=10, choices=TipoPessoa.choices, default=TipoPessoa.SINGULAR)

    # Campos para pessoa singular
    nome = models.CharField(max_length=255, blank=True, null=True)
    genero = models.CharField(max_length=1, choices=Genero.choices, blank=True, null=True)
    data_nascimento = models.DateField(blank=True, null=True)

    # Campos para pessoa coletiva
    designacao_social = models.CharField(max_length=255, blank=True, null=True)
    representante = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='representados')

    # Campos comuns
    documento_tipo = models.CharField(max_length=20, choices=DocumentoTipo.choices, blank=True, null=True)
    documento_numero = models.CharField(max_length=50, blank=True, null=True, unique=True, help_text="Número do documento de identificação (único)")
    documento_validade = models.DateField(blank=True, null=True)
    documento_emissao = models.DateField(blank=True, null=True, help_text="Data de emissão do documento")
    nacionalidade = models.CharField(max_length=100, blank=True, null=True)
    provincia_nascimento = models.CharField(max_length=100, blank=True, null=True, help_text="Província de nascimento")
    estado_civil = models.CharField(max_length=50, blank=True, null=True, help_text="Estado civil")
    nif = models.CharField(max_length=20, blank=True, null=True, unique=True, help_text="Número de Identificação Fiscal (único)")
    email = models.EmailField(max_length=255, blank=True, null=True)
    telefone = models.CharField(max_length=20, blank=True, null=True)
    endereco = models.TextField(blank=True, null=True)
    foto = models.ImageField(upload_to='visitantes_fotos/', blank=True, null=True)
    observacoes = models.TextField(blank=True, null=True)
    registado_por = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    data_registo = models.DateTimeField(auto_now_add=True)
    ativo = models.BooleanField(default=True)

    def __str__(self):
        return self.nome if self.tipo_pessoa == self.TipoPessoa.SINGULAR else self.designacao_social

    def clean(self):
        from django.core.exceptions import ValidationError
        if self.tipo_pessoa == self.TipoPessoa.COLETIVA:
            if not self.designacao_social:
                raise ValidationError('Para pessoa coletiva, a designação social é obrigatória.')
            if not self.nif:
                raise ValidationError('Para pessoa coletiva, o NIF é obrigatório.')
            self.nome = None
            self.genero = None
            self.data_nascimento = None
        elif self.tipo_pessoa == self.TipoPessoa.SINGULAR:
            if not self.nome:
                raise ValidationError('Para pessoa singular, o nome é obrigatório.')
            self.designacao_social = None
            self.representante = None
            # NIF pode ser opcional para pessoa singular, mas se fornecido deve ser único

    def save(self, *args, **kwargs):
        self.full_clean()
        super().save(*args, **kwargs)
