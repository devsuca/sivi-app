import os
import django
from django.conf import settings
import requests

# Configurar o ambiente Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings_development')
django.setup()

from apps.usuarios.models import Usuario
from apps.authentication.models import Perfil

def test_filters():
    print("🔍 Testando filtros do endpoint audit-logs...")
    
    try:
        # Criar um usuário de teste se não existir
        admin_perfil, created = Perfil.objects.get_or_create(nome='Administrador', nivel_acesso='admin')
        if created:
            print("Perfil 'Administrador' criado.")
        
        user, created = Usuario.objects.get_or_create(username='testadmin', email='testadmin@example.com', defaults={'perfil': admin_perfil})
        if created:
            user.set_password('password123')
            user.save()
            print("Usuário 'testadmin' criado.")
        
        # Obter token
        login_data = {
            'email': 'testadmin@example.com',
            'password': 'password123'
        }
        
        print("🔐 Fazendo login...")
        response = requests.post('http://localhost:8000/api/auth/token/', json=login_data)
        
        if response.status_code == 200:
            token_data = response.json()
            access_token = token_data['access']
            print(f"✅ Token obtido: {access_token[:20]}...")
            
            headers = {
                'Authorization': f'Bearer {access_token}',
                'Content-Type': 'application/json'
            }
            
            # Testar filtro por entidade
            print("📊 Testando filtro por entidade 'Visitante'...")
            response = requests.get('http://localhost:8000/api/audit-logs/?entidade=Visitante', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Filtro por entidade funcionando! Total: {data['count']}")
                if data['results']:
                    print(f"Primeiro resultado: {data['results'][0]['entidade']}")
            else:
                print(f"❌ Erro no filtro por entidade: {response.text}")
            
            # Testar filtro por ação
            print("📊 Testando filtro por ação 'criacao'...")
            response = requests.get('http://localhost:8000/api/audit-logs/?acao=criacao', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Filtro por ação funcionando! Total: {data['count']}")
                if data['results']:
                    print(f"Primeiro resultado: {data['results'][0]['acao']}")
            else:
                print(f"❌ Erro no filtro por ação: {response.text}")
            
            # Testar busca geral
            print("📊 Testando busca geral 'Visitante'...")
            response = requests.get('http://localhost:8000/api/audit-logs/?search=Visitante', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Busca geral funcionando! Total: {data['count']}")
            else:
                print(f"❌ Erro na busca geral: {response.text}")
            
            # Testar múltiplos filtros
            print("📊 Testando múltiplos filtros...")
            response = requests.get('http://localhost:8000/api/audit-logs/?entidade=Visitante&acao=criacao', headers=headers)
            print(f"Status: {response.status_code}")
            if response.status_code == 200:
                data = response.json()
                print(f"✅ Múltiplos filtros funcionando! Total: {data['count']}")
            else:
                print(f"❌ Erro nos múltiplos filtros: {response.text}")
                
        else:
            print(f"❌ Erro no login: {response.status_code}")
            print(f"📄 Conteúdo: {response.text}")
            
    except Exception as e:
        print(f"❌ Erro no teste: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_filters()
