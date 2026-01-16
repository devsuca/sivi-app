from rest_framework import viewsets, status, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q
from django.utils import timezone
from drf_spectacular.utils import extend_schema, OpenApiParameter
from drf_spectacular.types import OpenApiTypes

from .models import DSINotification
from .serializers import (
    DSINotificationSerializer,
    DSINotificationCreateSerializer,
    DSINotificationUpdateSerializer,
    DSINotificationListSerializer
)
from apps.authentication.permissions import IsPortaria, CanCreateNotification
from apps.authentication.mixins import OrgaoAccessMixin
import logging

logger = logging.getLogger(__name__)


@extend_schema(tags=['Notificações DSI'])
class DSINotificationViewSet(OrgaoAccessMixin, viewsets.ModelViewSet):
    """
    ViewSet para gerenciar notificações do Departamento de Segurança Institucional (DSI)
    """
    queryset = DSINotification.objects.all()
    serializer_class = DSINotificationSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status', 'urgencia', 'orgao', 'data_visita']
    search_fields = ['nome_pessoa', 'observacoes', 'orgao__nome']
    ordering_fields = ['data_envio', 'urgencia', 'status']
    ordering = ['-data_envio']
    
    def get_serializer_class(self):
        """
        Retorna o serializer apropriado baseado na ação
        """
        if self.action == 'create':
            return DSINotificationCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return DSINotificationUpdateSerializer
        elif self.action == 'list':
            return DSINotificationListSerializer
        return DSINotificationSerializer
    
    def get_queryset(self):
        """
        Filtrar notificações baseado no perfil do usuário
        """
        user = self.request.user
        
        # Admin: pode ver todas as notificações
        if user.perfil.nivel_acesso == 'admin':
            return DSINotification.objects.all()
        
        # Portaria: pode ver todas as notificações (controle global)
        elif user.perfil.nivel_acesso == 'portaria':
            return DSINotification.objects.all()
        
        # Outros perfis: apenas notificações do seu órgão
        else:
            user_orgao = self.get_user_orgao(user)
            if user_orgao:
                return DSINotification.objects.filter(orgao=user_orgao)
            else:
                return DSINotification.objects.none()
    
    def get_permissions(self):
        """
        Definir permissões baseadas na ação
        """
        if self.action in ['list', 'retrieve']:
            # Todos os usuários autenticados podem visualizar
            permission_classes = [IsAuthenticated]
        elif self.action == 'create':
            # Portaria, Admin e Recepção podem criar notificações
            permission_classes = [CanCreateNotification]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Apenas portaria pode modificar
            permission_classes = [IsPortaria]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]
    
    def perform_create(self, serializer):
        """
        Criar notificação e enviar via WebSocket
        """
        notification = serializer.save()
        
        # Enviar notificação via WebSocket para usuários de portaria do DSI
        self.send_websocket_notification(notification)
        
        logger.info(f"Notificação DSI criada: {notification.id} - {notification.nome_pessoa}")
    
    def perform_update(self, serializer):
        """
        Atualizar notificação e notificar via WebSocket
        """
        notification = serializer.save()
        
        # Enviar atualização via WebSocket
        self.send_websocket_update(notification)
        
        logger.info(f"Notificação DSI atualizada: {notification.id} - Status: {notification.status}")
    
    def send_websocket_notification(self, notification):
        """
        Enviar notificação via WebSocket para usuários de portaria do DSI
        """
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if channel_layer:
                # Enviar para canal de notificações DSI
                async_to_sync(channel_layer.group_send)(
                    'dsi_notifications',
                    {
                        'type': 'new_notification',
                        'notification': DSINotificationSerializer(notification).data
                    }
                )
        except Exception as e:
            logger.error(f"Erro ao enviar notificação via WebSocket: {e}")
    
    def send_websocket_update(self, notification):
        """
        Enviar atualização via WebSocket
        """
        try:
            from channels.layers import get_channel_layer
            from asgiref.sync import async_to_sync
            
            channel_layer = get_channel_layer()
            if channel_layer:
                async_to_sync(channel_layer.group_send)(
                    'dsi_notifications',
                    {
                        'type': 'notification_updated',
                        'notification': DSINotificationSerializer(notification).data
                    }
                )
        except Exception as e:
            logger.error(f"Erro ao enviar atualização via WebSocket: {e}")
    
    @extend_schema(
        summary="Marcar notificação como visualizada",
        description="Marca uma notificação como visualizada"
    )
    @action(detail=True, methods=['post'])
    def mark_as_viewed(self, request, pk=None):
        """
        Marcar notificação como visualizada
        """
        notification = self.get_object()
        notification.status = 'visualizada'
        notification.save()
        
        self.send_websocket_update(notification)
        
        return Response({
            'message': 'Notificação marcada como visualizada',
            'status': notification.status
        })
    
    @extend_schema(
        summary="Marcar notificação como processada",
        description="Marca uma notificação como processada"
    )
    @action(detail=True, methods=['post'])
    def mark_as_processed(self, request, pk=None):
        """
        Marcar notificação como processada
        """
        notification = self.get_object()
        notification.status = 'processada'
        notification.processado_por = request.user
        notification.save()
        
        self.send_websocket_update(notification)
        
        return Response({
            'message': 'Notificação marcada como processada',
            'status': notification.status,
            'processado_por': request.user.nome
        })
    
    @extend_schema(
        summary="Obter estatísticas de notificações",
        description="Retorna estatísticas das notificações"
    )
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Obter estatísticas das notificações
        """
        queryset = self.get_queryset()
        
        stats = {
            'total': queryset.count(),
            'pendentes': queryset.filter(status='pendente').count(),
            'visualizadas': queryset.filter(status='visualizada').count(),
            'processadas': queryset.filter(status='processada').count(),
            'alta_urgencia': queryset.filter(urgencia='alta', status='pendente').count(),
            'media_urgencia': queryset.filter(urgencia='media', status='pendente').count(),
            'baixa_urgencia': queryset.filter(urgencia='baixa', status='pendente').count(),
        }
        
        return Response(stats)
    
    @extend_schema(
        summary="Notificações pendentes",
        description="Retorna apenas notificações pendentes"
    )
    @action(detail=False, methods=['get'])
    def pending(self, request):
        """
        Obter apenas notificações pendentes
        """
        queryset = self.get_queryset().filter(status='pendente')
        
        # Aplicar filtros adicionais se fornecidos
        urgencia = request.query_params.get('urgencia')
        if urgencia:
            queryset = queryset.filter(urgencia=urgencia)
        
        orgao_id = request.query_params.get('orgao_id')
        if orgao_id:
            queryset = queryset.filter(orgao_id=orgao_id)
        
        page = self.paginate_queryset(queryset)
        if page is not None:
            serializer = DSINotificationListSerializer(page, many=True)
            return self.get_paginated_response(serializer.data)
        
        serializer = DSINotificationListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @extend_schema(
        summary="Criar notificação de teste",
        description="Cria uma notificação de teste para demonstração"
    )
    @action(detail=False, methods=['post'])
    def create_test(self, request):
        """
        Criar notificação de teste
        """
        from apps.pessoas.models import Visitante
        from apps.core.models import Orgao
        
        # Buscar ou criar dados de teste
        visitante, _ = Visitante.objects.get_or_create(
            nome_completo='João Silva Santos (Teste)',
            defaults={
                'documento': '123456789',
                'tipo_documento': 'BI',
                'telefone': '923456789',
                'email': 'joao.teste@example.com'
            }
        )
        
        orgao, _ = Orgao.objects.get_or_create(
            nome='DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL',
            defaults={
                'sigla': 'DSI',
                'bloco': 'A',
                'numero_porta': '101'
            }
        )
        
        # Criar notificação de teste
        notification = DSINotification.objects.create(
            visitante=visitante,
            orgao=orgao,
            nome_pessoa=visitante.nome_completo,
            data_visita=timezone.now().date(),
            hora_visita=timezone.now().time(),
            observacoes='Notificação de teste criada automaticamente para demonstração do sistema DSI',
            urgencia='media',
            enviado_por=request.user
        )
        
        self.send_websocket_notification(notification)
        
        serializer = DSINotificationSerializer(notification)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
