from rest_framework import serializers
from django.utils import timezone
from apps.visitas.models import Visita
from .models import Acesso

class AcessoSerializer(serializers.ModelSerializer):
    """
    Serializer para o modelo Acesso.
    """
    visitante_nome = serializers.CharField(source='visita.visitante.nome', read_only=True)
    orgao_nome = serializers.CharField(source='visita.orgao.nome', read_only=True)

    class Meta:
        model = Acesso
        fields = (
            'id',
            'visita',
            'visitante_nome',
            'orgao_nome',
            'data_entrada',
            'data_saida',
            'registrado_por_entrada',
            'registrado_por_saida',
        )
        read_only_fields = (
            'data_entrada', 
            'data_saida', 
            'registrado_por_entrada', 
            'registrado_por_saida',
            'visitante_nome',
            'orgao_nome',
        )

class RegistrarEntradaSerializer(serializers.Serializer):
    """
    Serializer para a ação de registrar entrada.
    Valida se a visita está 'agendada' usando o seu número.
    """
    numero_visita = serializers.CharField(
        max_length=20,
        help_text="O número da visita agendada (ex: 20250923-001).",
        write_only=True
    )

    def validate(self, data):
        numero_visita = data.get('numero_visita')
        try:
            visita = Visita.objects.select_related('cracha').get(numero=numero_visita)
        except Visita.DoesNotExist:
            raise serializers.ValidationError(f"A visita com o número '{numero_visita}' não foi encontrada.")

        if visita.estado != Visita.EstadoVisita.AGENDADA:
            raise serializers.ValidationError(
                f"A visita não está no estado 'Agendada'. Estado atual: {visita.get_estado_display()}"
            )
        
        if hasattr(visita, 'acesso'):
            raise serializers.ValidationError("Esta visita já possui um registro de acesso associado.")

        # Validação do crachá
        if not hasattr(visita, 'cracha') or not visita.cracha:
            raise serializers.ValidationError("A visita não tem um crachá associado para registrar a entrada.")

        if visita.cracha.estado != 'livre':
            raise serializers.ValidationError(f"O crachá {visita.cracha.numero} não está disponível.")

        # Adiciona o objeto visita aos dados validados para ser usado na view
        data['visita'] = visita
        return data

class RegistrarSaidaSerializer(serializers.Serializer):
    """
    Serializer para a ação de registrar saída.
    Valida se a visita está 'em curso'.
    """
    def validate(self, attrs):
        acesso = self.instance
        if not acesso:
            raise serializers.ValidationError("Instância de acesso não encontrada.")
        
        if acesso.visita.estado != Visita.EstadoVisita.EM_CURSO:
            raise serializers.ValidationError(
                f"A visita não está 'Em Curso'. Estado atual: {acesso.visita.get_estado_display()}"
            )
        
        if acesso.data_saida is not None:
            raise serializers.ValidationError("A saída para esta visita já foi registrada.")
            
        return attrs