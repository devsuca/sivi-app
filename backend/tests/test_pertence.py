import pytest
from django.urls import reverse
from rest_framework import status
from apps.pertences.models import Pertence, MovimentoPertence
from apps.authentication.models import Perfil
from tests.factories import PertenceFactory, VisitaFactory, OrgaoFactory, EfetivoFactory, UserFactory

@pytest.fixture
def portaria_client(api_client, create_user, get_jwt_token, create_perfil, create_efetivo, create_orgao):
    orgao = create_orgao(nome="Orgao da Portaria")
    efetivo = create_efetivo(orgao=orgao)
    perfil = create_perfil(nome="Portaria", nivel_acesso=Perfil.NivelAcesso.PORTARIA)
    user = create_user(email="portaria@example.com", username="portaria", perfil=perfil, efetivo=efetivo)
    token = get_jwt_token(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    api_client.user = user
    return api_client

@pytest.fixture
def admin_client(api_client, create_user, get_jwt_token, create_perfil, create_efetivo, create_orgao):
    orgao = create_orgao(nome="Orgao do Admin")
    efetivo = create_efetivo(orgao=orgao)
    perfil = create_perfil(nome="Admin", nivel_acesso=Perfil.NivelAcesso.ADMIN)
    user = create_user(email="admin@example.com", username="admin", perfil=perfil, efetivo=efetivo)
    token = get_jwt_token(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    api_client.user = user
    return api_client

@pytest.mark.django_db
def test_create_pertence_success(portaria_client, create_orgao, create_efetivo):
    visita = VisitaFactory()
    url = reverse('pertence-list')
    data = {
        'descricao': 'Mochila',
        'tipo': 'Bagagem',
        'visita': visita.id,
    }
    response = portaria_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Pertence.objects.count() == 1
    pertence = Pertence.objects.first()
    assert pertence.entregue_por == portaria_client.user.efetivo
    assert MovimentoPertence.objects.count() == 1
    movimento = MovimentoPertence.objects.first()
    assert movimento.acao == MovimentoPertence.AcaoMovimento.ENTREGA
    assert movimento.agente == portaria_client.user.efetivo

@pytest.mark.django_db
def test_levantar_pertence_success(portaria_client, create_orgao, create_efetivo):
    pertence = PertenceFactory(estado=Pertence.EstadoPertence.EM_POSSE)
    url = reverse('pertence-levantar', kwargs={'pk': pertence.pk})
    response = portaria_client.post(url)
    pertence.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert pertence.estado == Pertence.EstadoPertence.LEVANTADO
    assert pertence.levantado_por == portaria_client.user.efetivo
    assert MovimentoPertence.objects.count() == 2 # One for creation, one for pickup
    movimento = MovimentoPertence.objects.filter(acao=MovimentoPertence.AcaoMovimento.LEVANTAMENTO).first()
    assert movimento.agente == portaria_client.user.efetivo

@pytest.mark.django_db
def test_levantar_pertence_already_levantado(portaria_client, create_orgao, create_efetivo):
    pertence = PertenceFactory(estado=Pertence.EstadoPertence.LEVANTADO)
    url = reverse('pertence-levantar', kwargs={'pk': pertence.pk})
    response = portaria_client.post(url)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'Este pertence já foi levantado.' in str(response.data)

@pytest.mark.django_db
def test_list_pertences_em_posse(portaria_client, create_orgao, create_efetivo):
    PertenceFactory(estado=Pertence.EstadoPertence.EM_POSSE)
    PertenceFactory(estado=Pertence.EstadoPertence.LEVANTADO)

    url = reverse('pertence-em-posse')
    response = portaria_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['estado'] == Pertence.EstadoPertence.EM_POSSE
