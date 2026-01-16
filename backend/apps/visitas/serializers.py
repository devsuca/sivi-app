from rest_framework import serializers
from .models import Visita, Acompanhante, Viatura
from apps.pessoas.models import Visitante, Efetivo
from apps.core.models import Orgao

class AcompanhanteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Acompanhante
        fields = ('nome', 'documento_tipo', 'documento_numero', 'nacionalidade')

class ViaturaSerializer(serializers.ModelSerializer):
    class Meta:
        model = Viatura
        fields = ('tipo', 'marca', 'cor', 'matricula')

from apps.pessoas.serializers import VisitanteSerializer, EfetivoSerializer
from apps.core.serializers import OrgaoSerializer
# from apps.efetivos.serializers import EfetivoSerializer


class VisitaSerializer(serializers.ModelSerializer):
    visitante = serializers.PrimaryKeyRelatedField(queryset=Visitante.objects.all(), write_only=True)
    orgao = serializers.PrimaryKeyRelatedField(queryset=Orgao.objects.all(), write_only=True)
    efetivo_visitar = serializers.PrimaryKeyRelatedField(queryset=Efetivo.objects.all(), write_only=True, required=False, allow_null=True)
    visitante_obj = VisitanteSerializer(source="visitante", read_only=True)
    orgao_obj = OrgaoSerializer(source="orgao", read_only=True)
    efetivo_visitar_obj = EfetivoSerializer(source="efetivo_visitar", read_only=True)
    registado_por = EfetivoSerializer(read_only=True)
    acompanhantes = AcompanhanteSerializer(many=True, required=False)
    viaturas = ViaturaSerializer(many=True, required=False)
    confirmada_recepcao = serializers.BooleanField(read_only=True)

    class Meta:
        model = Visita
        fields = [
            "id", "numero", "visitante", "visitante_obj", "efetivo_visitar", "efetivo_visitar_obj", "orgao", "orgao_obj",
            "motivo", "estado", "data_hora_entrada", "data_hora_saida", "observacoes", "registado_por", "data_registo",
            "acompanhantes", "viaturas", "confirmada_recepcao"
        ]
        read_only_fields = ("data_registo", "data_hora_saida", "numero", "registado_por", "confirmada_recepcao")

    def validate_visitante(self, value):
        if not value.ativo:
            raise serializers.ValidationError("O visitante selecionado não está ativo.")
        return value

    def create(self, validated_data):
        acompanhantes_data = validated_data.pop('acompanhantes', [])
        viaturas_data = validated_data.pop('viaturas', [])
        user = self.context['request'].user
        efetivo = getattr(user, 'efetivo', None)
        if not efetivo:
            raise serializers.ValidationError("O usuário logado não possui um efetivo vinculado. Não é possível registrar a visita.")
        validated_data['registado_por'] = efetivo
        visita = super().create(validated_data)
        for acompanhante_data in acompanhantes_data:
            Acompanhante.objects.create(visita=visita, **acompanhante_data)
        for viatura_data in viaturas_data:
            Viatura.objects.create(visita=visita, **viatura_data)
        return visita

    def update(self, instance, validated_data):
        acompanhantes_data = validated_data.pop('acompanhantes', None)
        viaturas_data = validated_data.pop('viaturas', None)

        # Atualiza campos simples
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        # Atualiza acompanhantes
        if acompanhantes_data is not None:
            instance.acompanhantes.all().delete()
            for acompanhante_data in acompanhantes_data:
                Acompanhante.objects.create(visita=instance, **acompanhante_data)

        # Atualiza viaturas
        if viaturas_data is not None:
            instance.viaturas.all().delete()
            for viatura_data in viaturas_data:
                Viatura.objects.create(visita=instance, **viatura_data)

        return instance

class AtribuirCrachaSerializer(serializers.Serializer):
    cracha_ids = serializers.ListField(
        child=serializers.IntegerField(),
        allow_empty=False
    )
