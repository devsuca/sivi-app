from rest_framework.permissions import IsAuthenticated
from rest_framework.exceptions import PermissionDenied
from django.core.exceptions import ValidationError
import logging

logger = logging.getLogger(__name__)

class OrgaoAccessMixin:
    """
    Mixin para controle de acesso baseado em órgão
    """
    
    def get_user_orgao(self, user):
        """
        Obtém o órgão do usuário baseado no seu perfil
        """
        if not user or not user.is_authenticated:
            logger.warning("get_user_orgao: usuário não autenticado")
            return None
        
        if not hasattr(user, 'perfil') or not user.perfil:
            logger.warning(f"get_user_orgao: usuário {user.username} sem perfil")
            return None
        
        nivel_acesso = user.perfil.nivel_acesso
        logger.debug(f"get_user_orgao: usuário {user.username} com perfil {nivel_acesso}")
        
        if nivel_acesso == 'recepcao':
            # Recepção: órgão vinculado diretamente ao usuário
            orgao = getattr(user, 'orgao', None)
            if orgao:
                logger.debug(f"get_user_orgao: recepção {user.username} com órgão {orgao}")
            else:
                logger.warning(f"get_user_orgao: recepção {user.username} SEM órgão vinculado")
            return orgao
        elif nivel_acesso == 'portaria':
            # Portaria: órgão vinculado através do efetivo
            if hasattr(user, 'efetivo') and user.efetivo:
                orgao = getattr(user.efetivo, 'orgao', None)
                if orgao:
                    logger.debug(f"get_user_orgao: portaria {user.username} com órgão {orgao} via efetivo")
                return orgao
            logger.debug(f"get_user_orgao: portaria {user.username} sem efetivo vinculado")
        elif nivel_acesso == 'admin':
            # Admin: acesso a todos os órgãos
            logger.debug(f"get_user_orgao: admin {user.username} - sem restrição de órgão")
            return None
        elif nivel_acesso == 'secretaria':
            # Secretaria: acesso a todos os órgãos
            logger.debug(f"get_user_orgao: secretaria {user.username} - sem restrição de órgão")
            return None
        
        return None
    
    def filter_queryset_by_orgao(self, queryset, user):
        """
        Filtra o queryset baseado no órgão do usuário
        """
        logger.info(f"Filtrando queryset para usuário {user.username if user else 'None'}")
        
        if not user or not user.is_authenticated:
            logger.error(f"Tentativa de acesso sem autenticação")
            raise PermissionDenied('Usuário não autenticado.')
        
        if not hasattr(user, 'perfil') or not user.perfil:
            logger.error(f"Usuário {user.username} sem perfil válido. Verifique se o perfil foi criado.")
            raise PermissionDenied(
                'Seu usuário não possui um perfil válido. '
                'Entre em contato com o administrador do sistema para atribuir um perfil.'
            )
        
        nivel_acesso = user.perfil.nivel_acesso
        logger.info(f"Usuário {user.username} tem perfil {nivel_acesso}")
        
        if nivel_acesso == 'admin':
            # Admin: acesso a todos os registros
            logger.info(f"Admin {user.username}: acesso total concedido")
            return queryset
        elif nivel_acesso == 'portaria':
            # Portaria: acesso a todas as visitas (controle global)
            logger.info(f"Portaria {user.username}: acesso total concedido")
            return queryset
        elif nivel_acesso == 'recepcao':
            # Recepção: acesso apenas ao órgão do usuário
            orgao = self.get_user_orgao(user)
            if not orgao:
                logger.error(f"Usuário recepção {user.username} sem órgão vinculado")
                raise PermissionDenied(
                    'Seu usuário de recepção não possui órgão vinculado. '
                    'Entre em contato com o administrador do sistema.'
                )
            logger.info(f"Recepção {user.username}: filtrando por órgão {orgao}")
            return queryset.filter(orgao=orgao)
        elif nivel_acesso == 'secretaria':
            # Secretaria: acesso a todas as visitas (similar a portaria)
            logger.info(f"Secretaria {user.username}: acesso total concedido")
            return queryset
        else:
            logger.error(f"Perfil {nivel_acesso} não reconhecido para usuário {user.username}")
            raise PermissionDenied(f'Perfil "{nivel_acesso}" não autorizado para esta operação.')
    
    def validate_orgao_access(self, user, orgao):
        """
        Valida se o usuário pode acessar um órgão específico
        """
        logger.info(f"Validando acesso do usuário {user.username} ao órgão {orgao}")
        
        if not user or not user.is_authenticated or not user.perfil:
            logger.error(f"Usuário {user.username if user else 'None'} não autenticado ou sem perfil")
            raise PermissionDenied('Usuário não autenticado ou sem perfil.')
        
        nivel_acesso = user.perfil.nivel_acesso
        logger.info(f"Usuário {user.username} tem perfil {nivel_acesso}")
        
        if nivel_acesso == 'admin':
            # Admin: pode acessar qualquer órgão
            logger.info(f"Admin {user.username} autorizado para órgão {orgao}")
            return True
        elif nivel_acesso == 'portaria':
            # Portaria: pode acessar qualquer órgão
            logger.info(f"Portaria {user.username} autorizada para órgão {orgao}")
            return True
        elif nivel_acesso == 'recepcao':
            # Recepção: apenas seu órgão
            user_orgao = self.get_user_orgao(user)
            logger.info(f"Usuário recepção {user.username} tem órgão {user_orgao}, tentando acessar {orgao}")
            if not user_orgao:
                logger.error(f"Usuário recepção {user.username} sem órgão vinculado")
                raise PermissionDenied('Usuário recepção sem órgão vinculado.')
            if user_orgao != orgao:
                logger.warning(f"Acesso negado: usuário {user.username} (órgão {user_orgao}) tentando acessar órgão {orgao}")
                raise PermissionDenied('Acesso negado: órgão não autorizado.')
            logger.info(f"Usuário recepção {user.username} autorizado para órgão {orgao}")
            return True
        else:
            logger.error(f"Perfil {nivel_acesso} não autorizado para usuário {user.username}")
            raise PermissionDenied('Perfil não autorizado para esta operação.')
    
    def get_orgao_for_creation(self, user):
        """
        Obtém o órgão para criação de novos registros
        """
        if not user or not user.is_authenticated or not user.perfil:
            raise PermissionDenied('Usuário não autenticado ou sem perfil.')
        
        nivel_acesso = user.perfil.nivel_acesso
        
        if nivel_acesso == 'recepcao':
            # Recepção: deve usar seu órgão
            orgao = self.get_user_orgao(user)
            if not orgao:
                raise PermissionDenied('Usuário recepção sem órgão vinculado.')
            return orgao
        elif nivel_acesso in ['admin', 'portaria']:
            # Admin e Portaria: podem especificar qualquer órgão
            return None  # Será definido pelo serializer
        else:
            raise PermissionDenied('Perfil não autorizado para criar registros.')
