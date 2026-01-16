from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.authentication.models import Perfil

User = get_user_model()

class Command(BaseCommand):
    help = 'Cria um usuário de suporte técnico para testes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--username',
            type=str,
            default='suporte',
            help='Username do usuário de suporte'
        )
        parser.add_argument(
            '--email',
            type=str,
            default='suporte@sic.gov.ao',
            help='Email do usuário de suporte'
        )
        parser.add_argument(
            '--password',
            type=str,
            default='suporte123',
            help='Senha do usuário de suporte'
        )

    def handle(self, *args, **options):
        username = options['username']
        email = options['email']
        password = options['password']

        # Criar ou obter perfil de suporte
        perfil_suporte, created = Perfil.objects.get_or_create(
            nome='Suporte Técnico',
            defaults={
                'nivel_acesso': Perfil.NivelAcesso.SUPORTE
            }
        )

        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Perfil "Suporte Técnico" criado com sucesso')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Perfil "Suporte Técnico" já existe')
            )

        # Criar usuário de suporte
        user, created = User.objects.get_or_create(
            username=username,
            defaults={
                'email': email,
                'first_name': 'Suporte',
                'last_name': 'Técnico',
                'is_active': True,
                'is_staff': True,
                'perfil': perfil_suporte
            }
        )

        if created:
            user.set_password(password)
            user.save()
            self.stdout.write(
                self.style.SUCCESS(
                    f'Usuário de suporte criado com sucesso!\n'
                    f'Username: {username}\n'
                    f'Email: {email}\n'
                    f'Senha: {password}\n'
                    f'Perfil: {perfil_suporte.nome} ({perfil_suporte.nivel_acesso})'
                )
            )
        else:
            # Atualizar perfil se o usuário já existe
            user.perfil = perfil_suporte
            user.is_staff = True
            user.save()
            self.stdout.write(
                self.style.WARNING(
                    f'Usuário {username} já existe. Perfil atualizado para Suporte Técnico.'
                )
            )
