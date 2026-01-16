import factory
import uuid
from django.contrib.auth import get_user_model
from apps.authentication.models import Perfil
from apps.pessoas.models import Efetivo, Visitante
from apps.core.models import Orgao
from apps.visitas.models import Visita, Acompanhante, Viatura
from apps.pertences.models import Pertence

User = get_user_model()

class PerfilFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Perfil

    nome = factory.Sequence(lambda n: f"Perfil {n}")
    nivel_acesso = Perfil.NivelAcesso.PORTARIA

class OrgaoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Orgao

    nome = factory.Sequence(lambda n: f"Orgao {n}")
    bloco = factory.Faker('lexify', text='???')
    numero_porta = factory.Sequence(lambda n: f"{n}")
    telefone_interno = factory.Faker('numerify', text='#########')

class EfetivoFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Efetivo

    nome_completo = factory.Faker('name')
    numero_funcional = factory.Sequence(lambda n: f"FUNC{n:04d}-{uuid.uuid4().hex[:8]}")
    tipo = Efetivo.TipoEfetivo.INTERNO
    orgao = factory.SubFactory(OrgaoFactory)
    email = factory.Faker('email')
    telefone = factory.Faker('numerify', text='#########')
    ativo = True

class UserFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = User

    username = factory.Sequence(lambda n: f"user{n}")
    email = factory.Sequence(lambda n: f"user{n}@example.com")
    password = factory.PostGenerationMethodCall('set_password', 'password123')
    perfil = factory.SubFactory(PerfilFactory)
    efetivo = factory.SubFactory(EfetivoFactory)

class VisitanteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Visitante

    tipo_pessoa = Visitante.TipoPessoa.SINGULAR
    nome = factory.Faker('name')
    genero = Visitante.Genero.MASCULINO
    data_nascimento = factory.Faker('date_of_birth')
    documento_tipo = Visitante.DocumentoTipo.BI
    documento_numero = factory.Faker('ssn')
    nacionalidade = factory.Faker('country')
    ativo = True

class VisitaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Visita

    visitante = factory.SubFactory(VisitanteFactory)
    efetivo_visitar = factory.SubFactory(EfetivoFactory)
    orgao = factory.SubFactory(OrgaoFactory)
    motivo = factory.Faker('sentence')
    estado = Visita.EstadoVisita.AGENDADA
    data_hora_entrada = factory.Faker('date_time_this_year')
    registado_por = factory.SubFactory(EfetivoFactory)

class AcompanhanteFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Acompanhante

    visita = factory.SubFactory(VisitaFactory)
    nome = factory.Faker('name')
    documento_tipo = Visitante.DocumentoTipo.BI
    documento_numero = factory.Faker('ssn')
    nacionalidade = factory.Faker('country')

class ViaturaFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Viatura

    visita = factory.SubFactory(VisitaFactory)
    tipo = factory.Faker('word')
    marca = factory.Faker('company')
    cor = factory.Faker('color_name')
    matricula = factory.Sequence(lambda n: f"AA-{n:02d}-BB")

class PertenceFactory(factory.django.DjangoModelFactory):
    class Meta:
        model = Pertence

    descricao = factory.Faker('sentence')
    tipo = factory.Faker('word')
    estado = Pertence.EstadoPertence.EM_POSSE
    entregue_por = factory.SubFactory(EfetivoFactory)
    visita = factory.SubFactory(VisitaFactory)
