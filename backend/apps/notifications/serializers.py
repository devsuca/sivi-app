from rest_framework import serializers
from .models import DSINotification
from apps.core.serializers import OrgaoSerializer
from apps.pessoas.serializers import VisitanteSerializer
from apps.visitas.serializers import VisitaSerializer


class DSINotificationSerializer(serializers.ModelSerializer):
    """
    Serializer para notificações DSI
    """
    orgao_nome = serializers.CharField(source='orgao.nome', read_only=True)
    orgao_sigla = serializers.CharField(source='orgao.sigla', read_only=True)
    enviado_por_nome = serializers.CharField(source='enviado_por.nome', read_only=True)
    processado_por_nome = serializers.CharField(source='processado_por.nome', read_only=True)
    time_since_created = serializers.CharField(read_only=True)
    
    class Meta:
        model = DSINotification
        fields = [
            'id',
            'visitante',
            'visita',
            'orgao',
            'orgao_nome',
            'orgao_sigla',
            'nome_pessoa',
            'data_visita',
            'hora_visita',
            'observacoes',
            'urgencia',
            'enviado_por',
            'enviado_por_nome',
            'data_envio',
            'status',
            'processado_por',
            'processado_por_nome',
            'data_processamento',
            'time_since_created',
            'created_at',
            'updated_at'
        ]
        read_only_fields = [
            'id',
            'data_envio',
            'data_processamento',
            'created_at',
            'updated_at'
        ]
    
    def validate_urgencia(self, value):
        """
        Validar urgência da notificação
        """
        if value not in ['baixa', 'media', 'alta']:
            raise serializers.ValidationError("Urgência deve ser 'baixa', 'media' ou 'alta'")
        return value
    
    def validate_status(self, value):
        """
        Validar status da notificação
        """
        if value not in ['pendente', 'visualizada', 'processada']:
            raise serializers.ValidationError("Status deve ser 'pendente', 'visualizada' ou 'processada'")
        return value


class DSINotificationCreateSerializer(serializers.ModelSerializer):
    """
    Serializer para criação de notificações DSI
    """
    class Meta:
        model = DSINotification
        fields = [
            'visitante',
            'visita',
            'orgao',
            'nome_pessoa',
            'data_visita',
            'hora_visita',
            'observacoes',
            'urgencia'
        ]
    
    def create(self, validated_data):
        """
        Criar notificação e definir o usuário que enviou
        """
        request = self.context.get('request')
        if request and hasattr(request, 'user'):
            validated_data['enviado_por'] = request.user
        
        return super().create(validated_data)


class DSINotificationUpdateSerializer(serializers.ModelSerializer):
    """
    Serializer para atualização de notificações DSI
    """
    class Meta:
        model = DSINotification
        fields = ['status', 'observacoes']
    
    def update(self, instance, validated_data):
        """
        Atualizar notificação e definir quem processou
        """
        request = self.context.get('request')
        
        # Se está sendo processada, definir quem processou
        if validated_data.get('status') == 'processada' and request and hasattr(request, 'user'):
            validated_data['processado_por'] = request.user
        
        return super().update(instance, validated_data)


class DSINotificationListSerializer(serializers.ModelSerializer):
    """
    Serializer simplificado para listagem de notificações
    """
    orgao = serializers.CharField(source='orgao.nome', read_only=True)
    enviado_por = serializers.CharField(source='enviado_por.nome', read_only=True)
    time_since_created = serializers.CharField(read_only=True)
    
    class Meta:
        model = DSINotification
        fields = [
            'id',
            'nome_pessoa',
            'data_visita',
            'hora_visita',
            'orgao',
            'urgencia',
            'enviado_por',
            'data_envio',
            'status',
            'time_since_created'
        ]
