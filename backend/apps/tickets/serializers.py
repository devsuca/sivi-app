from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Ticket, TicketComment, TicketAttachment, TicketTemplate

User = get_user_model()

class UserBasicSerializer(serializers.ModelSerializer):
    """Serializer básico para informações do usuário"""
    class Meta:
        model = User
        fields = ['id', 'username', 'first_name', 'last_name', 'email']

class TicketAttachmentSerializer(serializers.ModelSerializer):
    upload_por = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = TicketAttachment
        fields = [
            'id', 'arquivo', 'nome_original', 'tamanho', 
            'tipo_mime', 'data_upload', 'upload_por'
        ]
        read_only_fields = ['id', 'tamanho', 'tipo_mime', 'data_upload', 'upload_por']

class TicketCommentSerializer(serializers.ModelSerializer):
    autor = UserBasicSerializer(read_only=True)
    
    class Meta:
        model = TicketComment
        fields = [
            'id', 'comentario', 'data_criacao', 'data_atualizacao',
            'autor', 'interno'
        ]
        read_only_fields = ['id', 'data_criacao', 'data_atualizacao', 'autor']

class TicketListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de tickets (dados resumidos)"""
    solicitante = UserBasicSerializer(read_only=True)
    atribuido_para = UserBasicSerializer(read_only=True)
    tempo_resolucao_horas = serializers.SerializerMethodField()
    total_comentarios = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'numero', 'titulo', 'categoria', 'prioridade', 'status',
            'solicitante', 'atribuido_para', 'data_criacao', 'data_atualizacao',
            'data_resolucao', 'tempo_resolucao_horas', 'total_comentarios', 'tags'
        ]
    
    def get_tempo_resolucao_horas(self, obj):
        return obj.calcular_tempo_resolucao()
    
    def get_total_comentarios(self, obj):
        return obj.comentarios.count()

class TicketDetailSerializer(serializers.ModelSerializer):
    """Serializer para detalhes completos do ticket"""
    solicitante = UserBasicSerializer(read_only=True)
    atribuido_para = UserBasicSerializer(read_only=True)
    comentarios = TicketCommentSerializer(many=True, read_only=True)
    anexos = TicketAttachmentSerializer(many=True, read_only=True)
    tempo_resolucao_horas = serializers.SerializerMethodField()
    pode_editar = serializers.SerializerMethodField()
    pode_fechar = serializers.SerializerMethodField()
    
    class Meta:
        model = Ticket
        fields = [
            'id', 'numero', 'titulo', 'descricao', 'categoria', 'prioridade', 'status',
            'solicitante', 'atribuido_para', 'data_criacao', 'data_atualizacao',
            'data_resolucao', 'data_fechamento', 'tempo_resolucao_horas',
            'satisfacao_usuario', 'comentario_satisfacao', 'tags',
            'comentarios', 'anexos', 'pode_editar', 'pode_fechar'
        ]
        read_only_fields = [
            'id', 'numero', 'data_criacao', 'data_atualizacao',
            'tempo_resolucao_horas', 'pode_editar', 'pode_fechar'
        ]
    
    def get_tempo_resolucao_horas(self, obj):
        return obj.calcular_tempo_resolucao()
    
    def get_pode_editar(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.pode_ser_editado_por(request.user)
        return False
    
    def get_pode_fechar(self, obj):
        request = self.context.get('request')
        if request and request.user:
            return obj.pode_ser_fechado_por(request.user)
        return False

class TicketCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de tickets"""
    
    class Meta:
        model = Ticket
        fields = [
            'titulo', 'descricao', 'categoria', 'prioridade', 'tags'
        ]
    
    def create(self, validated_data):
        # O solicitante é definido automaticamente como o usuário logado
        validated_data['solicitante'] = self.context['request'].user
        return super().create(validated_data)

class TicketUpdateSerializer(serializers.ModelSerializer):
    """Serializer para atualização de tickets"""
    
    class Meta:
        model = Ticket
        fields = [
            'titulo', 'descricao', 'categoria', 'prioridade', 'status',
            'atribuido_para', 'tags'
        ]
    
    def validate_status(self, value):
        """Validação para mudanças de status"""
        instance = self.instance
        if instance and value == Ticket.Status.RESOLVIDO:
            # Se está sendo marcado como resolvido, define a data de resolução
            from django.utils import timezone
            if not instance.data_resolucao:
                instance.data_resolucao = timezone.now()
        elif instance and value == Ticket.Status.FECHADO:
            # Se está sendo fechado, define a data de fechamento
            from django.utils import timezone
            if not instance.data_fechamento:
                instance.data_fechamento = timezone.now()
        return value

class TicketCommentCreateSerializer(serializers.ModelSerializer):
    """Serializer para criação de comentários"""
    
    class Meta:
        model = TicketComment
        fields = ['comentario', 'interno']
    
    def create(self, validated_data):
        validated_data['autor'] = self.context['request'].user
        validated_data['ticket'] = self.context['ticket']
        return super().create(validated_data)

class TicketAttachmentCreateSerializer(serializers.ModelSerializer):
    """Serializer para upload de anexos"""
    
    class Meta:
        model = TicketAttachment
        fields = ['arquivo']
    
    def create(self, validated_data):
        validated_data['upload_por'] = self.context['request'].user
        validated_data['ticket'] = self.context['ticket']
        return super().create(validated_data)

class TicketTemplateSerializer(serializers.ModelSerializer):
    """Serializer para templates de tickets"""
    
    class Meta:
        model = TicketTemplate
        fields = [
            'id', 'nome', 'categoria', 'prioridade', 'titulo_template',
            'descricao_template', 'tags', 'ativo'
        ]

class TicketStatsSerializer(serializers.Serializer):
    """Serializer para estatísticas de tickets"""
    total_tickets = serializers.IntegerField()
    tickets_abertos = serializers.IntegerField()
    tickets_em_andamento = serializers.IntegerField()
    tickets_resolvidos = serializers.IntegerField()
    tickets_fechados = serializers.IntegerField()
    tempo_medio_resolucao = serializers.FloatField()
    satisfacao_media = serializers.FloatField()
    tickets_por_categoria = serializers.DictField()
    tickets_por_prioridade = serializers.DictField()
    tickets_por_status = serializers.DictField()

class TicketSatisfactionSerializer(serializers.ModelSerializer):
    """Serializer para avaliação de satisfação"""
    
    class Meta:
        model = Ticket
        fields = ['satisfacao_usuario', 'comentario_satisfacao']
    
    def validate_satisfacao_usuario(self, value):
        if value is not None and (value < 1 or value > 5):
            raise serializers.ValidationError("A satisfação deve ser entre 1 e 5")
        return value
    
    def update(self, instance, validated_data):
        # Só permite avaliação se o ticket está resolvido ou fechado
        if instance.status not in [Ticket.Status.RESOLVIDO, Ticket.Status.FECHADO]:
            raise serializers.ValidationError(
                "Só é possível avaliar tickets resolvidos ou fechados"
            )
        return super().update(instance, validated_data)
