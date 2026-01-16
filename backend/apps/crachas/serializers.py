from rest_framework import serializers
from .models import Cracha


class CrachaSerializer(serializers.ModelSerializer):
    # Incluir informações da visita
    visita_numero = serializers.CharField(source='visita.numero', read_only=True)
    visita_estado = serializers.CharField(source='visita.estado', read_only=True)
    
    class Meta:
        model = Cracha
        fields = '__all__'
    
    def create(self, validated_data):
        print(f"🔍 Criando crachá com dados: {validated_data}")
        try:
            cracha = super().create(validated_data)
            print(f"✅ Crachá criado com sucesso: {cracha}")
            return cracha
        except Exception as e:
            print(f"❌ Erro ao criar crachá: {e}")
            raise
    
    def update(self, instance, validated_data):
        print(f"🔍 Atualizando crachá {instance.id} com dados: {validated_data}")
        try:
            cracha = super().update(instance, validated_data)
            print(f"✅ Crachá atualizado com sucesso: {cracha}")
            return cracha
        except Exception as e:
            print(f"❌ Erro ao atualizar crachá: {e}")
            raise