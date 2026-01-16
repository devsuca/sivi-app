from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Usuario
from .serializers import UsuarioSerializer
from rest_framework.permissions import IsAdminUser, IsAuthenticated

class UsuarioViewSet(viewsets.ModelViewSet):
    queryset = Usuario.objects.all()
    serializer_class = UsuarioSerializer
    permission_classes = [IsAdminUser]

    @action(detail=False, methods=['get'], url_path='nao-associados', permission_classes=[IsAuthenticated])
    def nao_associados(self, request):
        """
        Retorna uma lista de usuários que ainda não estão associados a um efetivo.
        """
        usuarios_sem_efetivo = Usuario.objects.filter(efetivo__isnull=True, is_active=True)
        serializer = self.get_serializer(usuarios_sem_efetivo, many=True)
        return Response(serializer.data)
