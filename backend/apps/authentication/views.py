from rest_framework import viewsets
from rest_framework.permissions import IsAdminUser
from drf_spectacular.utils import extend_schema
from apps.atendimento.models import Atendimento
from apps.atendimento.serializers import AtendimentoSerializer

@extend_schema(tags=['Gestão de Atendimento'])
class AtendimentoViewSet(viewsets.ModelViewSet):
    queryset = Atendimento.objects.all()
    serializer_class = AtendimentoSerializer
    permission_classes = [IsAdminUser] # Only admin can manage atendimentos

from rest_framework import generics, status, viewsets
from rest_framework.permissions import IsAuthenticated, IsAdminUser
from rest_framework.response import Response
import logging

logger = logging.getLogger(__name__)
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from django.contrib.auth import authenticate
from .serializers import EmailTokenObtainSerializer, PerfilSerializer, ChangePasswordSerializer
from .models import Perfil
from .permissions import IsAdmin
from apps.crachas.models import Cracha
from apps.crachas.serializers import CrachaSerializer

@extend_schema(tags=['Gestão de Crachás'])
class CrachaViewSet(viewsets.ModelViewSet):
    queryset = Cracha.objects.all()
    serializer_class = CrachaSerializer
    permission_classes = [IsAdminUser] # Only admin can manage crachás

# Custom JWT view para aceitar email
class CustomTokenObtainPairView(TokenObtainPairView):
    serializer_class = EmailTokenObtainSerializer
    
    def post(self, request, *args, **kwargs):
        try:
            return super().post(request, *args, **kwargs)
        except Exception as e:
            logger.error(f"Erro no CustomTokenObtainPairView: {str(e)}")
            return Response(
                {'error': f'Erro interno: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

# Endpoint para retornar dados do usuário logado
class MeView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        perfil = getattr(user, 'perfil', None)
        efetivo = getattr(user, 'efetivo', None)
        responsavel_nome = ''
        if hasattr(perfil, 'responsavel') and perfil.responsavel:
            responsavel = perfil.responsavel
            responsavel_nome = getattr(responsavel, 'nome_completo', str(responsavel))
        return Response({
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'nome': getattr(user, 'nome', ''),
            'nome_completo': getattr(efetivo, 'nome_completo', ''),
            'perfil': {
                'id': perfil.id if perfil else None,
                'nome': perfil.nome if perfil else '',
                'nivel_acesso': perfil.nivel_acesso if perfil else '',
            },
            'orgao': {
                'id': user.orgao.id if user.orgao else None,
                'nome': user.orgao.nome if user.orgao else '',
            },
            'is_active': user.is_active,
            'date_joined': user.date_joined.isoformat() if user.date_joined else '',
            'last_login': user.last_login.isoformat() if user.last_login else None,
            'role': getattr(perfil, 'nivel_acesso', ''),
            'responsavel': responsavel_nome,
        })

# View para autenticação por email
class EmailTokenObtainView(APIView):
    def post(self, request):
        serializer = EmailTokenObtainSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.validated_data['user']
            # Aqui você pode gerar o token JWT ou session normalmente
            # Exemplo: usando SimpleJWT
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken.for_user(user)
            return Response({
                'refresh': str(refresh),
                'access': str(refresh.access_token),
                'user_id': user.id,
                'email': user.email,
                'username': user.username,
            })
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@extend_schema(tags=['Gestão de Utilizadores'])
class PerfilViewSet(viewsets.ModelViewSet):
    queryset = Perfil.objects.all()
    permission_classes = [IsAuthenticated] # Allow authenticated users to view profiles

    def get_serializer_class(self):
        return PerfilSerializer

    def list(self, request, *args, **kwargs):
        response = super().list(request, *args, **kwargs)
        # Adiciona o nome do responsável no campo 'responsavel_nome' para cada perfil
        if hasattr(response.data, 'results'):
            # Paginated response
            for item in response.data['results']:
                responsavel_id = item.get('responsavel')
                responsavel_nome = ''
                if responsavel_id:
                    from .models import Perfil
                    try:
                        responsavel = Perfil.objects.get(pk=responsavel_id)
                        responsavel_nome = getattr(responsavel, 'nome_completo', str(responsavel))
                    except Perfil.DoesNotExist:
                        responsavel_nome = ''
                item['responsavel_nome'] = responsavel_nome
        elif isinstance(response.data, list):
            # Direct list response
            for item in response.data:
                responsavel_id = item.get('responsavel')
                responsavel_nome = ''
                if responsavel_id:
                    from .models import Perfil
                    try:
                        responsavel = Perfil.objects.get(pk=responsavel_id)
                        responsavel_nome = getattr(responsavel, 'nome_completo', str(responsavel))
                    except Perfil.DoesNotExist:
                        responsavel_nome = ''
                item['responsavel_nome'] = responsavel_nome
        return response

# View para alterar senha
class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            old_password = serializer.validated_data['old_password']
            new_password = serializer.validated_data['new_password']
            
            # Verificar se a senha atual está correta
            if not authenticate(username=user.username, password=old_password):
                return Response(
                    {'detail': 'Senha atual incorreta.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Alterar a senha
            user.set_password(new_password)
            user.save()
            
            return Response(
                {'detail': 'Senha alterada com sucesso.'}, 
                status=status.HTTP_200_OK
            )
        
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# View para o usuário editar seu próprio perfil
class UpdateProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def put(self, request):
        user = request.user
        data = request.data
        
        # Campos permitidos para edição pelo próprio usuário
        allowed_fields = ['nome', 'email', 'username']
        update_data = {field: data.get(field) for field in allowed_fields if field in data}
        
        # Validar email único se foi alterado
        if 'email' in update_data and update_data['email'] != user.email:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(email=update_data['email']).exclude(id=user.id).exists():
                return Response(
                    {'email': 'Este email já está em uso.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Validar username único se foi alterado
        if 'username' in update_data and update_data['username'] != user.username:
            from django.contrib.auth import get_user_model
            User = get_user_model()
            if User.objects.filter(username=update_data['username']).exclude(id=user.id).exists():
                return Response(
                    {'username': 'Este nome de usuário já está em uso.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
        
        # Atualizar campos permitidos
        for field, value in update_data.items():
            setattr(user, field, value)
        
        user.save()
        
        # Atualizar efetivo relacionado se existir
        if hasattr(user, 'efetivo'):
            efetivo = user.efetivo
            if 'nome' in update_data:
                efetivo.nome_completo = update_data['nome']
            if 'email' in update_data:
                efetivo.email = update_data['email']
            efetivo.save()
        
        return Response({
            'detail': 'Perfil atualizado com sucesso.',
            'user': {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'nome': user.nome,
            }
        }, status=status.HTTP_200_OK)