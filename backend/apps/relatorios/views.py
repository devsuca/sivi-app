from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status
from django.db.models import Count, Q
from django.utils import timezone
from datetime import datetime, timedelta
from apps.visitas.models import Visita
from apps.pessoas.models import Visitante, Efetivo
from apps.pertences.models import Pertence
from apps.core.models import Orgao
from apps.usuarios.models import Usuario
from apps.authentication.models import Perfil
import logging

logger = logging.getLogger(__name__)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def estatisticas(request):
    """
    Retorna estatísticas gerais do sistema
    """
    try:
        # Filtros da query string
        data_inicio = request.GET.get('data_inicio')
        data_fim = request.GET.get('data_fim')
        orgao_id = request.GET.get('orgao_id')
        
        # Construir filtros para visitas
        filtros_visitas = Q()
        if data_inicio:
            filtros_visitas &= Q(data_registo__date__gte=data_inicio)
        if data_fim:
            filtros_visitas &= Q(data_registo__date__lte=data_fim)
        if orgao_id:
            filtros_visitas &= Q(orgao_id=orgao_id)
        
        # Estatísticas gerais
        total_visitas = Visita.objects.filter(filtros_visitas).count()
        total_visitantes = Visitante.objects.filter(ativo=True).count()
        total_efetivos = Efetivo.objects.filter(ativo=True).count()
        total_pertences = Pertence.objects.count()
        total_orgaos = Orgao.objects.filter(ativo=True).count()
        
        # Visitas por estado
        visitas_por_estado = (
            Visita.objects
            .filter(filtros_visitas)
            .values('estado')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        
        # Visitas por órgão
        visitas_por_orgao = (
            Visita.objects
            .filter(filtros_visitas)
            .values('orgao__nome', 'orgao__id')
            .annotate(total=Count('id'))
            .order_by('-total')[:10]
        )
        
        # Visitas por mês (últimos 12 meses)
        agora = timezone.now()
        visitas_por_mes = []
        for i in range(12):
            data = agora - timedelta(days=30*i)
            mes_inicio = data.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if i == 0:
                mes_fim = agora
            else:
                proximo_mes = mes_inicio + timedelta(days=32)
                mes_fim = proximo_mes.replace(day=1) - timedelta(days=1)
            
            total_mes = Visita.objects.filter(
                filtros_visitas & Q(data_registo__date__gte=mes_inicio.date(), data_registo__date__lte=mes_fim.date())
            ).count()
            
            visitas_por_mes.append({
                'mes': data.strftime('%Y-%m'),
                'nome_mes': data.strftime('%B %Y'),
                'total': total_mes
            })
        
        visitas_por_mes.reverse()
        
        # Visitas por dia da semana
        dias_semana = ['Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado', 'Domingo']
        visitas_por_dia_semana = []
        for i, dia in enumerate(dias_semana):
            total_dia = Visita.objects.filter(
                filtros_visitas & Q(data_registo__week_day=i+2)  # Django usa 2=Segunda
            ).count()
            visitas_por_dia_semana.append({
                'dia': dia,
                'total': total_dia
            })
        
        # Top visitantes mais frequentes
        top_visitantes = (
            Visita.objects
            .filter(filtros_visitas)
            .values('visitante__nome', 'visitante__id')
            .annotate(total_visitas=Count('id'))
            .order_by('-total_visitas')[:10]
        )
        
        # Top efetivos mais visitados
        top_efetivos = (
            Visita.objects
            .filter(filtros_visitas)
            .values('efetivo_visitar__nome_completo', 'efetivo_visitar__id')
            .annotate(total_visitas=Count('id'))
            .order_by('-total_visitas')[:10]
        )
        
        # Pertences por estado
        pertences_por_estado = (
            Pertence.objects
            .values('estado')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        
        # Visitas por hora do dia
        visitas_por_hora = []
        for hora in range(24):
            total_hora = Visita.objects.filter(
                filtros_visitas & Q(data_registo__hour=hora)
            ).count()
            visitas_por_hora.append({
                'hora': f'{hora:02d}:00',
                'total': total_hora
            })
        
        # Usuários por perfil
        usuarios_por_perfil = (
            Usuario.objects
            .values('perfil__nome', 'perfil__id')
            .annotate(total=Count('id'))
            .order_by('-total')
        )
        
        response_data = {
            'estatisticas_gerais': {
                'total_visitas': total_visitas,
                'total_visitantes': total_visitantes,
                'total_efetivos': total_efetivos,
                'total_pertences': total_pertences,
                'total_orgaos': total_orgaos,
            },
            'visitas_por_estado': list(visitas_por_estado),
            'visitas_por_orgao': list(visitas_por_orgao),
            'visitas_por_mes': visitas_por_mes,
            'visitas_por_dia_semana': visitas_por_dia_semana,
            'top_visitantes': list(top_visitantes),
            'top_efetivos': list(top_efetivos),
            'pertences_por_estado': list(pertences_por_estado),
            'usuarios_por_perfil': list(usuarios_por_perfil),
            'visitas_por_hora': visitas_por_hora,
        }
        
        return Response(response_data, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'Erro ao gerar estatísticas: {str(e)}')
        return Response(
            {'error': 'Erro interno do servidor'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def detalhados(request):
    """
    Retorna relatório detalhado de visitas
    """
    try:
        # Filtros da query string
        data_inicio = request.GET.get('data_inicio')
        data_fim = request.GET.get('data_fim')
        orgao_id = request.GET.get('orgao_id')
        tipo = request.GET.get('tipo', 'visitas')
        
        # Construir filtros
        filtros = Q()
        if data_inicio:
            filtros &= Q(data_registo__date__gte=data_inicio)
        if data_fim:
            filtros &= Q(data_registo__date__lte=data_fim)
        if orgao_id:
            filtros &= Q(orgao_id=orgao_id)
        
        if tipo == 'visitas':
            # Relatório detalhado de visitas
            visitas = Visita.objects.filter(filtros).select_related(
                'visitante', 'efetivo_visitar', 'orgao'
            ).order_by('-data_registo')[:1000]  # Limitar a 1000 registros
            
            dados = []
            for visita in visitas:
                dados.append({
                    'id': visita.id,
                    'numero': visita.numero,
                    'visitante_nome': visita.visitante.nome if visita.visitante else '',
                    'efetivo_nome': visita.efetivo_visitar.nome_completo if visita.efetivo_visitar else '',
                    'orgao_nome': visita.orgao.nome if visita.orgao else '',
                    'estado': visita.estado,
                    'motivo': visita.motivo,
                    'data_entrada': visita.data_hora_entrada.isoformat() if visita.data_hora_entrada else None,
                    'data_saida': visita.data_hora_saida.isoformat() if visita.data_hora_saida else None,
                    'data_registo': visita.data_registo.isoformat(),
                    'observacoes': visita.observacoes,
                })
        
        elif tipo == 'visitantes':
            # Relatório de visitantes
            visitantes = Visitante.objects.filter(ativo=True).order_by('-data_registo')[:1000]
            
            dados = []
            for visitante in visitantes:
                total_visitas = Visita.objects.filter(visitante=visitante).count()
                dados.append({
                    'id': visitante.id,
                    'nome': visitante.nome,
                    'designacao_social': visitante.designacao_social,
                    'telefone': visitante.telefone,
                    'email': visitante.email,
                    'total_visitas': total_visitas,
                    'data_registo': visitante.data_registo.isoformat(),
                })
        
        elif tipo == 'efetivos':
            # Relatório de efetivos
            efetivos = Efetivo.objects.filter(ativo=True).select_related('orgao').order_by('-data_registo')[:1000]
            
            dados = []
            for efetivo in efetivos:
                total_visitas = Visita.objects.filter(efetivo_visitar=efetivo).count()
                dados.append({
                    'id': efetivo.id,
                    'nome_completo': efetivo.nome_completo,
                    'orgao_nome': efetivo.orgao.nome if efetivo.orgao else '',
                    'telefone': efetivo.telefone,
                    'email': efetivo.email,
                    'total_visitas': total_visitas,
                    'data_registo': efetivo.data_registo.isoformat(),
                })
        
        else:
            return Response(
                {'error': 'Tipo de relatório inválido'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        return Response({
            'dados': dados,
            'total': len(dados),
            'filtros_aplicados': {
                'data_inicio': data_inicio,
                'data_fim': data_fim,
                'orgao_id': orgao_id,
                'tipo': tipo,
            }
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        logger.error(f'Erro ao gerar relatório detalhado: {str(e)}')
        return Response(
            {'error': 'Erro interno do servidor'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )