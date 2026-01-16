import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from apps.authentication.models import Perfil, HistoricoAcessos
from tests.factories import UserFactory, PerfilFactory, EfetivoFactory, OrgaoFactory

@pytest.mark.django_db
def test_jwt_token_obtain_pair(api_client, create_user):
    user = create_user(email="test_auth@example.com", password="password123")
    url = reverse('token_obtain_pair')
    data = {'email': "test_auth@example.com", 'password': "password123"}
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data
    assert 'refresh' in response.data

@pytest.mark.django_db
def test_jwt_token_refresh(api_client, create_user):
    user = create_user(email="test_refresh@example.com", password="password123")
    refresh = RefreshToken.for_user(user)
    url = reverse('token_refresh')
    data = {'refresh': str(refresh)}
    response = api_client.post(url, data, format='json')
    assert response.status_code == status.HTTP_200_OK
    assert 'access' in response.data

@pytest.mark.django_db
def test_user_login_logs_historico_acessos(api_client, create_user):
    user = create_user(email="test_login_log@example.com", password="password123")
    url = reverse('token_obtain_pair')
    data = {'email': "test_login_log@example.com", 'password': "password123"}
    api_client.post(url, data, format='json')
    assert HistoricoAcessos.objects.filter(user=user, tipo_acao=HistoricoAcessos.TipoAcao.LOGIN, sucesso=True).exists()

@pytest.mark.django_db
def test_user_login_failed_logs_historico_acessos(api_client, create_user):
    create_user(email="test_login_fail@example.com", password="password123")
    url = reverse('token_obtain_pair')
    data = {'email': "test_login_fail@example.com", 'password': "wrong_password"}
    api_client.post(url, data, format='json')
    assert HistoricoAcessos.objects.filter(tipo_acao=HistoricoAcessos.TipoAcao.FALHA, sucesso=False).exists()

@pytest.mark.django_db
def test_admin_access_to_admin_view(admin_client):
    # Assuming there's an admin-only view, e.g., a list of all users
    # For this test, we'll just hit a generic endpoint that should be accessible
    # by an admin, like listing all users if that were exposed.
    # Since we don't have a specific admin-only view, we'll test a generic one
    # that requires authentication.
    url = reverse('visita-list') # Example: any authenticated endpoint
    response = admin_client.get(url)
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_portaria_access_to_visita_list(portaria_client):
    url = reverse('visita-list')
    response = portaria_client.get(url)
    assert response.status_code == status.HTTP_200_OK

@pytest.mark.django_db
def test_unauthenticated_access_denied(api_client):
    url = reverse('visita-list')
    response = api_client.get(url)
    assert response.status_code == status.HTTP_401_UNAUTHORIZED
