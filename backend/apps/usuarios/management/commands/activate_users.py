
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Activates all inactive users'

    def handle(self, *args, **options):
        User = get_user_model()
        inactive_users = User.objects.filter(is_active=False)
        count = inactive_users.count()
        inactive_users.update(is_active=True)
        self.stdout.write(self.style.SUCCESS(f'Successfully activated {count} users.'))
