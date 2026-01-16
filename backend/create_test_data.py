#!/usr/bin/env python
"""
Script para criar dados de teste para SIVI+360°
"""
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_test')
django.setup()

from django.contrib.auth import get_user_model
from apps.authentication.models import Perfil
from apps.core.models import Orgao
from apps.pessoas.models import Visitante

User = get_user_model()

def create_test_data():
    """Criar dados de teste"""
    try:
        # Criar órgão de teste
        orgao, created = Orgao.objects.get_or_create(
            nome='DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL',
            defaults={
                'sigla': 'DSI',
                'ativo': True
            }
        )
        if created:
            print("✅ Órgão DSI criado!")
        else:
            print("✅ Órgão DSI já existe!")
        
        # Criar perfil de administrador
        perfil, created = Perfil.objects.get_or_create(
            nome='Administrador',
            defaults={
                'nivel_acesso': 'admin'
            }
        )
        if created:
            print("✅ Perfil de administrador criado!")
        else:
            print("✅ Perfil de administrador já existe!")
        
        # Criar usuário admin
        user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@sic.gov.ao',
                'password': 'pbkdf2_sha256$600000$dummy$dummy',  # Senha temporária
                'first_name': 'Administrador',
                'last_name': 'Sistema',
                'is_staff': True,
                'is_superuser': True,
                'is_active': True,
                'perfil': perfil,
                'orgao': orgao
            }
        )
        
        if created:
            print("✅ Usuário admin criado!")
        else:
            print("✅ Usuário admin já existe!")
        
        # Definir senha correta
        user.set_password('Admin@123')
        user.save()
        print("✅ Senha do admin definida!")
        
        # Criar alguns visitantes de teste
        visitantes_data = [
            {
                'nome': 'João Silva',
                'tipo_pessoa': 'singular',
                'documento_numero': '123456789LA045',
                'documento_tipo': 'BI',
                'telefone': '+244 999 111 111',
                'email': 'joao@email.com',
                'nacionalidade': 'Angola'
            },
            {
                'nome': 'Maria Santos',
                'tipo_pessoa': 'singular',
                'documento_numero': '987654321LA045',
                'documento_tipo': 'BI',
                'telefone': '+244 999 222 222',
                'email': 'maria@email.com',
                'nacionalidade': 'Angola'
            },
            {
                'designacao_social': 'EMPRESA TESTE LTDA',
                'tipo_pessoa': 'coletiva',
                'nif': '123456789',
                'telefone': '+244 999 333 333',
                'email': 'empresa@email.com',
                'nacionalidade': 'Angola'
            }
        ]
        
        for data in visitantes_data:
            visitante, created = Visitante.objects.get_or_create(
                documento_numero=data.get('documento_numero', data.get('nif')),
                defaults=data
            )
            if created:
                print(f"✅ Visitante {data.get('nome', data.get('designacao_social'))} criado!")
            else:
                print(f"✅ Visitante {data.get('nome', data.get('designacao_social'))} já existe!")
        
        print("\n🎉 Dados de teste criados com sucesso!")
        print("📋 Credenciais para login:")
        print("   Email: admin@sic.gov.ao")
        print("   Password: Admin@123")
        
    except Exception as e:
        print(f"❌ Erro ao criar dados de teste: {e}")
        import traceback
        traceback.print_exc()

if __name__ == '__main__':
    create_test_data()



