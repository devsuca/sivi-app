from django.apps import AppConfig


class PertencesConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.pertences'

    def ready(self):
        import apps.pertences.signals  # noqa
