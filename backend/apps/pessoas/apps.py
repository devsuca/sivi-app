from django.apps import AppConfig

class PessoasConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pessoas'

    def ready(self):
        import apps.pessoas.signals  # noqa
