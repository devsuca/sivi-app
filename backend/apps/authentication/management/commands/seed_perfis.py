from django.core.management.base import BaseCommand
from apps.authentication.models import Perfil


DEFAULT_PERFIS = [
    {"nome": "Administrador", "nivel_acesso": "admin"},
    {"nome": "Portaria", "nivel_acesso": "portaria"},
    {"nome": "Secretaria", "nivel_acesso": "secretaria"},
    {"nome": "Recepção", "nivel_acesso": "recepcao"},
]


class Command(BaseCommand):
    help = "Cria perfis padrão se não existirem (Administrador, Portaria, Secretaria, Recepção)."

    def handle(self, *args, **options):
        created_count = 0
        for item in DEFAULT_PERFIS:
            _, created = Perfil.objects.get_or_create(
                nome=item["nome"], defaults={"nivel_acesso": item["nivel_acesso"]}
            )
            if created:
                created_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Perfis verificados. Novos perfis criados: {created_count}."
            )
        )





