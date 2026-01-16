from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Visitante
from .serializers import VisitanteSerializer, DocumentValidationSerializer
from .filters import VisitanteFilter
from drf_spectacular.utils import extend_schema

@extend_schema(tags=['Pessoas'])
class VisitanteViewSet(viewsets.ModelViewSet):
    queryset = Visitante.objects.all()
    serializer_class = VisitanteSerializer

    filterset_class = VisitanteFilter

    @action(detail=False, methods=['get'], url_path='validate-document/(?P<documento_numero>[^/.]+)')
    @extend_schema(
        summary="Validar documento",
        description="Busca um visitante pelo número do documento",
        responses={
            200: DocumentValidationSerializer,
            404: {"description": "Documento não encontrado"}
        }
    )
    def validate_document(self, request, documento_numero=None):
        """
        Endpoint para validar documento de visitante
        """
        try:
            # Buscar visitante pelo número do documento
            visitante = get_object_or_404(
                Visitante.objects.filter(ativo=True), 
                documento_numero=documento_numero
            )
            
            # Serializar dados do visitante com serializer específico
            serializer = DocumentValidationSerializer(visitante)
            
            return Response({
                'success': True,
                'data': serializer.data,
                'message': 'Documento encontrado'
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            return Response({
                'success': False,
                'data': None,
                'message': f'Documento não encontrado: {str(e)}'
            }, status=status.HTTP_404_NOT_FOUND)



# Adiciona EfetivoViewSet corretamente
from .models import Efetivo
from .serializers import EfetivoSerializer
from .filters import EfetivoFilter

class EfetivoViewSet(viewsets.ModelViewSet):
    queryset = Efetivo.objects.all()
    serializer_class = EfetivoSerializer
    filterset_class = EfetivoFilter