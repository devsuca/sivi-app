#!/usr/bin/env python
import os
import sys
import django

# Configurar Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_development')
django.setup()

from apps.usuarios.models import Usuario

# Criar superusuário
try:
    if not Usuario.objects.filter(username='admin').exists():
        Usuario.objects.create_superuser(
            username='admin',
            email='admin@sic.gov.ao',
            password='admin123',
            nome='Administrador'
        )
        print("✅ Superusuário criado com sucesso!")
        print("   Username: admin")
        print("   Email: admin@sic.gov.ao")
        print("   Password: admin123")
    else:
        print("⚠️ Superusuário 'admin' já existe!")
except Exception as e:
    print(f"❌ Erro ao criar superusuário: {e}")
