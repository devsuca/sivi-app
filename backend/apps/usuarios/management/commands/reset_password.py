
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

class Command(BaseCommand):
    help = 'Resets the password for a user'

    def add_arguments(self, parser):
        parser.add_argument('username', type=str, help='The username of the user to reset the password for')
        parser.add_argument('password', type=str, help='The new password')

    def handle(self, *args, **options):
        User = get_user_model()
        username = options['username']
        password = options['password']
        try:
            user = User.objects.get(username=username)
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f'Successfully reset password for user {username}'))
        except User.DoesNotExist:
            self.stdout.write(self.style.ERROR(f'User {username} does not exist'))
