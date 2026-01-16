from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import HttpResponse, Http404
from django.core.files.storage import default_storage
from django.core.files.base import ContentFile
from .models import ConfiguracaoSistema
from .serializers import ConfiguracaoSistemaSerializer

class ConfiguracaoSistemaViewSet(viewsets.ModelViewSet):
    queryset = ConfiguracaoSistema.objects.all()
    serializer_class = ConfiguracaoSistemaSerializer
    permission_classes = [permissions.IsAdminUser]

    @action(detail=False, methods=['post'], url_path='manual/upload')
    def upload_manual(self, request):
        """Upload do manual do utilizador"""
        if 'ficheiro' not in request.FILES:
            return Response(
                {'error': 'Nenhum ficheiro foi enviado'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        ficheiro = request.FILES['ficheiro']
        
        # Validar se é PDF
        if not ficheiro.name.lower().endswith('.pdf'):
            return Response(
                {'error': 'O ficheiro deve ser um PDF'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Obter ou criar configuração para o manual
        config, created = ConfiguracaoSistema.objects.get_or_create(
            chave='manual_utilizador',
            defaults={
                'valor': 'Manual do Utilizador',
                'tipo': 'outro',
                'descricao': 'Manual do utilizador do sistema',
                'ativo': True
            }
        )
        
        # Salvar o ficheiro
        config.manual_utilizador = ficheiro
        config.save()
        
        return Response({
            'message': 'Manual do utilizador atualizado com sucesso',
            'filename': ficheiro.name,
            'size': ficheiro.size
        }, status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], url_path='manual/download', permission_classes=[])
    def download_manual(self, request):
        """Download do manual do utilizador"""
        try:
            config = ConfiguracaoSistema.objects.get(chave='manual_utilizador')
            if not config.manual_utilizador:
                raise Http404("Manual não encontrado")
            
            response = HttpResponse(
                config.manual_utilizador.read(),
                content_type='application/pdf'
            )
            response['Content-Disposition'] = f'attachment; filename="{config.manual_utilizador.name}"'
            return response
            
        except ConfiguracaoSistema.DoesNotExist:
            raise Http404("Manual não encontrado")
