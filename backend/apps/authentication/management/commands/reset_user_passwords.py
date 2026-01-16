from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()

class Command(BaseCommand):
    help = 'Redefine senhas de usuários para valores conhecidos'

    def handle(self, *args, **options):
        # Lista de usuários e suas senhas padrão
        users_passwords = [
            ('admin@sic.gov.ao', 'admin123'),
            ('suporte@sic.gov.ao', 'suporte123'),
            ('admin01@sic.gov.ao', 'admin123'),
            ('jacques.nkete@sic.gov.ao', 'jacques123'),
            ('teste@sic.gov.ao', 'teste123'),
        ]

        for email, password in users_passwords:
            try:
                user = User.objects.get(email=email)
                user.set_password(password)
                user.save()
                self.stdout.write(
                    self.style.SUCCESS(f'✅ Senha redefinida para {email}')
                )
            except User.DoesNotExist:
                self.stdout.write(
                    self.style.WARNING(f'⚠️ Usuário {email} não encontrado')
                )
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'❌ Erro ao redefinir senha para {email}: {str(e)}')
                )

        self.stdout.write(
            self.style.SUCCESS('\n🎉 Processo de redefinição de senhas concluído!')
        )
