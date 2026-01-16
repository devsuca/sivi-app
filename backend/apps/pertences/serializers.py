from rest_framework import serializers
from .models import Pertence, MovimentoPertence

from apps.visitas.serializers import VisitaSerializer

class PertenceSerializer(serializers.ModelSerializer):
    visita_obj = VisitaSerializer(source="visita", read_only=True)
    class Meta:
        model = Pertence
        fields = '__all__'
        read_only_fields = ('entregue_por', 'data_entrega', 'levantado_por', 'data_levantamento')

class MovimentoPertenceSerializer(serializers.ModelSerializer):
    class Meta:
        model = MovimentoPertence
        fields = '__all__'
