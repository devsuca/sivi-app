#!/usr/bin/env python
"""
Script para criar perfis admin para usuários sem perfil
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario
from apps.authentication.models import Perfil

def fix_users_without_profile():
    """Cria perfis admin para todos os usuários sem perfil"""
    
    users_without_profile = Usuario.objects.filter(perfil__isnull=True)
    
    if not users_without_profile.exists():
        print("[OK] Todos os usuarios ja tem perfil!")
        return
    
    print(f"[!] Encontrados {users_without_profile.count()} usuario(s) sem perfil\n")
    
    for user in users_without_profile:
        print(f"Criando perfil ADMIN para usuario: {user.username}")
        
        # Criar perfil admin
        perfil = Perfil.objects.create(
            usuario=user,
            nivel_acesso='admin'  # Criar como admin por padrão
        )
        
        print(f"   [OK] Perfil criado: {perfil.nivel_acesso}")
    
    print(f"\n[OK] Criados {users_without_profile.count()} perfis com sucesso!")
    print("    Agora todos os usuarios tem perfil atribuido.")
    print("    NOTA: Todos foram criados como 'admin'. Ajuste conforme necessario no Django Admin.")

if __name__ == '__main__':
    try:
        fix_users_without_profile()
    except Exception as e:
        print(f"[X] Erro: {e}")
        import traceback
        traceback.print_exc()
