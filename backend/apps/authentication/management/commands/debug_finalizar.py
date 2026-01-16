from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.visitas.models import Visita
from apps.authentication.mixins import OrgaoAccessMixin
from django.test import RequestFactory

User = get_user_model()

class Command(BaseCommand):
    help = 'Debug da funcionalidade de finalizar visitas'

    def handle(self, *args, **options):
        # Criar um request factory para simular requisições
        factory = RequestFactory()
        
        # Obter uma visita em curso
        visita = Visita.objects.filter(estado=Visita.EstadoVisita.EM_CURSO).first()
        
        if not visita:
            self.stdout.write(
                self.style.ERROR('Nenhuma visita em curso encontrada. Crie uma visita primeiro.')
            )
            return
        
        self.stdout.write(f'Testando finalização da visita: {visita.numero} (ID: {visita.id})')
        self.stdout.write(f'Órgão da visita: {visita.orgao}')
        self.stdout.write(f'Estado atual: {visita.estado}')
        
        # Testar com diferentes usuários
        usuarios_teste = [
            ('admin', 'admin'),
            ('portaria', 'portaria'),
            ('recepcao1', 'recepcao1'),
        ]
        
        mixin = OrgaoAccessMixin()
        
        for username, _ in usuarios_teste:
            try:
                user = User.objects.get(username=username)
                self.stdout.write(f'\n--- Testando com usuário: {username} ---')
                self.stdout.write(f'Perfil: {user.perfil.nivel_acesso if user.perfil else "Sem perfil"}')
                
                if user.perfil:
                    if user.perfil.nivel_acesso == 'recepcao':
                        user_orgao = getattr(user, 'orgao', None)
                        self.stdout.write(f'Órgão do usuário: {user_orgao}')
                        self.stdout.write(f'Órgão da visita: {visita.orgao}')
                        self.stdout.write(f'Acesso permitido: {user_orgao == visita.orgao}')
                    else:
                        self.stdout.write(f'Acesso permitido: Sim (perfil {user.perfil.nivel_acesso})')
                
                # Testar validação de acesso
                try:
                    mixin.validate_orgao_access(user, visita.orgao)
                    self.stdout.write(self.style.SUCCESS('✓ Validação de acesso: OK'))
                except Exception as e:
                    self.stdout.write(self.style.ERROR(f'✗ Validação de acesso: {str(e)}'))
                    
            except User.DoesNotExist:
                self.stdout.write(self.style.WARNING(f'Usuário {username} não encontrado'))
        
        self.stdout.write('\n=== INFORMAÇÕES DA VISITA ===')
        self.stdout.write(f'ID: {visita.id}')
        self.stdout.write(f'Número: {visita.numero}')
        self.stdout.write(f'Visitante: {visita.visitante}')
        self.stdout.write(f'Efetivo: {visita.efetivo_visitar}')
        self.stdout.write(f'Órgão: {visita.orgao}')
        self.stdout.write(f'Estado: {visita.estado}')
        self.stdout.write(f'Data Entrada: {visita.data_hora_entrada}')
        self.stdout.write(f'Data Saída: {visita.data_hora_saida}')
        
        # Verificar crachás associados
        from apps.crachas.models import Cracha
        crachas = Cracha.objects.filter(visita=visita)
        self.stdout.write(f'Crachás associados: {crachas.count()}')
        for cracha in crachas:
            self.stdout.write(f'  - {cracha.numero}')

