from rest_framework import viewsets, status, permissions, filters
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser
from django_filters.rest_framework import DjangoFilterBackend
from django.db.models import Q, Count, Avg
from django.utils import timezone
from django.shortcuts import get_object_or_404
from .models import Ticket, TicketComment, TicketAttachment, TicketTemplate
from .serializers import (
    TicketListSerializer, TicketDetailSerializer, TicketCreateSerializer,
    TicketUpdateSerializer, TicketCommentSerializer, TicketCommentCreateSerializer,
    TicketAttachmentSerializer, TicketAttachmentCreateSerializer,
    TicketTemplateSerializer, TicketStatsSerializer, TicketSatisfactionSerializer
)
from .filters import TicketFilter
from .permissions import (
    TicketPermissions, TicketCommentPermissions, 
    TicketAttachmentPermissions, TicketTemplatePermissions,
    is_support_user, can_manage_tickets, can_view_all_tickets, can_assign_tickets
)

class TicketViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar tickets de suporte
    """
    queryset = Ticket.objects.all()
    permission_classes = [TicketPermissions]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = TicketFilter
    search_fields = ['titulo', 'descricao', 'numero']
    ordering_fields = ['data_criacao', 'data_atualizacao', 'prioridade', 'status']
    ordering = ['-data_criacao']
    
    def get_serializer_class(self):
        if self.action == 'list':
            return TicketListSerializer
        elif self.action == 'create':
            return TicketCreateSerializer
        elif self.action in ['update', 'partial_update']:
            return TicketUpdateSerializer
        else:
            return TicketDetailSerializer
    
    def get_queryset(self):
        """
        Filtra tickets baseado no usuário logado e suas permissões
        """
        user = self.request.user
        
        if can_view_all_tickets(user):
            # Usuários de suporte, staff e superusers podem ver todos os tickets
            return Ticket.objects.all()
        else:
            # Usuários normais só veem seus próprios tickets
            return Ticket.objects.filter(
                Q(solicitante=user) | Q(atribuido_para=user)
            )
    
    def perform_create(self, serializer):
        """
        Define o solicitante como o usuário logado
        """
        serializer.save(solicitante=self.request.user)
    
    @action(detail=True, methods=['post'])
    def adicionar_comentario(self, request, pk=None):
        """
        Adiciona um comentário ao ticket
        """
        ticket = self.get_object()
        serializer = TicketCommentCreateSerializer(
            data=request.data,
            context={'request': request, 'ticket': ticket}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'], parser_classes=[MultiPartParser, FormParser])
    def adicionar_anexo(self, request, pk=None):
        """
        Adiciona um anexo ao ticket
        """
        ticket = self.get_object()
        serializer = TicketAttachmentCreateSerializer(
            data=request.data,
            context={'request': request, 'ticket': ticket}
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def avaliar_satisfacao(self, request, pk=None):
        """
        Avalia a satisfação do usuário com o ticket
        """
        ticket = self.get_object()
        
        # Só o solicitante pode avaliar
        if ticket.solicitante != request.user:
            return Response(
                {'error': 'Apenas o solicitante pode avaliar o ticket'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        serializer = TicketSatisfactionSerializer(
            ticket, data=request.data, partial=True
        )
        
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
    @action(detail=True, methods=['post'])
    def atribuir(self, request, pk=None):
        """
        Atribui o ticket para um usuário (apenas usuários de suporte)
        """
        if not can_assign_tickets(request.user):
            return Response(
                {'error': 'Você não tem permissão para atribuir tickets'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket = self.get_object()
        user_id = request.data.get('user_id')
        
        if not user_id:
            return Response(
                {'error': 'user_id é obrigatório'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        try:
            user = User.objects.get(id=user_id)
            ticket.atribuido_para = user
            ticket.save()
            
            # Adiciona comentário automático
            TicketComment.objects.create(
                ticket=ticket,
                autor=request.user,
                comentario=f"Ticket atribuído para {user.get_full_name() or user.username}",
                interno=True
            )
            
            return Response({'message': 'Ticket atribuído com sucesso'})
        except User.DoesNotExist:
            return Response(
                {'error': 'Usuário não encontrado'},
                status=status.HTTP_404_NOT_FOUND
            )
    
    @action(detail=True, methods=['post'])
    def fechar(self, request, pk=None):
        """
        Fecha o ticket
        """
        ticket = self.get_object()
        
        if not ticket.pode_ser_fechado_por(request.user):
            return Response(
                {'error': 'Você não tem permissão para fechar este ticket'},
                status=status.HTTP_403_FORBIDDEN
            )
        
        ticket.status = Ticket.Status.FECHADO
        ticket.data_fechamento = timezone.now()
        ticket.save()
        
        # Adiciona comentário automático
        TicketComment.objects.create(
            ticket=ticket,
            autor=request.user,
            comentario="Ticket fechado",
            interno=False
        )
        
        return Response({'message': 'Ticket fechado com sucesso'})
    
    @action(detail=False, methods=['get'])
    def estatisticas(self, request):
        """
        Retorna estatísticas dos tickets
        """
        queryset = self.get_queryset()
        
        # Estatísticas básicas
        total_tickets = queryset.count()
        tickets_abertos = queryset.filter(status='aberto').count()
        tickets_em_andamento = queryset.filter(status='em_andamento').count()
        tickets_resolvidos = queryset.filter(status='resolvido').count()
        tickets_fechados = queryset.filter(status='fechado').count()
        
        # Tempo médio de resolução
        tickets_com_resolucao = queryset.filter(
            data_resolucao__isnull=False
        ).exclude(data_resolucao__isnull=True)
        
        tempo_medio_resolucao = 0
        if tickets_com_resolucao.exists():
            tempos = []
            for ticket in tickets_com_resolucao:
                tempo = ticket.calcular_tempo_resolucao()
                if tempo:
                    tempos.append(tempo)
            if tempos:
                tempo_medio_resolucao = sum(tempos) / len(tempos)
        
        # Satisfação média
        satisfacao_media = queryset.filter(
            satisfacao_usuario__isnull=False
        ).aggregate(avg=Avg('satisfacao_usuario'))['avg'] or 0
        
        # Tickets por categoria
        tickets_por_categoria = dict(
            queryset.values('categoria').annotate(
                count=Count('id')
            ).values_list('categoria', 'count')
        )
        
        # Tickets por prioridade
        tickets_por_prioridade = dict(
            queryset.values('prioridade').annotate(
                count=Count('id')
            ).values_list('prioridade', 'count')
        )
        
        # Tickets por status
        tickets_por_status = dict(
            queryset.values('status').annotate(
                count=Count('id')
            ).values_list('status', 'count')
        )
        
        stats = {
            'total_tickets': total_tickets,
            'tickets_abertos': tickets_abertos,
            'tickets_em_andamento': tickets_em_andamento,
            'tickets_resolvidos': tickets_resolvidos,
            'tickets_fechados': tickets_fechados,
            'tempo_medio_resolucao': round(tempo_medio_resolucao, 2),
            'satisfacao_media': round(satisfacao_media, 2),
            'tickets_por_categoria': tickets_por_categoria,
            'tickets_por_prioridade': tickets_por_prioridade,
            'tickets_por_status': tickets_por_status,
        }
        
        serializer = TicketStatsSerializer(stats)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def meus_tickets(self, request):
        """
        Retorna apenas os tickets do usuário logado
        """
        queryset = self.get_queryset().filter(solicitante=request.user)
        serializer = TicketListSerializer(queryset, many=True)
        return Response(serializer.data)
    
    @action(detail=False, methods=['get'])
    def tickets_atribuidos(self, request):
        """
        Retorna tickets atribuídos ao usuário logado
        """
        queryset = self.get_queryset().filter(atribuido_para=request.user)
        serializer = TicketListSerializer(queryset, many=True)
        return Response(serializer.data)

class TicketTemplateViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar templates de tickets
    """
    queryset = TicketTemplate.objects.filter(ativo=True)
    serializer_class = TicketTemplateSerializer
    permission_classes = [TicketTemplatePermissions]
    
    def get_permissions(self):
        """
        Apenas staff e usuários de suporte podem criar/editar templates
        """
        if self.action in ['create', 'update', 'partial_update', 'destroy']:
            return [TicketTemplatePermissions()]
        return [TicketTemplatePermissions()]
    
    @action(detail=True, methods=['post'])
    def criar_ticket_do_template(self, request, pk=None):
        """
        Cria um novo ticket baseado no template
        """
        template = self.get_object()
        
        ticket_data = {
            'titulo': template.titulo_template,
            'descricao': template.descricao_template,
            'categoria': template.categoria,
            'prioridade': template.prioridade,
            'tags': template.tags
        }
        
        serializer = TicketCreateSerializer(
            data=ticket_data,
            context={'request': request}
        )
        
        if serializer.is_valid():
            ticket = serializer.save()
            return Response(
                TicketDetailSerializer(ticket, context={'request': request}).data,
                status=status.HTTP_201_CREATED
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)