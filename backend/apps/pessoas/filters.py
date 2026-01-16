
import django_filters
from .models import Visitante, Efetivo

class VisitanteFilter(django_filters.FilterSet):
    nome = django_filters.CharFilter(lookup_expr='icontains')
    nif = django_filters.CharFilter(lookup_expr='exact')
    documento_numero = django_filters.CharFilter(field_name='documento_numero', lookup_expr='exact')

    class Meta:
        model = Visitante
        fields = ['tipo_pessoa', 'nome', 'nif', 'documento_numero']

class EfetivoFilter(django_filters.FilterSet):
    nome_completo = django_filters.CharFilter(lookup_expr='icontains')
    tipo = django_filters.CharFilter(lookup_expr='exact')
    orgao = django_filters.NumberFilter(field_name='orgao')
    ativo = django_filters.BooleanFilter()

    class Meta:
        model = Efetivo
        fields = ['nome_completo', 'tipo', 'orgao', 'ativo']
