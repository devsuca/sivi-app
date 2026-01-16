from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.tickets.models import Ticket, TicketComment, TicketTemplate
from apps.authentication.models import Perfil
import random
from datetime import datetime, timedelta
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Cria tickets de exemplo para testes'

    def add_arguments(self, parser):
        parser.add_argument(
            '--count',
            type=int,
            default=10,
            help='Número de tickets a criar'
        )

    def handle(self, *args, **options):
        count = options['count']

        # Obter usuários
        users = User.objects.filter(is_active=True)
        if not users.exists():
            self.stdout.write(
                self.style.ERROR('Nenhum usuário encontrado. Crie usuários primeiro.')
            )
            return

        # Obter perfil de suporte
        try:
            perfil_suporte = Perfil.objects.get(nivel_acesso='suporte')
            suporte_users = User.objects.filter(perfil=perfil_suporte)
        except Perfil.DoesNotExist:
            suporte_users = User.objects.filter(is_staff=True)

        if not suporte_users.exists():
            self.stdout.write(
                self.style.ERROR('Nenhum usuário de suporte encontrado.')
            )
            return

        # Dados de exemplo
        categorias = ['geral', 'tecnico', 'usuario', 'sistema', 'seguranca', 'melhoria']
        prioridades = ['baixa', 'media', 'alta', 'urgente']
        status_list = ['aberto', 'em_andamento', 'aguardando_usuario', 'resolvido', 'fechado']
        
        titulos = [
            'Erro ao fazer login no sistema',
            'Problema com upload de arquivos',
            'Relatório não está gerando corretamente',
            'Dúvida sobre como usar o QR Code',
            'Sistema está lento',
            'Não consigo acessar minha conta',
            'Erro na impressão de crachás',
            'Como alterar minha senha?',
            'Problema com notificações',
            'Sugestão de melhoria na interface',
            'Erro ao finalizar visita',
            'Dados não estão sendo salvos',
            'Problema com backup',
            'Como exportar relatórios?',
            'Sistema fora do ar'
        ]

        descricoes = [
            'Estou enfrentando problemas para fazer login no sistema. A senha não está sendo aceita.',
            'Quando tento fazer upload de um arquivo, o sistema apresenta erro.',
            'Os relatórios não estão sendo gerados com os dados corretos.',
            'Preciso de ajuda para usar o leitor de QR Code.',
            'O sistema está muito lento, demora para carregar as páginas.',
            'Não consigo acessar minha conta, mesmo com a senha correta.',
            'Os crachás não estão sendo impressos corretamente.',
            'Gostaria de saber como alterar minha senha de acesso.',
            'Não estou recebendo as notificações do sistema.',
            'Sugiro melhorar a interface do sistema para facilitar o uso.',
            'Erro ao tentar finalizar uma visita em andamento.',
            'Os dados que insiro não estão sendo salvos no sistema.',
            'Problema com o backup automático do sistema.',
            'Como posso exportar os relatórios para Excel?',
            'O sistema está fora do ar desde ontem.'
        ]

        tags_examples = [
            ['login', 'erro'],
            ['upload', 'arquivo'],
            ['relatorio', 'dados'],
            ['qr-code', 'ajuda'],
            ['performance', 'lentidao'],
            ['acesso', 'conta'],
            ['impressao', 'cracha'],
            ['senha', 'seguranca'],
            ['notificacao', 'email'],
            ['interface', 'melhoria'],
            ['visita', 'finalizar'],
            ['dados', 'salvar'],
            ['backup', 'sistema'],
            ['exportar', 'excel'],
            ['sistema', 'fora-ar']
        ]

        created_count = 0

        for i in range(count):
            try:
                # Dados aleatórios
                titulo = random.choice(titulos)
                descricao = random.choice(descricoes)
                categoria = random.choice(categorias)
                prioridade = random.choice(prioridades)
                status = random.choice(status_list)
                solicitante = random.choice(users)
                atribuido_para = random.choice(suporte_users) if random.choice([True, False]) else None
                
                # Criar ticket
                ticket = Ticket.objects.create(
                    titulo=titulo,
                    descricao=descricao,
                    categoria=categoria,
                    prioridade=prioridade,
                    status=status,
                    solicitante=solicitante,
                    atribuido_para=atribuido_para,
                    tags=random.choice(tags_examples)
                )

                # Adicionar comentários aleatórios
                num_comentarios = random.randint(0, 3)
                for j in range(num_comentarios):
                    comentario_texto = f"Comentário {j+1} do ticket {ticket.numero}"
                    autor = random.choice([solicitante, atribuido_para] if atribuido_para else [solicitante])
                    
                    TicketComment.objects.create(
                        ticket=ticket,
                        autor=autor,
                        comentario=comentario_texto,
                        interno=random.choice([True, False])
                    )

                # Se o ticket está resolvido ou fechado, definir data de resolução
                if status in ['resolvido', 'fechado']:
                    ticket.data_resolucao = timezone.now() - timedelta(hours=random.randint(1, 72))
                    if status == 'fechado':
                        ticket.data_fechamento = ticket.data_resolucao + timedelta(hours=random.randint(1, 24))
                    ticket.save()

                created_count += 1
                
            except Exception as e:
                self.stdout.write(
                    self.style.WARNING(f'Erro ao criar ticket {i+1}: {str(e)}')
                )
                continue

        self.stdout.write(
            self.style.SUCCESS(
                f'{created_count} tickets de exemplo criados com sucesso!'
            )
        )
