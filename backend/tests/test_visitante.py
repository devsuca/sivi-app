import pytest
from django.core.exceptions import ValidationError
from apps.pessoas.models import Visitante
from tests.factories import VisitanteFactory

@pytest.mark.django_db
def test_visitante_singular_requires_nome():
    visitante = VisitanteFactory.build(tipo_pessoa=Visitante.TipoPessoa.SINGULAR, nome=None)
    with pytest.raises(ValidationError, match='Para pessoa singular, o nome é obrigatório.'):
        visitante.full_clean()

@pytest.mark.django_db
def test_visitante_coletiva_requires_designacao_social_and_nif():
    visitante = VisitanteFactory.build(tipo_pessoa=Visitante.TipoPessoa.COLETIVA, designacao_social=None, nif=None)
    with pytest.raises(ValidationError) as excinfo:
        visitante.full_clean()
    assert 'Para pessoa coletiva, a designação social é obrigatória.' in excinfo.value.messages
    assert 'Para pessoa coletiva, o NIF é obrigatório.' in excinfo.value.messages

@pytest.mark.django_db
def test_visitante_singular_clears_coletiva_fields():
    visitante = VisitanteFactory(tipo_pessoa=Visitante.TipoPessoa.SINGULAR, nome="Nome Singular", designacao_social="Designacao Coletiva", nif="123456789")
    visitante.full_clean()
    visitante.save()
    assert visitante.designacao_social is None
    assert visitante.nif is None

@pytest.mark.django_db
def test_visitante_coletiva_clears_singular_fields():
    visitante = VisitanteFactory(tipo_pessoa=Visitante.TipoPessoa.COLETIVA, designacao_social="Designacao Coletiva", nif="123456789", nome="Nome Singular", genero=Visitante.Genero.MASCULINO)
    visitante.full_clean()
    visitante.save()
    assert visitante.nome is None
    assert visitante.genero is None

@pytest.mark.django_db
def test_visitante_ativo_default_true():
    visitante = VisitanteFactory()
    assert visitante.ativo is True
