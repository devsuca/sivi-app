from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Pertence, MovimentoPertence
from .serializers import PertenceSerializer
from apps.authentication.permissions import CanManagePertences
from drf_spectacular.utils import extend_schema

@extend_schema(tags=['Pertences'])
class PertenceViewSet(viewsets.ModelViewSet):
    queryset = Pertence.objects.all()
    serializer_class = PertenceSerializer
    permission_classes = [CanManagePertences]

    def perform_create(self, serializer):
        # Assuming the user is an Efetivo instance
        entregue_por = self.request.user.efetivo
        pertence = serializer.save(entregue_por=entregue_por)
        MovimentoPertence.objects.create(
            pertence=pertence,
            agente=entregue_por,
            acao=MovimentoPertence.AcaoMovimento.ENTREGA
        )

    @action(detail=True, methods=['post'])
    def levantar(self, request, pk=None):
        pertence = self.get_object()
        if pertence.estado == Pertence.EstadoPertence.LEVANTADO:
            return Response({'detail': 'Este pertence já foi levantado.'}, status=status.HTTP_400_BAD_REQUEST)

        # Assuming the user is an Efetivo instance
        levantado_por = request.user.efetivo
        pertence.estado = Pertence.EstadoPertence.LEVANTADO
        pertence.levantado_por = levantado_por
        pertence.data_levantamento = timezone.now()
        pertence.save()

        MovimentoPertence.objects.create(
            pertence=pertence,
            agente=levantado_por,
            acao=MovimentoPertence.AcaoMovimento.LEVANTAMENTO
        )

        serializer = self.get_serializer(pertence)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def em_posse(self, request):
        pertences_em_posse = self.get_queryset().filter(estado=Pertence.EstadoPertence.EM_POSSE)
        serializer = self.get_serializer(pertences_em_posse, many=True)
        return Response(serializer.data)
