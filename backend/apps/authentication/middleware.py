import logging
from django.utils.deprecation import MiddlewareMixin
from django.http import JsonResponse
from django.core.exceptions import PermissionDenied
from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver

logger = logging.getLogger(__name__)

class LoginLoggingMiddleware(MiddlewareMixin):
    """
    Middleware para logging de eventos de autenticação
    """
    
    def process_request(self, request):
        """
        Processa a requisição para logging de acesso
        """
        # Log de acesso para auditoria
        if request.user and request.user.is_authenticated:
            logger.info(f"Usuário {request.user.username} acessando {request.method} {request.path}")
        
        return None

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    """Log quando usuário faz login"""
    logger.info(f"Usuário {user.username} fez login com sucesso")

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    """Log quando usuário faz logout"""
    logger.info(f"Usuário {user.username if user else 'Anônimo'} fez logout")

@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    """Log quando login falha"""
    username = credentials.get('username', 'Desconhecido')
    logger.warning(f"Tentativa de login falhada para usuário: {username}")

class OrgaoAccessMiddleware(MiddlewareMixin):
    """
    Middleware para garantir controle de acesso baseado em órgão
    """
    
    def process_request(self, request):
        """
        Processa a requisição para validar acesso baseado em órgão
        """
        # Apenas para usuários autenticados
        if not request.user or not request.user.is_authenticated:
            return None
        
        # Apenas para usuários com perfil
        if not hasattr(request.user, 'perfil') or not request.user.perfil:
            logger.warning(f"Usuário {request.user.username} sem perfil tentando acessar {request.path}")
            return None
        
        # Log de acesso para auditoria
        logger.info(f"Usuário {request.user.username} ({request.user.perfil.nivel_acesso}) acessando {request.method} {request.path}")
        
        return None
    
    def process_exception(self, request, exception):
        """
        Processa exceções relacionadas a permissões
        """
        if isinstance(exception, PermissionDenied):
            logger.warning(f"Acesso negado para {request.user.username} em {request.path}: {str(exception)}")
            return JsonResponse({
                'error': 'Acesso negado',
                'detail': str(exception),
                'code': 'permission_denied'
            }, status=403)
        
        return None