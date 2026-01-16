#!/usr/bin/env python
"""
Script para verificar detalhes do usuário e suas permissões
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario
from apps.authentication.models import Perfil

def check_user_permissions():
    """Verifica permissões de todos os usuários"""
    
    print("\n" + "="*80)
    print("VERIFICACAO DE PERMISSOES DE USUARIOS")
    print("="*80 + "\n")
    
    usuarios = Usuario.objects.all()
    
    for user in usuarios:
        print(f"Usuario: {user.username}")
        print(f"  - ID: {user.id}")
        print(f"  - Email: {user.email}")
        print(f"  - is_authenticated: {user.is_authenticated}")
        
        if hasattr(user, 'perfil') and user.perfil:
            print(f"  - Tem perfil: SIM")
            print(f"  - Perfil ID: {user.perfil.id}")
            print(f"  - Nivel de acesso: '{user.perfil.nivel_acesso}'")
            print(f"  - Tipo do nivel_acesso: {type(user.perfil.nivel_acesso)}")
            
            # Verificar permissões
            nivel = user.perfil.nivel_acesso
            print(f"\n  PERMISSOES:")
            print(f"    CanViewVisitas (admin|portaria|secretaria|recepcao): {nivel in ['admin', 'portaria', 'secretaria', 'recepcao']}")
            print(f"    CanViewOrgaoVisitas (recepcao com orgao): {nivel == 'recepcao' and hasattr(user, 'orgao') and user.orgao}")
            print(f"    CanModifyVisita (admin|portaria|secretaria): {nivel in ['admin', 'portaria', 'secretaria']}")
            print(f"    CanFinalizeVisita (admin|portaria|secretaria): {nivel in ['admin', 'portaria', 'secretaria']}")
        else:
            print(f"  - Tem perfil: NAO")
        
        if hasattr(user, 'orgao') and user.orgao:
            print(f"  - Orgao: {user.orgao.nome}")
        else:
            print(f"  - Orgao: Nenhum")
        
        print()
    
    print("="*80 + "\n")

if __name__ == '__main__':
    try:
        check_user_permissions()
    except Exception as e:
        print(f"[X] Erro: {e}")
        import traceback
        traceback.print_exc()
