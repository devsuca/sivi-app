from rest_framework import serializers
from .models import Usuario
from apps.pessoas.models import Efetivo

class UsuarioSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, required=False)
    perfil_nome = serializers.CharField(source='perfil.nome', read_only=True)
    orgao_nome = serializers.CharField(source='orgao.nome', read_only=True)

    class Meta:
        model = Usuario
        fields = (
            'id', 'username', 'email', 'nome',
            'perfil', 'perfil_nome',
            'orgao', 'orgao_nome',
            'is_active', 'password'
        )

    def create(self, validated_data):
        password = validated_data.pop('password', None)
        user = super().create(validated_data)
        if password:
            user.set_password(password)
            user.save()

        if not hasattr(user, 'efetivo'):
            Efetivo.objects.create(
                usuario=user,
                nome_completo=user.nome,
                email=user.email,
                orgao=user.orgao,
                ativo=user.is_active
            )
        return user

    def update(self, instance, validated_data):
        password = validated_data.pop('password', None)
        user = super().update(instance, validated_data)

        if password:
            user.set_password(password)
            user.save()

        efetivo, created = Efetivo.objects.update_or_create(
            usuario=user,
            defaults={
                'nome_completo': user.nome,
                'email': user.email,
                'orgao': user.orgao,
                'ativo': user.is_active
            }
        )
        return user