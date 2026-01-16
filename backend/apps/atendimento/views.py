from rest_framework import viewsets
from .models import Atendimento
from .serializers import AtendimentoSerializer
from drf_spectacular.utils import extend_schema, extend_schema_view


@extend_schema(tags=['Atendimento'])
@extend_schema_view(
    list=extend_schema(description='Obtém uma lista de atendimentos.'),
    retrieve=extend_schema(description='Obtém os detalhes de um atendimento específico.'),
    create=extend_schema(description='Cria um novo registo de atendimento.'),
    update=extend_schema(description='Atualiza um registo de atendimento existente.'),
    partial_update=extend_schema(description='Atualiza parcialmente um registo de atendimento existente.'),
    destroy=extend_schema(description='Remove um registo de atendimento.'),
)
class AtendimentoViewSet(viewsets.ModelViewSet):
    queryset = Atendimento.objects.all()
    serializer_class = AtendimentoSerializer
