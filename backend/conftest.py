import pytest
from rest_framework.test import APIClient
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth import get_user_model
from apps.authentication.models import Perfil
from apps.pessoas.models import Efetivo
from apps.core.models import Orgao

User = get_user_model()

@pytest.fixture
def api_client():
    return APIClient()

@pytest.fixture
def create_orgao():
    def _create_orgao(nome="Orgao Teste", bloco="A", numero_porta="101", telefone_interno="123456789"):
        return Orgao.objects.create(nome=nome, bloco=bloco, numero_porta=numero_porta, telefone_interno=telefone_interno)
    return _create_orgao

@pytest.fixture
def create_perfil():
    def _create_perfil(nome="Portaria", nivel_acesso=Perfil.NivelAcesso.PORTARIA):
        return Perfil.objects.create(nome=nome, nivel_acesso=nivel_acesso)
    return _create_perfil

@pytest.fixture
def create_efetivo():
    def _create_efetivo(nome_completo="Efetivo Teste", numero_funcional="12345", tipo=Efetivo.TipoEfetivo.INTERNO, orgao=None):
        if orgao is None:
            orgao = Orgao.objects.create(nome="Orgao Padrao")
        return Efetivo.objects.create(nome_completo=nome_completo, numero_funcional=numero_funcional, tipo=tipo, orgao=orgao)
    return _create_efetivo

@pytest.fixture
def create_user():
    def _create_user(email="test@example.com", password="password123", username="testuser", perfil=None, efetivo=None):
        if perfil is None:
            perfil = Perfil.objects.create(nome="Portaria", nivel_acesso=Perfil.NivelAcesso.PORTARIA)
        if efetivo is None:
            orgao = Orgao.objects.create(nome="Orgao do Efetivo")
            efetivo = Efetivo.objects.create(nome_completo="Efetivo do User", numero_funcional="EF001", orgao=orgao)
        return User.objects.create_user(email=email, password=password, username=username, perfil=perfil, efetivo=efetivo)
    return _create_user

@pytest.fixture
def get_jwt_token():
    def _get_jwt_token(user):
        refresh = RefreshToken.for_user(user)
        return str(refresh.access_token)
    return _get_jwt_token

@pytest.fixture
def authenticated_client(api_client, create_user, get_jwt_token):
    user = create_user()
    token = get_jwt_token(user)
    api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
    api_client.user = user # Attach user to client for convenience
    return api_client

@pytest.fixture
def authenticated_client_with_perfil():
    def _authenticated_client_with_perfil(api_client, create_user, get_jwt_token, perfil_name, nivel_acesso):
        perfil = Perfil.objects.create(nome=perfil_name, nivel_acesso=nivel_acesso)
        user = create_user(perfil=perfil)
        token = get_jwt_token(user)
        api_client.credentials(HTTP_AUTHORIZATION=f'Bearer {token}')
        api_client.user = user
        return api_client
    return _authenticated_client_with_perfil

@pytest.fixture
def admin_user(db, django_user_model, create_perfil, create_efetivo, create_orgao):
    orgao = create_orgao(nome="Orgao Admin")
    efetivo = create_efetivo(orgao=orgao, numero_funcional="ADMIN001")
    perfil = create_perfil(nome="Admin", nivel_acesso=Perfil.NivelAcesso.ADMIN)
    user = django_user_model.objects.create_superuser(
        email="admin@example.com",
        username="admin_user", # Explicitly provide a username
        password="password",
        perfil=perfil,
        efetivo=efetivo
    )
    return user