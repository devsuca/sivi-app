from django.contrib.auth.signals import user_logged_in, user_logged_out, user_login_failed
from django.dispatch import receiver
from .models import HistoricoAcessos

def get_client_ip(request):
    if not request:
        return '127.0.0.1'
    x_forwarded_for = request.META.get('HTTP_X_FORWARDED_FOR')
    if x_forwarded_for:
        ip = x_forwarded_for.split(',')[0]
    else:
        ip = request.META.get('REMOTE_ADDR')
    return ip

@receiver(user_logged_in)
def log_user_login(sender, request, user, **kwargs):
    HistoricoAcessos.objects.create(
        user=user,
        ip=get_client_ip(request),
        tipo_acao=HistoricoAcessos.TipoAcao.LOGIN,
        sucesso=True
    )

@receiver(user_logged_out)
def log_user_logout(sender, request, user, **kwargs):
    HistoricoAcessos.objects.create(
        user=user,
        ip=get_client_ip(request),
        tipo_acao=HistoricoAcessos.TipoAcao.LOGOUT,
        sucesso=True
    )

@receiver(user_login_failed)
def log_user_login_failed(sender, credentials, request, **kwargs):
    # For failed logins, 'user' is not available, so we log based on credentials if possible
    user = None
    if credentials and 'email' in credentials:
        from .models import Utilizador
        try:
            user = Utilizador.objects.get(email=credentials['email'])
        except Utilizador.DoesNotExist:
            pass

    HistoricoAcessos.objects.create(
        user=user,
        ip=get_client_ip(request),
        tipo_acao=HistoricoAcessos.TipoAcao.FALHA,
        sucesso=False
    )
