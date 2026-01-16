from rest_framework import serializers
from .models import Perfil
from apps.pessoas.models import Efetivo
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer
from django.contrib.auth import get_user_model

import logging

logger = logging.getLogger(__name__)

class MyTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)

        # Add custom claims
        token['username'] = user.username
        try:
            token['role'] = user.role
        except AttributeError:
            token['role'] = None

        return token

class PerfilSerializer(serializers.ModelSerializer):
    class Meta:
        model = Perfil
        fields = '__all__'



class ChangePasswordSerializer(serializers.Serializer):
    old_password = serializers.CharField(required=True)
    new_password = serializers.CharField(required=True)
    confirm_password = serializers.CharField(required=True, label='Confirm new password')

    def validate(self, data):
        if data['new_password'] != data['confirm_password']:
            raise serializers.ValidationError({"new_password": "New password fields didn't match."})
        return data

# Serializer para autenticação por email
from django.contrib.auth import authenticate
class EmailTokenObtainSerializer(TokenObtainPairSerializer):
    username_field = get_user_model().USERNAME_FIELD

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.fields.pop(self.username_field, None)
        self.fields['email'] = serializers.EmailField()
        self.fields['password'] = serializers.CharField(write_only=True)

    def validate(self, attrs):
        email = attrs.get('email')
        password = attrs.get('password')
        logger.info(f"Attempting to authenticate user with email: {email}")
        if email and password:
            User = get_user_model()
            logger.info(f"Using User model: {User}")
            logger.info(f"All users in database: {[u.email for u in User.objects.all()]}")
            try:
                user = User.objects.get(email=email)
                logger.info(f"User found with username: {user.username}")
            except User.DoesNotExist:
                logger.warning(f"User with email {email} not found.")
                raise serializers.ValidationError({'email': 'Usuário com este email não existe.'})
            
            if not user.is_active:
                logger.warning(f"User {user.username} is not active.")
                raise serializers.ValidationError('User account is disabled.')

            user_auth = authenticate(request=self.context.get('request'), username=user.username, password=password)
            
            if not user_auth:
                logger.warning(f"Authentication failed for user {user.username}.")
                raise serializers.ValidationError('Incorrect password.')
            
            logger.info(f"User {user.username} authenticated successfully.")
            attrs['user'] = user_auth
            attrs[self.username_field] = user.get_username()

        else:
            raise serializers.ValidationError({'email': 'Email e senha são obrigatórios.'})
        
        return attrs

    @classmethod
    def get_token(cls, user):
        try:
            token = super().get_token(user)

            # Add custom claims
            token['username'] = user.username
            try:
                token['role'] = user.perfil.nivel_acesso
            except AttributeError:
                token['role'] = None

            return token
        except Exception as e:
            logger.error(f"Erro ao gerar token para usuário {user.username}: {str(e)}")
            raise
