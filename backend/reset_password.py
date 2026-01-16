#!/usr/bin/env python
"""
Script para resetar senha do usuário admin
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
django.setup()

from django.contrib.auth import get_user_model

User = get_user_model()

def reset_admin_password():
    """Resetar senha do admin"""
    try:
        # Buscar usuário admin
        user = User.objects.get(username='admin')
        
        # Definir nova senha
        user.set_password('Admin@123')
        user.save()
        
        print("✅ Senha do usuário admin resetada com sucesso!")
        print("📋 Credenciais:")
        print("   Username: admin")
        print("   Email: admin@sic.gov.ao")
        print("   Password: Admin@123")
        
        # Verificar se o usuário está ativo
        print(f"   Ativo: {user.is_active}")
        print(f"   Staff: {user.is_staff}")
        print(f"   Superuser: {user.is_superuser}")
        
    except User.DoesNotExist:
        print("❌ Usuário admin não encontrado!")
    except Exception as e:
        print(f"❌ Erro ao resetar senha: {e}")

if __name__ == '__main__':
    reset_admin_password()



