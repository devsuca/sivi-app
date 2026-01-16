from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.authentication.models import Perfil
from apps.core.models import Orgao
from apps.pessoas.models import Efetivo


class Command(BaseCommand):
    help = "Cria um usuário com perfil de Recepção"

    def add_arguments(self, parser):
        parser.add_argument('--username', type=str, help='Nome de usuário', default='recepcao')
        parser.add_argument('--email', type=str, help='Email do usuário', default='recepcao@sic.gov.ao')
        parser.add_argument('--nome', type=str, help='Nome completo', default='Funcionário da Recepção')
        parser.add_argument('--password', type=str, help='Senha do usuário', default='Recepcao@123')

    def handle(self, *args, **options):
        User = get_user_model()
        
        username = options['username']
        email = options['email']
        nome = options['nome']
        password = options['password']

        # Verificar se o usuário já existe
        if User.objects.filter(username=username).exists():
            self.stdout.write(
                self.style.WARNING(f'Usuário "{username}" já existe!')
            )
            return

        # Órgão padrão
        orgao, _ = Orgao.objects.get_or_create(nome="Direcção Geral")

        # Garantir que o perfil de Recepção existe
        recepcao_perfil, created = Perfil.objects.get_or_create(
            nivel_acesso="recepcao",
            defaults={"nome": "Recepção"}
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS('Perfil "Recepção" criado com sucesso!')
            )

        # Criar o usuário
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            nome=nome,
            perfil=recepcao_perfil,
            orgao=orgao,
            is_active=True,
        )

        # Criar registro de Efetivo vinculado
        efetivo, created = Efetivo.objects.get_or_create(
            usuario=user,
            defaults={
                "nome_completo": nome,
                "email": email,
                "orgao": orgao,
                "ativo": True,
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                f'Usuário "{username}" criado com sucesso!\n'
                f'Email: {email}\n'
                f'Senha: {password}\n'
                f'Perfil: Recepção\n'
                f'Status: Ativo'
            )
        )



