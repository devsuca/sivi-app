from rest_framework import viewsets, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Cracha
from .serializers import CrachaSerializer


class CrachaViewSet(viewsets.ModelViewSet):
    queryset = Cracha.objects.all()
    serializer_class = CrachaSerializer
    permission_classes = [IsAuthenticated]

    def create(self, request, *args, **kwargs):
        print(f"🔍 POST /crachas/ - Dados recebidos: {request.data}")
        print(f"🔍 Usuário: {request.user}")
        try:
            response = super().create(request, *args, **kwargs)
            print(f"✅ Crachá criado com sucesso: {response.data}")
            return response
        except Exception as e:
            print(f"❌ Erro ao criar crachá: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def update(self, request, *args, **kwargs):
        print(f"🔍 PUT /crachas/{kwargs.get('pk')}/ - Dados recebidos: {request.data}")
        try:
            response = super().update(request, *args, **kwargs)
            print(f"✅ Crachá atualizado com sucesso: {response.data}")
            return response
        except Exception as e:
            print(f"❌ Erro ao atualizar crachá: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    def destroy(self, request, *args, **kwargs):
        print(f"🔍 DELETE /crachas/{kwargs.get('pk')}/")
        try:
            response = super().destroy(request, *args, **kwargs)
            print(f"✅ Crachá excluído com sucesso")
            return response
        except Exception as e:
            print(f"❌ Erro ao excluir crachá: {e}")
            return Response(
                {'error': str(e)}, 
                status=status.HTTP_400_BAD_REQUEST
            )

    @action(detail=True, methods=['post'])
    def devolver(self, request, pk=None):
        """Marca o crachá como devolvido, removendo a associação à visita.
        O método save() do modelo já ajusta o estado para 'livre' quando visita=None.
        """
        cracha = self.get_object()
        cracha.visita = None
        cracha.save()
        return Response(CrachaSerializer(cracha).data, status=status.HTTP_200_OK)
