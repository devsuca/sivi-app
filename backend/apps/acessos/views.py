from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from drf_spectacular.utils import extend_schema

from .models import Acesso
from .serializers import (
    AcessoSerializer, 
    RegistrarEntradaSerializer, 
    RegistrarSaidaSerializer
)
from apps.visitas.models import Visita

@extend_schema(tags=['Acessos'])
class AcessoViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para gerenciar os registros de Acesso (Entrada e Saída).
    
    A criação e atualização de acessos são feitas através de ações específicas:
    - `registrar_entrada`
    - `registrar_saida`
    """
    queryset = Acesso.objects.select_related('visita__visitante', 'visita__orgao').all()
    serializer_class = AcessoSerializer

    @extend_schema(
        request=RegistrarEntradaSerializer,
        responses={201: AcessoSerializer},
        summary="Registrar Entrada de Visitante"
    )
    @action(detail=False, methods=['post'], serializer_class=RegistrarEntradaSerializer)
    def registrar_entrada(self, request):
        """
        Registra a entrada de um visitante para uma visita agendada.
        
        Este endpoint:
        1. Valida se a visita está 'Agendada' e se o crachá está 'Livre'.
        2. Cria um registro de Acesso.
        3. Atualiza o estado da Visita para 'EM_CURSO' e a hora de entrada.
        4. Atualiza o estado do Crachá para 'OCUPADO'.
        """
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        visita = serializer.validated_data['visita']

        # Criar o Acesso
        acesso = Acesso.objects.create(
            visita=visita,
            data_entrada=timezone.now(),
            registrado_por_entrada=request.user
        )

        # Atualizar Visita
        visita.estado = Visita.EstadoVisita.EM_CURSO
        visita.data_hora_entrada = acesso.data_entrada
        visita.save()

        # Atualizar Crachá (o método save() do crachá lida com a mudança de estado)
        cracha = visita.cracha
        cracha.save()

        return Response(
            AcessoSerializer(acesso).data,
            status=status.HTTP_201_CREATED
        )

    @extend_schema(
        request=None,
        responses={200: AcessoSerializer},
        summary="Registrar Saída de Visitante"
    )
    @action(detail=True, methods=['post'], serializer_class=RegistrarSaidaSerializer)
    def registrar_saida(self, request, pk=None):
        """
        Registra a saída de um visitante.
        
        Este endpoint:
        1. Valida se a visita está 'Em Curso'.
        2. Atualiza o registro de Acesso com a data e hora de saída.
        3. Atualiza o estado da Visita para 'CONCLUIDA'.
        4. Libera o Crachá, desassociando a visita e mudando seu estado para 'LIVRE'.
        """
        acesso = self.get_object()
        serializer = self.get_serializer(instance=acesso, data=request.data)
        serializer.is_valid(raise_exception=True)

        # Atualizar Acesso
        acesso.data_saida = timezone.now()
        acesso.registrado_por_saida = request.user
        acesso.save()

        # Atualizar Visita
        visita = acesso.visita
        visita.estado = Visita.EstadoVisita.CONCLUIDA
        visita.data_hora_saida = acesso.data_saida
        visita.save()

        # Liberar Crachá
        if hasattr(visita, 'cracha') and visita.cracha:
            cracha = visita.cracha
            cracha.visita = None # Desassocia a visita
            cracha.save() # O método save() do crachá lida com a mudança de estado para LIVRE

        return Response(AcessoSerializer(acesso).data)