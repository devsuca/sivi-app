from rest_framework import permissions
from django.contrib.auth import get_user_model

User = get_user_model()

class TicketPermissions(permissions.BasePermission):
    """
    Permissões personalizadas para o sistema de tickets
    """
    
    def has_permission(self, request, view):
        """
        Verifica se o usuário tem permissão para acessar a view
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários têm acesso total
        if request.user.is_superuser:
            return True
        
        # Staff tem acesso total
        if request.user.is_staff:
            return True
        
        # Verifica se o usuário tem perfil de suporte
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Para operações de leitura, permite se o usuário é solicitante ou atribuído
        if request.method in permissions.SAFE_METHODS:
            return True
        
        # Para criação de tickets (POST), permite todos os usuários autenticados
        if request.method == 'POST':
            return True
        
        # Para outras operações de escrita, apenas suporte, staff ou superuser
        return False
    
    def has_object_permission(self, request, view, obj):
        """
        Verifica permissões específicas para um objeto ticket
        """
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários têm acesso total
        if request.user.is_superuser:
            return True
        
        # Staff tem acesso total
        if request.user.is_staff:
            return True
        
        # Usuários de suporte têm acesso total aos tickets
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Usuários normais só podem ver/editar seus próprios tickets
        if obj.solicitante == request.user:
            return True
        
        # Usuários atribuídos podem ver o ticket
        if obj.atribuido_para == request.user:
            return True
        
        return False

class TicketCommentPermissions(permissions.BasePermission):
    """
    Permissões para comentários de tickets
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários e staff têm acesso total
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Usuários de suporte têm acesso total
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Usuários normais podem comentar em seus tickets
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários e staff têm acesso total
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Usuários de suporte têm acesso total
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Usuários podem editar seus próprios comentários
        if obj.autor == request.user:
            return True
        
        # Usuários podem ver comentários de seus tickets
        if (obj.ticket.solicitante == request.user or 
            obj.ticket.atribuido_para == request.user):
            return True
        
        return False

class TicketAttachmentPermissions(permissions.BasePermission):
    """
    Permissões para anexos de tickets
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários e staff têm acesso total
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Usuários de suporte têm acesso total
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Usuários normais podem anexar arquivos
        return True
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários e staff têm acesso total
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Usuários de suporte têm acesso total
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Usuários podem ver anexos de seus tickets
        if (obj.ticket.solicitante == request.user or 
            obj.ticket.atribuido_para == request.user):
            return True
        
        return False

class TicketTemplatePermissions(permissions.BasePermission):
    """
    Permissões para templates de tickets
    """
    
    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários e staff têm acesso total
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Usuários de suporte podem ver templates
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Para leitura, todos os usuários autenticados podem ver templates
        if request.method in permissions.SAFE_METHODS:
            return True
        
        return False
    
    def has_object_permission(self, request, view, obj):
        if not request.user or not request.user.is_authenticated:
            return False
        
        # Superusuários e staff têm acesso total
        if request.user.is_superuser or request.user.is_staff:
            return True
        
        # Usuários de suporte têm acesso total
        if hasattr(request.user, 'perfil') and request.user.perfil:
            if request.user.perfil.nivel_acesso == 'suporte':
                return True
        
        # Para leitura, todos podem ver templates ativos
        if request.method in permissions.SAFE_METHODS and obj.ativo:
            return True
        
        return False

def is_support_user(user):
    """
    Verifica se o usuário tem perfil de suporte
    """
    if not user or not user.is_authenticated:
        return False
    
    if user.is_superuser or user.is_staff:
        return True
    
    if hasattr(user, 'perfil') and user.perfil:
        return user.perfil.nivel_acesso == 'suporte'
    
    return False

def can_manage_tickets(user):
    """
    Verifica se o usuário pode gerenciar tickets
    """
    return is_support_user(user)

def can_view_all_tickets(user):
    """
    Verifica se o usuário pode ver todos os tickets
    """
    return is_support_user(user)

def can_assign_tickets(user):
    """
    Verifica se o usuário pode atribuir tickets
    """
    return is_support_user(user)
