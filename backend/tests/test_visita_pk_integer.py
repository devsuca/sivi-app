import pytest
from django.urls import reverse
from rest_framework.test import APIClient
from apps.pessoas.models import Visitante, Efetivo
from apps.core.models import Orgao
from apps.visitas.models import Visita

@pytest.mark.django_db
def test_criar_visita_com_efetivo_pk_integer():
    client = APIClient()
    # Cria um visitante
    visitante = Visitante.objects.create(
        nome='Visitante Teste',
        tipo_pessoa='singular',
        documento_tipo='BI',
        documento_numero='123456789',
        genero='M'
    )
    # Cria um órgão
    orgao = Orgao.objects.create(nome='Órgão Teste', sigla='OT')
    # Cria um efetivo
    efetivo = Efetivo.objects.create(
        nome_completo='Efetivo Teste',
        tipo='interno',
        orgao=orgao
    )
    # Payload da visita
    payload = {
        'visitante': str(visitante.id),
        'efetivo_visitar': efetivo.id,  # Envia PK como integer
        'orgao': orgao.id,
        'motivo': 'Teste de integração',
        'estado': 'agendada',
        'data_hora_entrada': '2025-09-30T10:00:00Z',
        'observacoes': 'Teste automático',
        'acompanhantes': [],
        'viaturas': []
    }
    # Autenticação opcional se necessário
    # client.force_authenticate(user=algum_usuario)
    url = reverse('visita-list')
    response = client.post(url, payload, format='json')
    assert response.status_code == 201, response.data
    visita = Visita.objects.get(pk=response.data['id'])
    assert visita.efetivo_visitar == efetivo
    assert visita.visitante == visitante
    assert visita.orgao == orgao
    assert visita.motivo == 'Teste de integração'
