from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.utils import timezone
from .models import Visita, Acompanhante
from .serializers import VisitaSerializer, AtribuirCrachaSerializer, AcompanhanteSerializer
from django_filters.rest_framework import DjangoFilterBackend
from apps.authentication.models import Perfil
from apps.authentication.permissions import CanAccessAllVisitas, CanAccessOrgaoVisitas, CanCreateVisita, CanModifyVisita, CanViewVisitas, CanViewOrgaoVisitas, CanFinalizeVisita, CanAssociateCracha
from apps.authentication.mixins import OrgaoAccessMixin
from rest_framework.permissions import IsAuthenticated
from drf_spectacular.utils import extend_schema
from apps.crachas.models import Cracha
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

@extend_schema(tags=['Visitas'])
class VisitaViewSet(OrgaoAccessMixin, viewsets.ModelViewSet):
    queryset = Visita.objects.all()
    serializer_class = VisitaSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_fields = ['estado', 'orgao', 'visitante']
    
    def get_permissions(self):
        """
        Instancia e retorna a lista de permissões que esta view requer.
        Recepção: pode visualizar visitas do seu órgão, criar visitas, mas NÃO pode finalizar ou associar crachás
        """
        if self.action == 'list' or self.action == 'retrieve':
            # Admin, Portaria e Secretaria podem visualizar todas as visitas
            # Recepção pode visualizar apenas visitas do seu órgão
            permission_classes = [CanViewVisitas | CanViewOrgaoVisitas]
        elif self.action == 'create':
            # Todos podem criar visitas (incluindo Recepção)
            permission_classes = [CanCreateVisita]
        elif self.action in ['update', 'partial_update', 'destroy']:
            # Apenas Admin, Portaria e Secretaria podem modificar
            permission_classes = [CanModifyVisita]
        elif self.action in ['em_curso']:
            # Admin, Portaria e Secretaria podem ver visitas em curso
            # Recepção pode ver visitas em curso do seu órgão
            permission_classes = [CanViewVisitas | CanViewOrgaoVisitas]
        elif self.action == 'finalizar':
            # Apenas Admin, Portaria e Secretaria podem finalizar visitas
            permission_classes = [CanFinalizeVisita]
        elif self.action in ['atribuir_crachas', 'get_crachas']:
            # Apenas Admin, Portaria e Secretaria podem associar/visualizar crachás
            permission_classes = [CanAssociateCracha]
        else:
            permission_classes = [IsAuthenticated]
        
        return [permission() for permission in permission_classes]

    def get_queryset(self):
        """
        Filtra o queryset baseado no perfil do usuário
        """
        queryset = super().get_queryset()
        
        # Aplicar filtros de data
        data = self.request.query_params.get('data')
        if data:
            queryset = queryset.filter(data_registo__date=data)

        # Validação do filtro visitante
        visitante_id = self.request.query_params.get('visitante')
        if visitante_id and visitante_id not in ['', 'null', 'undefined']:
            import uuid
            try:
                # Se for uma lista, pegar o primeiro
                if isinstance(visitante_id, list):
                    visitante_id = visitante_id[0]
                uuid.UUID(str(visitante_id))
            except (ValueError, TypeError, Exception):
                from rest_framework.exceptions import ValidationError
                raise ValidationError({'visitante': [f'O valor fornecido "{visitante_id}" não é um UUID válido.']})

        # Aplicar controle de acesso baseado em órgão
        try:
            queryset = self.filter_queryset_by_orgao(queryset, self.request.user)
            logger.info(f"Usuário {self.request.user.username} acessando visitas com perfil {self.request.user.perfil.nivel_acesso}")
        except Exception as e:
            logger.error(f"Erro no controle de acesso: {str(e)}")
            raise
        
        return queryset

    def perform_create(self, serializer):
        """
        Define o órgão e usuário responsável pela criação da visita
        """
        user = self.request.user
        
        try:
            # Obter órgão para criação
            orgao = self.get_orgao_for_creation(user)
            
            if orgao:
                # Usuário recepção: usar seu órgão
                serializer.save(orgao=orgao, registado_por=user)
            else:
                # Admin/Portaria: órgão será definido pelo serializer
                serializer.save(registado_por=user)
                
            logger.info(f"Visita criada por {user.username} com perfil {user.perfil.nivel_acesso}")
            
        except Exception as e:
            logger.error(f"Erro ao criar visita: {str(e)}")
            raise

    def perform_update(self, serializer):
        """
        Valida acesso ao órgão antes de permitir atualização
        """
        user = self.request.user
        visita = self.get_object()
        
        try:
            # Validar acesso ao órgão da visita
            self.validate_orgao_access(user, visita.orgao)
            serializer.save()
            logger.info(f"Visita {visita.id} atualizada por {user.username}")
            
        except Exception as e:
            logger.error(f"Erro ao atualizar visita: {str(e)}")
            raise

    def perform_destroy(self, instance):
        """
        Valida acesso ao órgão antes de permitir exclusão
        """
        user = self.request.user
        
        try:
            # Validar acesso ao órgão da visita
            self.validate_orgao_access(user, instance.orgao)
            instance.delete()
            logger.info(f"Visita {instance.id} excluída por {user.username}")
            
        except Exception as e:
            logger.error(f"Erro ao excluir visita: {str(e)}")
            raise

    @action(detail=False, methods=['get'])
    def em_curso(self, request):
        """
        Lista visitas em curso filtradas por permissão do usuário
        """
        try:
            logger.info(f"🔍 Buscando visitas em curso para usuário {request.user.username}")
            
            # Usar o queryset já filtrado por permissão/órgão
            queryset = self.get_queryset()
            
            # Se for uma pesquisa, aplicar adicionalmente
            queryset = self.filter_queryset(queryset)
            
            visitas_em_curso = queryset.filter(estado=Visita.EstadoVisita.EM_CURSO)
            
            logger.info(f"📊 Encontradas {visitas_em_curso.count()} visitas em curso")
            
            serializer = self.get_serializer(visitas_em_curso, many=True)
            return Response(serializer.data)
        except Exception as e:
            logger.error(f"❌ Erro na action em_curso: {str(e)}", exc_info=True)
            return Response(
                {"detail": f"Erro ao buscar visitas em curso: {str(e)}"}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def finalizar(self, request, pk=None):
        """
        Finaliza uma visita, validando acesso ao órgão
        """
        try:
            visita = self.get_object()
            logger.info(f"Tentativa de finalizar visita {visita.id} por usuário {request.user.username}")
            logger.info(f"Dados recebidos: {request.data}")
            
            # Verificar se o usuário tem perfil
            if not hasattr(request.user, 'perfil') or not request.user.perfil:
                logger.error(f"Usuário {request.user.username} sem perfil")
                return Response({'detail': 'Usuário sem perfil válido.'}, status=status.HTTP_400_BAD_REQUEST)
            
            # Verificar permissões básicas
            nivel_acesso = request.user.perfil.nivel_acesso
            logger.info(f"Usuário {request.user.username} tem perfil {nivel_acesso}")
            
            # Recepção NÃO pode finalizar visitas
            if nivel_acesso not in ['admin', 'portaria', 'secretaria']:
                logger.error(f"Perfil {nivel_acesso} não autorizado para finalizar visitas")
                return Response({'detail': 'Perfil não autorizado para finalizar visitas.'}, status=status.HTTP_403_FORBIDDEN)
            
            # Validar acesso ao órgão da visita
            self.validate_orgao_access(request.user, visita.orgao)
            
            logger.info(f"Acesso validado para usuário {request.user.username} na visita {visita.id}")
            
            if visita.estado != Visita.EstadoVisita.EM_CURSO:
                logger.warning(f"Tentativa de finalizar visita {visita.id} que não está em curso. Estado atual: {visita.estado}")
                return Response({'detail': 'Esta visita não está em curso.'}, status=status.HTTP_400_BAD_REQUEST)
                
        except Exception as e:
            logger.error(f"Erro ao validar acesso para finalizar visita {pk}: {str(e)}", exc_info=True)
            return Response({'detail': f'Erro de validação: {str(e)}'}, status=status.HTTP_400_BAD_REQUEST)

        # Exigir devolução de crachá(s) associado(s)
        from apps.crachas.models import Cracha
        crachas_associados = Cracha.objects.filter(visita=visita)

        if crachas_associados.exists():
            devolver = bool(request.data.get('devolver_cracha'))
            if not devolver:
                logger.warning(f"Tentativa de finalizar visita {visita.id} com crachás não devolvidos: {[c.numero for c in crachas_associados]}")
                return Response(
                    {
                        'detail': f'Existem {crachas_associados.count()} crachá(s) associado(s) à visita. É OBRIGATÓRIO devolvê-los para finalizar.',
                        'crachas': [{'numero': c.numero, 'id': c.id} for c in crachas_associados],
                        'requer': {'devolver_cracha': True},
                        'count': crachas_associados.count(),
                    },
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Desassociar e libertar crachás
            logger.info(f"Devolvendo {crachas_associados.count()} crachá(s) da visita {visita.id}")
            for c in crachas_associados:
                logger.info(f"Devolvendo crachá {c.numero} (ID: {c.id})")
                c.visita = None
                c.save()

        visita.data_hora_saida = timezone.now()
        visita.estado = Visita.EstadoVisita.CONCLUIDA
        visita.save()
        
        logger.info(f"Visita {visita.id} finalizada por {request.user.username}")
        serializer = self.get_serializer(visita)
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def confirmar_recepcao(self, request, pk=None):
        """
        Confirma que a visita passou pela recepção (só pode marcar uma vez, só usuários de recepção do órgão)
        """
        visita = self.get_object()
        user = request.user
        # Verificar se tem perfil e papel de recepção, e pertence ao órgão da visita
        if not hasattr(user, 'perfil') or not user.perfil:
            return Response({'detail': 'Usuário sem perfil válido.'}, status=status.HTTP_403_FORBIDDEN)
        if getattr(user.perfil, 'nivel_acesso', None) != 'recepcao':
            return Response({'detail': 'Apenas usuário de recepção pode marcar confirmação.'}, status=status.HTTP_403_FORBIDDEN)
        if not getattr(user, 'orgao', None) or user.orgao.id != visita.orgao.id:
            return Response({'detail': 'Só recepção do órgão de destino pode confirmar passagem.'}, status=status.HTTP_403_FORBIDDEN)
        if visita.confirmada_recepcao:
            return Response({'detail': 'Já confirmada anteriormente.'}, status=status.HTTP_400_BAD_REQUEST)
        visita.confirmada_recepcao = True
        visita.save()
        return Response({'status': 'confirmada', 'visita_id': visita.id})

    @action(detail=True, methods=['post'], url_path='atribuir-crachas')
    def atribuir_crachas(self, request, pk=None):
        """
        Atribui crachás a uma visita (apenas Admin, Portaria e Secretaria)
        Recepção NÃO pode associar crachás
        """
        visita = self.get_object()
        
        # Validar acesso ao órgão da visita
        self.validate_orgao_access(request.user, visita.orgao)
        
        serializer = AtribuirCrachaSerializer(data=request.data)
        if serializer.is_valid():
            cracha_ids = serializer.validated_data['cracha_ids']
            crachas_atribuidos = []
            errors = []

            crachas = Cracha.objects.filter(id__in=cracha_ids)
            crachas_map = {cracha.id: cracha for cracha in crachas}

            for cracha_id in cracha_ids:
                cracha = crachas_map.get(cracha_id)
                if not cracha:
                    errors.append(f"Crachá com ID {cracha_id} não encontrado.")
                    continue
                
                try:
                    cracha.visita = visita
                    cracha.save()
                    crachas_atribuidos.append(cracha)
                except ValidationError as e:
                    errors.append(f"Crachá {cracha.numero}: {e.detail[0] if isinstance(e.detail, list) else e.detail}")

            if errors:
                return Response({
                    'status': 'Atribuição parcial concluída com erros.',
                    'erros': errors
                }, status=status.HTTP_400_BAD_REQUEST)

            logger.info(f"Crachás atribuídos à visita {visita.id} por {request.user.username}")
            return Response({
                'status': 'Crachás atribuídos com sucesso.',
                'crachas': [c.numero for c in crachas_atribuidos]
            }, status=status.HTTP_200_OK)
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=['get'], url_path='crachas')
    def get_crachas(self, request, pk=None):
        """
        Retorna os crachás associados à visita (apenas Admin, Portaria e Secretaria)
        Recepção NÃO pode visualizar crachás
        """
        visita = self.get_object()
        
        # Validar acesso ao órgão da visita
        self.validate_orgao_access(request.user, visita.orgao)
        
        # Buscar crachás associados à visita
        from apps.crachas.models import Cracha
        from apps.crachas.serializers import CrachaSerializer
        
        crachas = Cracha.objects.filter(visita=visita)
        serializer = CrachaSerializer(crachas, many=True)
        
        logger.info(f"Buscando crachás da visita {visita.id} por {request.user.username}")
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def buscar_acompanhante_por_documento(self, request):
        """
        Busca acompanhantes por número de documento
        """
        documento_numero = request.query_params.get('documento_numero')
        if not documento_numero:
            return Response({'detail': 'Parâmetro documento_numero é obrigatório'}, status=status.HTTP_400_BAD_REQUEST)
        
        acompanhantes = Acompanhante.objects.filter(documento_numero=documento_numero)
        serializer = AcompanhanteSerializer(acompanhantes, many=True)
        return Response(serializer.data)