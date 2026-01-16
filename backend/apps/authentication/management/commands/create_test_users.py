from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.authentication.models import Perfil
from apps.core.models import Orgao
from apps.pessoas.models import Efetivo
from apps.usuarios.models import Usuario

User = get_user_model()

class Command(BaseCommand):
    help = 'Cria usuários de teste com diferentes perfis para testar controle de acesso'

    def handle(self, *args, **options):
        # Criar perfis se não existirem
        admin_perfil, _ = Perfil.objects.get_or_create(
            nome='Administrador',
            nivel_acesso='admin'
        )
        
        portaria_perfil, _ = Perfil.objects.get_or_create(
            nome='Portaria',
            nivel_acesso='portaria'
        )
        
        recepcao_perfil, _ = Perfil.objects.get_or_create(
            nome='Recepção',
            nivel_acesso='recepcao'
        )
        
        secretaria_perfil, _ = Perfil.objects.get_or_create(
            nome='Secretaria',
            nivel_acesso='secretaria'
        )
        
        # Criar órgãos de teste
        orgao1, _ = Orgao.objects.get_or_create(
            nome='Direção Geral',
            defaults={'bloco': 'A', 'numero_porta': '101'}
        )
        
        orgao2, _ = Orgao.objects.get_or_create(
            nome='Recursos Humanos',
            defaults={'bloco': 'B', 'numero_porta': '201'}
        )
        
        orgao3, _ = Orgao.objects.get_or_create(
            nome='Financeiro',
            defaults={'bloco': 'C', 'numero_porta': '301'}
        )
        
        # Criar usuário Admin
        admin_user, created = User.objects.get_or_create(
            username='admin',
            defaults={
                'email': 'admin@sivis.com',
                'nome': 'Administrador Sistema',
                'perfil': admin_perfil,
                'is_staff': True,
                'is_superuser': True
            }
        )
        if created:
            admin_user.set_password('admin123')
            admin_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Usuário admin criado com sucesso')
            )
        
        # Criar usuário Portaria
        portaria_user, created = User.objects.get_or_create(
            username='portaria',
            defaults={
                'email': 'portaria@sivis.com',
                'nome': 'Portaria Geral',
                'perfil': portaria_perfil
            }
        )
        if created:
            portaria_user.set_password('portaria123')
            portaria_user.save()
            
            # Criar efetivo para portaria
            efetivo_portaria, _ = Efetivo.objects.get_or_create(
                usuario=portaria_user,
                defaults={
                    'nome_completo': 'Portaria Geral',
                    'numero_funcional': 'PORT001',
                    'orgao': orgao1
                }
            )
            
            self.stdout.write(
                self.style.SUCCESS(f'Usuário portaria criado com sucesso')
            )
        
        # Criar usuário Recepção - Órgão 1
        recepcao1_user, created = User.objects.get_or_create(
            username='recepcao1',
            defaults={
                'email': 'recepcao1@sivis.com',
                'nome': 'Recepção Direção',
                'perfil': recepcao_perfil,
                'orgao': orgao1
            }
        )
        if created:
            recepcao1_user.set_password('recepcao123')
            recepcao1_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Usuário recepcao1 criado com sucesso')
            )
        
        # Criar usuário Recepção - Órgão 2
        recepcao2_user, created = User.objects.get_or_create(
            username='recepcao2',
            defaults={
                'email': 'recepcao2@sivis.com',
                'nome': 'Recepção RH',
                'perfil': recepcao_perfil,
                'orgao': orgao2
            }
        )
        if created:
            recepcao2_user.set_password('recepcao123')
            recepcao2_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Usuário recepcao2 criado com sucesso')
            )
        
        # Criar usuário Recepção - Órgão 3
        recepcao3_user, created = User.objects.get_or_create(
            username='recepcao3',
            defaults={
                'email': 'recepcao3@sivis.com',
                'nome': 'Recepção Financeiro',
                'perfil': recepcao_perfil,
                'orgao': orgao3
            }
        )
        if created:
            recepcao3_user.set_password('recepcao123')
            recepcao3_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Usuário recepcao3 criado com sucesso')
            )
        
        # Criar usuário Secretaria
        secretaria_user, created = User.objects.get_or_create(
            username='secretaria',
            defaults={
                'email': 'secretaria@sivis.com',
                'nome': 'Secretaria Geral',
                'perfil': secretaria_perfil,
                'orgao': orgao1
            }
        )
        if created:
            secretaria_user.set_password('secretaria123')
            secretaria_user.save()
            self.stdout.write(
                self.style.SUCCESS(f'Usuário secretaria criado com sucesso')
            )
        
        self.stdout.write(
            self.style.SUCCESS('\n=== USUÁRIOS DE TESTE CRIADOS ===')
        )
        self.stdout.write('Admin: admin / admin123 (acesso total)')
        self.stdout.write('Portaria: portaria / portaria123 (acesso a todas as visitas)')
        self.stdout.write('Recepção 1: recepcao1 / recepcao123 (apenas Direção Geral)')
        self.stdout.write('Recepção 2: recepcao2 / recepcao123 (apenas Recursos Humanos)')
        self.stdout.write('Recepção 3: recepcao3 / recepcao123 (apenas Financeiro)')
        self.stdout.write('Secretaria: secretaria / secretaria123 (apenas Direção Geral)')
        self.stdout.write('\n=== TESTE DE CONTROLE DE ACESSO ===')
        self.stdout.write('1. Faça login com cada usuário')
        self.stdout.write('2. Acesse a lista de visitas')
        self.stdout.write('3. Verifique se o acesso está correto conforme o perfil')

