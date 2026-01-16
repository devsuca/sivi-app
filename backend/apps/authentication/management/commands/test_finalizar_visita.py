from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.visitas.models import Visita
from apps.pessoas.models import Visitante, Efetivo
from apps.core.models import Orgao
from apps.authentication.models import Perfil
from django.utils import timezone

User = get_user_model()

class Command(BaseCommand):
    help = 'Cria uma visita de teste para testar a funcionalidade de finalizar'

    def handle(self, *args, **options):
        # Obter ou criar órgão
        orgao, _ = Orgao.objects.get_or_create(
            nome='Órgão de Teste',
            defaults={'bloco': 'T', 'numero_porta': '001'}
        )
        
        # Obter ou criar visitante
        visitante, _ = Visitante.objects.get_or_create(
            nome='Visitante Teste',
            defaults={
                'documento_tipo': 'BI',
                'documento_numero': '123456789',
                'nacionalidade': 'Angolana'
            }
        )
        
        # Obter ou criar efetivo
        efetivo, _ = Efetivo.objects.get_or_create(
            nome_completo='Efetivo Teste',
            defaults={
                'numero_funcional': 'EFE001',
                'orgao': orgao
            }
        )
        
        # Criar visita em curso
        visita, created = Visita.objects.get_or_create(
            numero='TEST-001',
            defaults={
                'visitante': visitante,
                'efetivo_visitar': efetivo,
                'orgao': orgao,
                'motivo': 'Teste de finalização',
                'estado': Visita.EstadoVisita.EM_CURSO,
                'data_hora_entrada': timezone.now(),
                'observacoes': 'Visita criada para teste'
            }
        )
        
        if created:
            self.stdout.write(
                self.style.SUCCESS(f'Visita de teste criada: {visita.numero} (ID: {visita.id})')
            )
        else:
            self.stdout.write(
                self.style.WARNING(f'Visita de teste já existe: {visita.numero} (ID: {visita.id})')
            )
        
        # Mostrar informações da visita
        self.stdout.write('\n=== INFORMAÇÕES DA VISITA ===')
        self.stdout.write(f'ID: {visita.id}')
        self.stdout.write(f'Número: {visita.numero}')
        self.stdout.write(f'Estado: {visita.estado}')
        self.stdout.write(f'Visitante: {visita.visitante.nome}')
        self.stdout.write(f'Efetivo: {visita.efetivo_visitar.nome_completo}')
        self.stdout.write(f'Órgão: {visita.orgao.nome}')
        self.stdout.write(f'Motivo: {visita.motivo}')
        self.stdout.write(f'Data Entrada: {visita.data_hora_entrada}')
        self.stdout.write(f'Data Saída: {visita.data_hora_saida or "Não finalizada"}')
        
        # Mostrar usuários de teste
        self.stdout.write('\n=== USUÁRIOS PARA TESTE ===')
        self.stdout.write('Admin: admin / admin123')
        self.stdout.write('Portaria: portaria / portaria123')
        self.stdout.write('Recepção: recepcao1 / recepcao123')
        
        self.stdout.write('\n=== COMO TESTAR ===')
        self.stdout.write('1. Faça login com um dos usuários acima')
        self.stdout.write('2. Acesse http://localhost:3000/dashboard/visitas')
        self.stdout.write('3. Procure pela visita TEST-001')
        self.stdout.write('4. Clique no botão "Finalizar"')
        self.stdout.write('5. Confirme a finalização')
        
        self.stdout.write('\n=== LOGS PARA VERIFICAR ===')
        self.stdout.write('Verifique os logs do Django para ver as mensagens de debug')
        self.stdout.write('e identificar onde está ocorrendo o erro 400.')

