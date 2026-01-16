import pytest
from django.urls import reverse
from rest_framework import status
from apps.visitas.models import Visita
from apps.authentication.models import Perfil
from tests.factories import VisitaFactory, VisitanteFactory, OrgaoFactory, EfetivoFactory, UserFactory
from django.utils import timezone

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
def test_create_visita_success(portaria_client, create_orgao, create_efetivo):
    visitante = VisitanteFactory()
    orgao_visita = create_orgao(nome="Orgao da Visita")
    efetivo_visitar = create_efetivo(orgao=orgao_visita)

    url = reverse('visita-list')
    data = {
        'visitante': visitante.id,
        'efetivo_visitar': efetivo_visitar.id,
        'orgao': orgao_visita.id,
        'motivo': 'Reunião',
        'estado': Visita.EstadoVisita.AGENDADA,
        'data_hora_entrada': timezone.now().isoformat(),
    }
    response = portaria_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_201_CREATED
    assert Visita.objects.count() == 1
    visita = Visita.objects.first()
    assert visita.registado_por == portaria_client.user.efetivo

@pytest.mark.django_db
def test_create_visita_inactive_visitante(portaria_client, create_orgao, create_efetivo):
    visitante = VisitanteFactory(ativo=False)
    orgao_visita = create_orgao(nome="Orgao da Visita")
    efetivo_visitar = create_efetivo(orgao=orgao_visita)

    url = reverse('visita-list')
    data = {
        'visitante': visitante.id,
        'efetivo_visitar': efetivo_visitar.id,
        'orgao': orgao_visita.id,
        'motivo': 'Reunião',
        'estado': Visita.EstadoVisita.AGENDADA,
        'data_hora_entrada': timezone.now().isoformat(),
    }
    response = portaria_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'O visitante selecionado não está ativo.' in str(response.data)

@pytest.mark.django_db
def test_finalizar_visita_success(portaria_client, create_orgao, create_efetivo):
    orgao_visita = create_orgao(nome="Orgao da Visita")
    efetivo_visitar = create_efetivo(orgao=orgao_visita)
    visita = VisitaFactory(estado=Visita.EstadoVisita.EM_CURSO, orgao=orgao_visita, efetivo_visitar=efetivo_visitar)

    url = reverse('visita-finalizar', kwargs={'pk': visita.pk})
    response = portaria_client.post(url)
    visita.refresh_from_db()

    assert response.status_code == status.HTTP_200_OK
    assert visita.estado == Visita.EstadoVisita.CONCLUIDA
    assert visita.data_hora_saida is not None

@pytest.mark.django_db
def test_finalizar_visita_not_em_curso(portaria_client, create_orgao, create_efetivo):
    orgao_visita = create_orgao(nome="Orgao da Visita")
    efetivo_visitar = create_efetivo(orgao=orgao_visita)
    visita = VisitaFactory(estado=Visita.EstadoVisita.AGENDADA, orgao=orgao_visita, efetivo_visitar=efetivo_visitar)

    url = reverse('visita-finalizar', kwargs={'pk': visita.pk})
    response = portaria_client.post(url)

    assert response.status_code == status.HTTP_400_BAD_REQUEST
    assert 'Esta visita não está em curso.' in str(response.data)

@pytest.mark.django_db
def test_list_visitas_filter_estado(portaria_client, create_orgao, create_efetivo):
    orgao_visita = create_orgao(nome="Orgao da Visita")
    efetivo_visitar = create_efetivo(orgao=orgao_visita)
    VisitaFactory(estado=Visita.EstadoVisita.AGENDADA, orgao=orgao_visita, efetivo_visitar=efetivo_visitar)
    VisitaFactory(estado=Visita.EstadoVisita.EM_CURSO, orgao=orgao_visita, efetivo_visitar=efetivo_visitar)

    url = reverse('visita-list') + f'?estado={Visita.EstadoVisita.AGENDADA}'
    response = portaria_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['estado'] == Visita.EstadoVisita.AGENDADA

@pytest.mark.django_db
def test_list_visitas_em_curso(portaria_client, create_orgao, create_efetivo):
    orgao_visita = create_orgao(nome="Orgao da Visita")
    efetivo_visitar = create_efetivo(orgao=orgao_visita)
    VisitaFactory(estado=Visita.EstadoVisita.AGENDADA, orgao=orgao_visita, efetivo_visitar=efetivo_visitar)
    VisitaFactory(estado=Visita.EstadoVisita.EM_CURSO, orgao=orgao_visita, efetivo_visitar=efetivo_visitar)

    url = reverse('visita-em-curso')
    response = portaria_client.get(url)

    assert response.status_code == status.HTTP_200_OK
    assert len(response.data) == 1
    assert response.data[0]['estado'] == Visita.EstadoVisita.EM_CURSO

@pytest.mark.django_db
def test_portaria_cannot_view_visitas_from_other_orgao(api_client, create_user, get_jwt_token, create_perfil, create_efetivo, create_orgao):
    # User 1 (Portaria) from Orgao A
    orgao_a = create_orgao(nome="Orgao A")
    efetivo_a = create_efetivo(orgao=orgao_a)
    perfil_portaria = create_perfil(nome="Portaria", nivel_acesso=Perfil.NivelAcesso.PORTARIA)
    user_a = create_user(email="portaria_a@example.com", username="portaria_a", perfil=perfil_portaria, efetivo=efetivo_a)
    client_a = api_client
    token_a = get_jwt_token(user_a)
    client_a.credentials(HTTP_AUTHORIZATION=f'Bearer {token_a}')
    client_a.user = user_a

    # User 2 (Portaria) from Orgao B
    orgao_b = create_orgao(nome="Orgao B")
    efetivo_b = create_efetivo(orgao=orgao_b)
    user_b = create_user(email="portaria_b@example.com", username="portaria_b", perfil=perfil_portaria, efetivo=efetivo_b)
    client_b = api_client
    token_b = get_jwt_token(user_b)
    client_b.credentials(HTTP_AUTHORIZATION=f'Bearer {token_b}')
    client_b.user = user_b

    # Visita in Orgao A
    VisitaFactory(orgao=orgao_a, efetivo_visitar=efetivo_a)
    # Visita in Orgao B
    VisitaFactory(orgao=orgao_b, efetivo_visitar=efetivo_b)

    # Portaria A should only see visits from Orgao A
    url = reverse('visita-list')
    response_a = client_a.get(url)
    assert response_a.status_code == status.HTTP_200_OK
    assert len(response_a.data) == 1
    assert response_a.data[0]['orgao'] == orgao_a.id

    # Portaria B should only see visits from Orgao B
    response_b = client_b.get(url)
    assert response_b.status_code == status.HTTP_200_OK
    assert len(response_b.data) == 1
    assert response_b.data[0]['orgao'] == orgao_b.id
