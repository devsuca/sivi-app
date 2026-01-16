from rest_framework.decorators import api_view, permission_classes, action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework import status, viewsets, filters
from rest_framework.pagination import PageNumberPagination
from django.db import connection
from django.core.cache import cache
from django_filters.rest_framework import DjangoFilterBackend
from django_filters import rest_framework as django_filters
import logging
from .models import Orgao, LogSistema
from .serializers import OrgaoSerializer, LogSistemaSerializer, LogSistemaListSerializer

# Import Redis apenas se disponível
try:
    import redis
    REDIS_AVAILABLE = True
except ImportError:
    REDIS_AVAILABLE = False

logger = logging.getLogger(__name__)

class CustomPageNumberPagination(PageNumberPagination):
    """Paginação customizada para logs de auditoria"""
    page_size = 20
    page_size_query_param = 'page_size'
    max_page_size = 100

@api_view(['GET'])
@permission_classes([AllowAny])
def health_check(request):
    """
    Health check endpoint para verificar o status do sistema
    """
    health_status = {
        'status': 'healthy',
        'timestamp': None,
        'services': {}
    }
    
    try:
        from django.utils import timezone
        health_status['timestamp'] = timezone.now().isoformat()
    except Exception as e:
        logger.error(f"Error getting timestamp: {e}")
    
    # Verificar banco de dados
    try:
        with connection.cursor() as cursor:
            cursor.execute("SELECT 1")
        health_status['services']['database'] = 'healthy'
    except Exception as e:
        logger.error(f"Database health check failed: {e}")
        health_status['services']['database'] = 'unhealthy'
        health_status['status'] = 'unhealthy'
    
    # Verificar cache (Redis) - opcional
    try:
        cache.set('health_check', 'ok', 10)
        cache_result = cache.get('health_check')
        if cache_result == 'ok':
            health_status['services']['cache'] = 'healthy'
        else:
            health_status['services']['cache'] = 'unhealthy'
    except Exception as e:
        logger.error(f"Cache health check failed: {e}")
        health_status['services']['cache'] = 'unavailable'
        # Cache não é crítico, não alterar status geral
    
    # Verificar Redis diretamente (se disponível) - opcional
    if REDIS_AVAILABLE:
        try:
            r = redis.Redis(host='localhost', port=6379, db=0)
            r.ping()
            health_status['services']['redis'] = 'healthy'
        except Exception as e:
            logger.error(f"Redis health check failed: {e}")
            health_status['services']['redis'] = 'unavailable'
            # Redis não é crítico, não alterar status geral
    else:
        health_status['services']['redis'] = 'not_installed'
    
    # Determinar status HTTP
    http_status = status.HTTP_200_OK if health_status['status'] == 'healthy' else status.HTTP_503_SERVICE_UNAVAILABLE
    
    return Response(health_status, status=http_status)


class OrgaoViewSet(viewsets.ModelViewSet):
    """
    ViewSet para gerenciar órgãos
    """
    queryset = Orgao.objects.all()
    serializer_class = OrgaoSerializer
    permission_classes = [IsAuthenticated]
    
    def get_queryset(self):
        """
        Filtrar órgãos ativos por padrão
        """
        queryset = Orgao.objects.filter(ativo=True)
        return queryset


class LogSistemaFilter(django_filters.FilterSet):
    """Filtros para logs de auditoria"""
    usuario = django_filters.CharFilter(field_name='user__username', lookup_expr='icontains')
    acao = django_filters.CharFilter(field_name='acao', lookup_expr='icontains')
    entidade = django_filters.CharFilter(field_name='entidade', lookup_expr='icontains')
    data_inicio = django_filters.DateFilter(field_name='data_hora', lookup_expr='gte')
    data_fim = django_filters.DateFilter(field_name='data_hora', lookup_expr='lte')
    
    class Meta:
        model = LogSistema
        fields = ['usuario', 'acao', 'entidade', 'data_inicio', 'data_fim']


