from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.core.models import LogSistema
from datetime import datetime, timedelta
import random

User = get_user_model()

class Command(BaseCommand):
    help = 'Cria logs de auditoria de exemplo para teste'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=50,
            help='Número de logs a criar (padrão: 50)'
        )

    def handle(self, *args, **options):
        count = options['count']
        
        # Obter usuários existentes
        users = list(User.objects.all())
        if not users:
            self.stdout.write(
                self.style.ERROR('Nenhum usuário encontrado. Crie usuários primeiro.')
            )
            return
        
        # Dados de exemplo
        entidades = ['User', 'Visitante', 'Visita', 'Orgao', 'Acesso', 'Pertence']
        acoes = ['create', 'update', 'delete', 'login', 'logout', 'view']
        
        # Criar logs
        logs_criados = 0
        for i in range(count):
            # Data aleatória nos últimos 30 dias
            data_hora = datetime.now() - timedelta(
                days=random.randint(0, 30),
                hours=random.randint(0, 23),
                minutes=random.randint(0, 59)
            )
            
            entidade = random.choice(entidades)
            acao = random.choice(acoes)
            usuario = random.choice(users)
            
            # Dados de exemplo
            dados_anteriores = None
            dados_novos = None
            
            if acao == 'update':
                dados_anteriores = {
                    'nome': f'Nome Antigo {i}',
                    'status': 'inativo'
                }
                dados_novos = {
                    'nome': f'Nome Novo {i}',
                    'status': 'ativo'
                }
            elif acao == 'create':
                dados_novos = {
                    'nome': f'Novo Item {i}',
                    'status': 'ativo',
                    'criado_por': usuario.username
                }
            elif acao == 'delete':
                dados_anteriores = {
                    'nome': f'Item Removido {i}',
                    'status': 'ativo'
                }
            
            log = LogSistema.objects.create(
                entidade=entidade,
                acao=acao,
                user=usuario,
                data_hora=data_hora,
                dados_anteriores=dados_anteriores,
                dados_novos=dados_novos
            )
            
            logs_criados += 1
            
            if logs_criados % 10 == 0:
                self.stdout.write(f'Criados {logs_criados} logs...')
        
        self.stdout.write(
            self.style.SUCCESS(f'Sucesso! {logs_criados} logs de auditoria criados.')
        )
