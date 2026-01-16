from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.authentication.models import Perfil
from apps.core.models import Orgao
from apps.pessoas.models import Efetivo


class Command(BaseCommand):
    help = "Cria usuários de exemplo (admin@sic.gov.ao, portaria@sic.gov.ao) e um Órgão padrão."

    def handle(self, *args, **options):
        User = get_user_model()

        # Órgão padrão
        orgao, _ = Orgao.objects.get_or_create(nome="Direcção Geral")

        # Perfis necessários
        admin_perfil = Perfil.objects.filter(nivel_acesso="admin").order_by('id').first()
        portaria_perfil = Perfil.objects.filter(nivel_acesso="portaria").order_by('id').first()
        if not admin_perfil or not portaria_perfil:
            self.stdout.write(self.style.WARNING("Perfis não encontrados. Execute primeiro: python manage.py seed_perfis"))
            return

        # Admin
        admin_user, created_admin = User.objects.get_or_create(
            username="admin",
            defaults={
                "email": "admin@sic.gov.ao",
                "nome": "Administrador do Sistema",
                "perfil": admin_perfil,
                "orgao": orgao,
                "is_staff": True,
                "is_superuser": True,
                "is_active": True,
            },
        )
        if created_admin:
            admin_user.set_password("Admin@123")
            admin_user.save()
        # garantir Efetivo vinculado
        Efetivo.objects.update_or_create(
            usuario=admin_user,
            defaults={
                "nome_completo": admin_user.nome or admin_user.username,
                "email": admin_user.email,
                "orgao": orgao,
                "ativo": True,
            },
        )

        # Portaria
        port_user, created_port = User.objects.get_or_create(
            username="portaria",
            defaults={
                "email": "portaria@sic.gov.ao",
                "nome": "Operador Portaria",
                "perfil": portaria_perfil,
                "orgao": orgao,
                "is_active": True,
            },
        )
        if created_port:
            port_user.set_password("Portaria@123")
            port_user.save()
        # garantir Efetivo vinculado
        Efetivo.objects.update_or_create(
            usuario=port_user,
            defaults={
                "nome_completo": port_user.nome or port_user.username,
                "email": port_user.email,
                "orgao": orgao,
                "ativo": True,
            },
        )

        self.stdout.write(
            self.style.SUCCESS(
                "Seeds criados/validados: admin(Admin@123) e portaria(Portaria@123). Órgão padrão incluído."
            )
        )