class LogSistemaViewSet(viewsets.ReadOnlyModelViewSet):
    """
    ViewSet para visualizar logs de auditoria
    Apenas usuários com role admin ou suporte podem acessar
    """
    queryset = LogSistema.objects.all()
    serializer_class = LogSistemaListSerializer
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = LogSistemaFilter
    search_fields = ['entidade', 'acao', 'user__username', 'user__email']
    ordering_fields = ['data_hora', 'entidade', 'acao']
    ordering = ['-data_hora']
    pagination_class = CustomPageNumberPagination
    
    def get_queryset(self):
        """
        Filtrar logs baseado no usuário logado
        """
        user = self.request.user
        
        # Verificar permissão baseada no perfil
        user_role = getattr(user.perfil, 'nivel_acesso', None) if hasattr(user, 'perfil') and user.perfil else None
        
        if user_role in ['admin', 'suporte', 'portaria']:
            return LogSistema.objects.all().select_related('user', 'user__perfil')
            
        # Retornar lista vazia se não tiver permissão
        return LogSistema.objects.none()
    
    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Exportar logs de auditoria em CSV
        """
        import csv
        from django.http import HttpResponse
        from django.utils import timezone
        
        # Verificar permissão
        user = request.user
        user_role = getattr(user.perfil, 'nivel_acesso', None) if hasattr(user, 'perfil') and user.perfil else None
        if user_role not in ['admin', 'suporte']:
            return Response(
                {'error': 'Acesso negado'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        # Aplicar filtros
        queryset = self.filter_queryset(self.get_queryset())
        
        # Criar resposta CSV
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename="audit-logs-{timezone.now().strftime("%Y-%m-%d")}.csv"'
        
        writer = csv.writer(response)
        writer.writerow([
            'ID', 'Entidade', 'Ação', 'Usuário', 'Email', 'Data/Hora', 
            'Detalhes'
        ])
        
        # Usar o serializer para pegar o campo 'detalhes' que implementamos
        serializer = LogSistemaListSerializer(queryset, many=True)
        
        for log_data in serializer.data:
            writer.writerow([
                log_data['id'],
                log_data['entidade'],
                log_data['acao'],
                log_data.get('usuario_info', {}).get('nome_completo', 'N/A'),
                log_data.get('usuario_info', {}).get('email', 'N/A'),
                log_data['data_hora'],
                log_data.get('detalhes', '')
            ])
        
        return response

    @action(detail=False, methods=['get'])
    def export_pdf(self, request):
        """
        Exportar logs de auditoria em PDF usando ReportLab
        """
        import datetime
        from django.http import HttpResponse
        from django.utils import timezone
        from reportlab.lib.pagesizes import A4, landscape
        from reportlab.lib import colors
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from io import BytesIO

        try:
            logger.info("📄 Iniciando exportação de PDF de logs")
            # Verificar permissão
            user = request.user
            user_role = getattr(user.perfil, 'nivel_acesso', None) if hasattr(user, 'perfil') and user.perfil else None
            if user_role not in ['admin', 'suporte', 'portaria']:
                return Response({'error': 'Acesso negado'}, status=status.HTTP_403_FORBIDDEN)

            # Aplicar filtros
            queryset = self.filter_queryset(self.get_queryset())
            logger.info(f"📊 Exportando {queryset.count()} logs para PDF")
            
            serializer = LogSistemaListSerializer(queryset, many=True)
            
            buffer = BytesIO()
            doc = SimpleDocTemplate(buffer, pagesize=landscape(A4), topMargin=30, bottomMargin=30)
            elements = []
            
            styles = getSampleStyleSheet()
            title_style = styles['Title']
            header_style = ParagraphStyle(
                'Header',
                parent=styles['Normal'],
                fontSize=10,
                textColor=colors.grey
            )

            # Cabeçalho
            elements.append(Paragraph("SIVIS - Sistema de Gestão de Visitas", title_style))
            elements.append(Paragraph("Relatório de Auditoria", styles['Heading2']))
            elements.append(Paragraph(f"Data de Emissão: {timezone.now().strftime('%d/%m/%Y %H:%M:%S')}", header_style))
            elements.append(Paragraph(f"Emitido por: {user.username}", header_style))
            elements.append(Spacer(1, 20))

            # Tabela de Dados
            data = [['Data/Hora', 'Usuário', 'Ação', 'Entidade', 'Detalhes']]
            
            for log in serializer.data:
                # Formatar data para exibição no PDF
                dt = log.get('data_hora', '')
                dt_str = dt
                if dt:
                    try:
                        # Usar datetime padrão para parsear ISO
                        dt_obj = datetime.datetime.fromisoformat(dt.replace('Z', '+00:00'))
                        dt_str = dt_obj.strftime('%d/%m/%Y %H:%M')
                    except Exception as e:
                        logger.warning(f"Erro ao formatar data {dt}: {e}")
                        dt_str = str(dt)[:16]

                usuario_info = log.get('usuario_info') or {}
                nome_usuario = usuario_info.get('nome_completo') or log.get('username') or 'Sistema'
                detalhes_text = log.get('detalhes') or ""
                
                # Garantir que detalhes é uma string e não excede limite razoável por linha
                if not isinstance(detalhes_text, str):
                    detalhes_text = str(detalhes_text)
                
                data.append([
                    dt_str,
                    nome_usuario,
                    log.get('acao', ''),
                    log.get('entidade', ''),
                    Paragraph(detalhes_text[:200], styles['Normal'])
                ])

            # Estilo da Tabela
            # Larguras: [110, 120, 80, 80, 330] = 720 total
            t = Table(data, colWidths=[100, 110, 80, 80, 380], repeatRows=1)
            t.setStyle(TableStyle([
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1e40af')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.whitesmoke),
                ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 10),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('BACKGROUND', (0, 1), (-1, -1), colors.whitesmoke),
                ('GRID', (0, 0), (-1, -1), 0.5, colors.grey),
                ('VALIGN', (0, 0), (-1, -1), 'TOP'),
                ('FONTSIZE', (0, 1), (-1, -1), 8),
            ]))
            
            elements.append(t)
            doc.build(elements)
            
            pdf = buffer.getvalue()
            buffer.close()
            
            filename = f"audit-logs-{timezone.now().strftime('%Y-%m-%d')}.pdf"
            response = HttpResponse(content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            response.write(pdf)
            
            logger.info(f"✅ PDF gerado com sucesso: {filename}")
            return response

        except Exception as e:
            logger.error(f"❌ Erro fatal ao gerar PDF de logs: {str(e)}", exc_info=True)
            return Response(
                {'detail': f'Erro interno ao gerar PDF: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
    
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Estatísticas dos logs de auditoria
        """
        from django.db.models import Count
        from django.utils import timezone
        from datetime import timedelta
        
        # Verificar permissão
        user = request.user
        user_role = getattr(user.perfil, 'nivel_acesso', None) if hasattr(user, 'perfil') and user.perfil else None
        if user_role not in ['admin', 'suporte']:
            return Response(
                {'error': 'Acesso negado'}, 
                status=status.HTTP_403_FORBIDDEN
            )
        
        queryset = self.get_queryset()
        
        # Estatísticas gerais
        total_logs = queryset.count()
        
        # Logs por dia (últimos 30 dias)
        thirty_days_ago = timezone.now() - timedelta(days=30)
        logs_por_dia = queryset.filter(
            data_hora__gte=thirty_days_ago
        ).extra(
            select={'day': 'date(data_hora)'}
        ).values('day').annotate(
            quantidade=Count('id')
        ).order_by('day')
        
        # Logs por ação
        logs_por_acao = queryset.values('acao').annotate(
            quantidade=Count('id')
        ).order_by('-quantidade')
        
        # Logs por usuário
        logs_por_usuario = queryset.filter(
            user__isnull=False
        ).values('user__username').annotate(
            quantidade=Count('id')
        ).order_by('-quantidade')[:10]
        
        return Response({
            'total_logs': total_logs,
            'logs_por_dia': list(logs_por_dia),
            'logs_por_acao': list(logs_por_acao),
            'logs_por_usuario': list(logs_por_usuario)
        })
    