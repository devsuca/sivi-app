from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import Orgao
from apps.authentication.models import Perfil
from apps.pessoas.models import Efetivo

User = get_user_model()


class Command(BaseCommand):
    help = 'Configura o Departamento de Segurança Institucional (DSI) e usuário de portaria'

    def handle(self, *args, **options):
        self.stdout.write('🔧 Configurando DSI e usuário de portaria...')
        
        # 1. Criar perfil de portaria se não existir
        portaria_perfil, created = Perfil.objects.get_or_create(
            nome='Portaria',
            defaults={
                'nivel_acesso': 'portaria',
                'descricao': 'Operador de portaria com acesso a todas as visitas'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('✅ Perfil de portaria criado')
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️ Perfil de portaria já existe')
            )
        
        # 2. Criar órgão DSI
        dsi_orgao, created = Orgao.objects.get_or_create(
            nome='DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL',
            defaults={
                'sigla': 'DSI',
                'bloco': 'A',
                'numero_porta': '101',
                'telefone_interno': '101',
                'ativo': True
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('✅ Órgão DSI criado')
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️ Órgão DSI já existe')
            )
        
        # 3. Criar usuário de portaria do DSI
        portaria_user, created = User.objects.get_or_create(
            username='portaria_dsi',
            defaults={
                'email': 'portaria.dsi@sic.gov.ao',
                'nome': 'Operador Portaria DSI',
                'perfil': portaria_perfil,
                'is_active': True
            }
        )
        
        if created:
            portaria_user.set_password('PortariaDSI@123')
            portaria_user.save()
            self.stdout.write(
                self.style.SUCCESS('✅ Usuário portaria DSI criado')
            )
        else:
            self.stdout.write(
                self.style.WARNING('⚠️ Usuário portaria DSI já existe')
            )
        
        # 4. Criar efetivo para o usuário de portaria
        efetivo, created = Efetivo.objects.get_or_create(
            usuario=portaria_user,
            defaults={
                'nome_completo': 'Operador Portaria DSI',
                'orgao': dsi_orgao,
                'telefone': '923456789',
                'email': 'portaria.dsi@sic.gov.ao',
                'ativo': True
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('✅ Efetivo portaria DSI criado')
            )
        else:
            # Atualizar órgão se necessário
            if efetivo.orgao != dsi_orgao:
                efetivo.orgao = dsi_orgao
                efetivo.save()
                self.stdout.write(
                    self.style.SUCCESS('✅ Efetivo portaria DSI atualizado')
                )
            else:
                self.stdout.write(
                    self.style.WARNING('⚠️ Efetivo portaria DSI já existe')
                )
        
        # 5. Definir responsável do órgão
        if dsi_orgao.responsavel != portaria_user:
            dsi_orgao.responsavel = portaria_user
            dsi_orgao.save()
            self.stdout.write(
                self.style.SUCCESS('✅ Responsável do órgão DSI definido')
            )
        
        self.stdout.write('\n' + '='*60)
        self.stdout.write(
            self.style.SUCCESS('🎉 Configuração do DSI concluída com sucesso!')
        )
        self.stdout.write('\n📋 Informações de acesso:')
        self.stdout.write(f'   Usuário: portaria_dsi')
        self.stdout.write(f'   Senha: PortariaDSI@123')
        self.stdout.write(f'   Role: portaria')
        self.stdout.write(f'   Órgão: {dsi_orgao.nome} ({dsi_orgao.sigla})')
        self.stdout.write('\n🔗 URLs importantes:')
        self.stdout.write(f'   Admin: http://localhost:8000/admin/')
        self.stdout.write(f'   API: http://localhost:8000/api/')
        self.stdout.write(f'   WebSocket: ws://localhost:8000/ws/notifications/')
        self.stdout.write('='*60)
