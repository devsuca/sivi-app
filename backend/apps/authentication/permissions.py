from rest_framework.permissions import BasePermission
from django.core.exceptions import PermissionDenied

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.perfil and request.user.perfil.nivel_acesso == 'admin'

class IsPortaria(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.perfil and request.user.perfil.nivel_acesso == 'portaria'

class IsSecretaria(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.perfil and request.user.perfil.nivel_acesso == 'secretaria'

class IsRecepcao(BasePermission):
    def has_permission(self, request, view):
        return request.user and request.user.is_authenticated and request.user.perfil and request.user.perfil.nivel_acesso == 'recepcao'

class CanCreateNotification(BasePermission):
    """
    Permite criar notificações (Portaria, Admin e Recepção)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['portaria', 'admin', 'recepcao']

class CanAccessAllVisitas(BasePermission):
    """
    Permite acesso a todas as visitas (Admin e Portaria)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['admin', 'portaria']

class CanAccessOrgaoVisitas(BasePermission):
    """
    Permite acesso apenas às visitas do órgão do usuário (Recepção)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        if nivel_acesso == 'recepcao':
            # Verificar se o usuário tem órgão vinculado
            if not hasattr(request.user, 'orgao') or not request.user.orgao:
                return False
            return True
        
        # Admin e Portaria também podem acessar visitas por órgão
        return nivel_acesso in ['admin', 'portaria']

class CanCreateVisita(BasePermission):
    """
    Permite criar visitas (todos os perfis autenticados)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['admin', 'portaria', 'recepcao', 'secretaria']

class CanModifyVisita(BasePermission):
    """
    Permite modificar visitas (Admin, Portaria e Secretaria)
    Recepção NÃO pode modificar visitas existentes
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['admin', 'portaria', 'secretaria']

class CanViewVisitas(BasePermission):
    """
    Permite visualizar visitas (Admin, Portaria, Secretaria e Recepção)
    Recepção pode visualizar apenas visitas do seu órgão
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['admin', 'portaria', 'secretaria', 'recepcao']

class CanViewOrgaoVisitas(BasePermission):
    """
    Permite visualizar visitas apenas do órgão do usuário (Recepção)
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        if nivel_acesso == 'recepcao':
            # Verificar se o usuário tem órgão vinculado
            if not hasattr(request.user, 'orgao') or not request.user.orgao:
                return False
            return True
        
        return False

class CanFinalizeVisita(BasePermission):
    """
    Permite finalizar visitas (Admin, Portaria e Secretaria)
    Recepção NÃO pode finalizar visitas
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['admin', 'portaria', 'secretaria']

class CanAssociateCracha(BasePermission):
    """
    Permite associar crachás a visitas (Admin, Portaria e Secretaria)
    Recepção NÃO pode associar crachás
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['admin', 'portaria', 'secretaria']

class CanManagePertences(BasePermission):
    """
    Permite gerenciar pertences (Admin, Portaria e Secretaria)
    Recepção NÃO pode gerenciar pertences
    """
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated or not request.user.perfil:
            return False
        
        nivel_acesso = request.user.perfil.nivel_acesso
        return nivel_acesso in ['admin', 'portaria', 'secretaria']
