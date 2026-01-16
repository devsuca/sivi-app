from django.core.management.base import BaseCommand
from apps.usuarios.models import Usuario
from apps.core.models import Orgao

class Command(BaseCommand):
    help = 'Associa órgãos aos usuários que não possuem órgão definido'

    def add_arguments(self, parser):
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Mostra quais usuários seriam afetados sem fazer alterações',
        )

    def handle(self, *args, **options):
        dry_run = options['dry_run']
        
        self.stdout.write(
            self.style.SUCCESS('🔧 Associando órgãos aos usuários...')
        )

        # Buscar usuários sem órgão
        users_without_orgao = Usuario.objects.filter(orgao__isnull=True)
        
        if not users_without_orgao.exists():
            self.stdout.write(
                self.style.SUCCESS('✅ Todos os usuários já possuem órgão associado!')
            )
            return

        self.stdout.write(
            self.style.WARNING(f'⚠️ Encontrados {users_without_orgao.count()} usuários sem órgão:')
        )

        # Mostrar usuários sem órgão
        for user in users_without_orgao:
            self.stdout.write(f'  - {user.username} ({user.email}) - Role: {user.perfil.nome if user.perfil else "Sem perfil"}')

        # Buscar órgão padrão (DSI)
        dsi_orgao = Orgao.objects.filter(
            nome__icontains='DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL'
        ).first()

        if not dsi_orgao:
            # Se não encontrar DSI, usar o primeiro órgão disponível
            dsi_orgao = Orgao.objects.first()
            
        if not dsi_orgao:
            self.stdout.write(
                self.style.ERROR('❌ Nenhum órgão encontrado no sistema!')
            )
            return

        self.stdout.write(
            self.style.SUCCESS(f'📋 Usando órgão padrão: {dsi_orgao.nome} ({dsi_orgao.sigla})')
        )

        if dry_run:
            self.stdout.write(
                self.style.WARNING('🔍 Modo dry-run: Nenhuma alteração será feita')
            )
            for user in users_without_orgao:
                self.stdout.write(f'  → {user.username} seria associado ao órgão {dsi_orgao.nome}')
            return

        # Associar órgão aos usuários
        updated_count = 0
        for user in users_without_orgao:
            user.orgao = dsi_orgao
            user.save()
            updated_count += 1
            self.stdout.write(
                self.style.SUCCESS(f'✅ {user.username} associado ao órgão {dsi_orgao.nome}')
            )

        self.stdout.write(
            self.style.SUCCESS(f'🎉 {updated_count} usuários atualizados com sucesso!')
        )

        # Verificar se ainda há usuários sem órgão
        remaining_users = Usuario.objects.filter(orgao__isnull=True).count()
        if remaining_users == 0:
            self.stdout.write(
                self.style.SUCCESS('✅ Todos os usuários agora possuem órgão associado!')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'⚠️ Ainda restam {remaining_users} usuários sem órgão')
            )
