from rest_framework import serializers
from .models import Visitante, Efetivo
from django.contrib.auth import get_user_model

class MiniVisitanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Visitante
        fields = ['id', 'nome', 'documento_numero', 'documento_tipo', 'email', 'telefone']

class VisitanteSerializer(serializers.ModelSerializer):
    # Campo adicional para compatibilidade com frontend
    nome_completo = serializers.CharField(write_only=True, required=False, allow_blank=True)
    documento = serializers.CharField(write_only=True, required=False, allow_blank=True, source='documento_numero')
    tipo_documento = serializers.CharField(write_only=True, required=False, allow_blank=True, source='documento_tipo')
    
    # Detalhes do representante (read-only)
    representante_details = MiniVisitanteSerializer(source='representante', read_only=True)
    
    class Meta:
        model = Visitante
        fields = [
            'id', 'tipo_pessoa', 'nome', 'genero', 'data_nascimento',
            'designacao_social', 'representante', 'representante_details', 'documento_tipo',
            'documento_numero', 'documento_validade', 'documento_emissao',
            'nacionalidade', 'provincia_nascimento', 'estado_civil', 'nif',
            'email', 'telefone', 'endereco', 'foto', 'observacoes',
            'registado_por', 'data_registo', 'ativo',
            # Campos adicionais para compatibilidade
            'nome_completo', 'documento', 'tipo_documento'
        ]
        read_only_fields = ('registado_por', 'data_registo', 'representante_details')
    
    def create(self, validated_data):
        # Mapear nome_completo para nome se fornecido
        if 'nome_completo' in validated_data and validated_data['nome_completo']:
            validated_data['nome'] = validated_data.pop('nome_completo')
        
        # Garantir que o usuário atual seja definido como registado_por
        request = self.context.get('request')
        if request and hasattr(request, 'user') and request.user.is_authenticated:
            validated_data['registado_por'] = request.user
        
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        # Mapear nome_completo para nome se fornecido
        if 'nome_completo' in validated_data and validated_data['nome_completo']:
            validated_data['nome'] = validated_data.pop('nome_completo')
        
        return super().update(instance, validated_data)

class DocumentValidationSerializer(serializers.ModelSerializer):
    """
    Serializer específico para validação de documentos
    Retorna apenas os campos essenciais para o leitor de QR Code
    """
    nome_completo = serializers.SerializerMethodField()
    
    class Meta:
        model = Visitante
        fields = [
            'id', 'nome_completo', 'documento_tipo', 'documento_numero',
            'nacionalidade', 'data_nascimento', 'genero', 'email', 'telefone',
            'provincia_nascimento', 'estado_civil', 'documento_emissao', 'documento_validade'
        ]
    
    def get_nome_completo(self, obj):
        """Retorna o nome completo baseado no tipo de pessoa"""
        if obj.tipo_pessoa == Visitante.TipoPessoa.SINGULAR:
            return obj.nome
        else:
            return obj.designacao_social

class EfetivoSerializer(serializers.ModelSerializer):
    # Permitir associar a um usuário existente
    usuario = serializers.PrimaryKeyRelatedField(
        queryset=get_user_model().objects.all(), required=False, allow_null=True
    )

    class Meta:
        model = Efetivo
        fields = (
            'id', 'nome_completo', 'numero_funcional', 'tipo', 'orgao',
            'email', 'telefone', 'ativo', 'usuario'
        )

    def validate(self, attrs):
        tipo = attrs.get('tipo') or getattr(self.instance, 'tipo', None)
        usuario = attrs.get('usuario')

        # Para efetivo interno, usuario é recomendado/permitido
        if tipo == Efetivo.TipoEfetivo.INTERNO:
            # Se informar usuario, garanta que não esteja já associado
            if usuario is not None:
                existing = getattr(usuario, 'efetivo', None)
                if existing and (not self.instance or existing.id != self.instance.id):
                    raise serializers.ValidationError({'usuario': 'Este usuário já está associado a um efetivo.'})
        return attrs

    def create(self, validated_data):
        return super().create(validated_data)

    def update(self, instance, validated_data):
        return super().update(instance, validated_data)
