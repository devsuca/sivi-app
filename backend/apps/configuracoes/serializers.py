from rest_framework import serializers
from .models import ConfiguracaoSistema

class ConfiguracaoSistemaSerializer(serializers.ModelSerializer):
    logotipo = serializers.ImageField(required=False, allow_null=True)
    manual_utilizador = serializers.FileField(required=False, allow_null=True)
    
    class Meta:
        model = ConfiguracaoSistema
        fields = ['id', 'chave', 'valor', 'tipo', 'descricao', 'ativo', 'logotipo', 'manual_utilizador']