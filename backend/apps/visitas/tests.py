from django.test import TestCase
from rest_framework.test import APIClient
from rest_framework import status
from tests.factories import VisitaFactory, AcompanhanteFactory, ViaturaFactory, UserFactory, VisitanteFactory, OrgaoFactory
from .models import Visita, Acompanhante, Viatura
from django.utils import timezone

class VisitaAPITestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = UserFactory()
        self.client.force_authenticate(user=self.user)

    def test_create_visita_with_acompanhantes_and_viaturas(self):
        visita_data = {
            "visitante": VisitanteFactory().id,
            "orgao": OrgaoFactory().id,
            "motivo": "Reunião",
            "acompanhantes": [
                {
                    "nome": "Acompanhante 1",
                    "documento_tipo": "BI",
                    "documento_numero": "123456789"
                }
            ],
            "viaturas": [
                {
                    "marca": "Toyota",
                    "matricula": "AA-00-BB"
                }
            ]
        }

        response = self.client.post("/api/visitas/", visita_data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)

        visita = Visita.objects.get(id=response.data['id'])
        self.assertEqual(visita.acompanhantes.count(), 1)
        self.assertEqual(visita.viaturas.count(), 1)

        acompanhante = visita.acompanhantes.first()
        self.assertEqual(acompanhante.nome, "Acompanhante 1")

        viatura = visita.viaturas.first()
        self.assertEqual(viatura.marca, "Toyota")

    def test_get_visita_list(self):
        for _ in range(5):
            VisitaFactory(data_hora_entrada=timezone.now())
        response = self.client.get("/api/visitas/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 5)
