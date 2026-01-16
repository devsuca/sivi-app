import django_filters
from django.db.models import Q
from .models import Ticket, TicketCategory, TicketPriority, TicketStatus

class TicketFilter(django_filters.FilterSet):
    """
    Filtros para tickets
    """
    # Filtros básicos
    categoria = django_filters.ChoiceFilter(choices=TicketCategory.choices)
    prioridade = django_filters.ChoiceFilter(choices=TicketPriority.choices)
    status = django_filters.ChoiceFilter(choices=TicketStatus.choices)
    
    # Filtros de data
    data_criacao_inicio = django_filters.DateFilter(
        field_name='data_criacao',
        lookup_expr='gte',
        help_text='Data de criação a partir de (YYYY-MM-DD)'
    )
    data_criacao_fim = django_filters.DateFilter(
        field_name='data_criacao',
        lookup_expr='lte',
        help_text='Data de criação até (YYYY-MM-DD)'
    )
    
    data_resolucao_inicio = django_filters.DateFilter(
        field_name='data_resolucao',
        lookup_expr='gte',
        help_text='Data de resolução a partir de (YYYY-MM-DD)'
    )
    data_resolucao_fim = django_filters.DateFilter(
        field_name='data_resolucao',
        lookup_expr='lte',
        help_text='Data de resolução até (YYYY-MM-DD)'
    )
    
    # Filtros de usuário
    solicitante = django_filters.NumberFilter(field_name='solicitante__id')
    atribuido_para = django_filters.NumberFilter(field_name='atribuido_para__id')
    
    # Filtros de satisfação
    satisfacao_minima = django_filters.NumberFilter(
        field_name='satisfacao_usuario',
        lookup_expr='gte',
        help_text='Satisfação mínima (1-5)'
    )
    satisfacao_maxima = django_filters.NumberFilter(
        field_name='satisfacao_usuario',
        lookup_expr='lte',
        help_text='Satisfação máxima (1-5)'
    )
    
    # Filtros de tempo
    tempo_resolucao_minimo = django_filters.NumberFilter(
        method='filter_tempo_resolucao_minimo',
        help_text='Tempo mínimo de resolução em horas'
    )
    tempo_resolucao_maximo = django_filters.NumberFilter(
        method='filter_tempo_resolucao_maximo',
        help_text='Tempo máximo de resolução em horas'
    )
    
    # Filtros de texto
    busca = django_filters.CharFilter(
        method='filter_busca',
        help_text='Busca em título, descrição e número'
    )
    
    # Filtros de tags
    tags = django_filters.CharFilter(
        method='filter_tags',
        help_text='Tags separadas por vírgula'
    )
    
    # Filtros especiais
    meus_tickets = django_filters.BooleanFilter(
        method='filter_meus_tickets',
        help_text='Apenas meus tickets'
    )
    tickets_atribuidos = django_filters.BooleanFilter(
        method='filter_tickets_atribuidos',
        help_text='Apenas tickets atribuídos a mim'
    )
    tickets_vencidos = django_filters.BooleanFilter(
        method='filter_tickets_vencidos',
        help_text='Tickets vencidos (baseado na prioridade)'
    )
    
    class Meta:
        model = Ticket
        fields = [
            'categoria', 'prioridade', 'status',
            'data_criacao_inicio', 'data_criacao_fim',
            'data_resolucao_inicio', 'data_resolucao_fim',
            'solicitante', 'atribuido_para',
            'satisfacao_minima', 'satisfacao_maxima',
            'tempo_resolucao_minimo', 'tempo_resolucao_maximo',
            'busca', 'tags', 'meus_tickets', 'tickets_atribuidos', 'tickets_vencidos'
        ]
    
    def filter_tempo_resolucao_minimo(self, queryset, name, value):
        """
        Filtra tickets com tempo de resolução mínimo
        """
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            horas = float(value)
            data_limite = timezone.now() - timedelta(hours=horas)
            return queryset.filter(data_resolucao__lte=data_limite)
        except (ValueError, TypeError):
            return queryset
    
    def filter_tempo_resolucao_maximo(self, queryset, name, value):
        """
        Filtra tickets com tempo de resolução máximo
        """
        from django.utils import timezone
        from datetime import timedelta
        
        try:
            horas = float(value)
            data_limite = timezone.now() - timedelta(hours=horas)
            return queryset.filter(data_resolucao__gte=data_limite)
        except (ValueError, TypeError):
            return queryset
    
    def filter_busca(self, queryset, name, value):
        """
        Busca em título, descrição e número
        """
        if not value:
            return queryset
        
        return queryset.filter(
            Q(titulo__icontains=value) |
            Q(descricao__icontains=value) |
            Q(numero__icontains=value)
        )
    
    def filter_tags(self, queryset, name, value):
        """
        Filtra por tags
        """
        if not value:
            return queryset
        
        tags = [tag.strip() for tag in value.split(',') if tag.strip()]
        if not tags:
            return queryset
        
        # Filtra tickets que contenham pelo menos uma das tags
        q_objects = Q()
        for tag in tags:
            q_objects |= Q(tags__contains=[tag])
        
        return queryset.filter(q_objects)
    
    def filter_meus_tickets(self, queryset, name, value):
        """
        Filtra apenas tickets do usuário logado
        """
        if value and hasattr(self, 'request') and self.request.user.is_authenticated:
            return queryset.filter(solicitante=self.request.user)
        return queryset
    
    def filter_tickets_atribuidos(self, queryset, name, value):
        """
        Filtra apenas tickets atribuídos ao usuário logado
        """
        if value and hasattr(self, 'request') and self.request.user.is_authenticated:
            return queryset.filter(atribuido_para=self.request.user)
        return queryset
    
    def filter_tickets_vencidos(self, queryset, name, value):
        """
        Filtra tickets vencidos baseado na prioridade
        """
        if not value:
            return queryset
        
        from django.utils import timezone
        from datetime import timedelta
        
        agora = timezone.now()
        
        # Define prazos baseados na prioridade
        prazos = {
            TicketPriority.URGENTE: timedelta(hours=4),
            TicketPriority.ALTA: timedelta(hours=24),
            TicketPriority.MEDIA: timedelta(days=3),
            TicketPriority.BAIXA: timedelta(days=7),
        }
        
        q_objects = Q()
        for prioridade, prazo in prazos.items():
            data_limite = agora - prazo
            q_objects |= Q(
                prioridade=prioridade,
                data_criacao__lte=data_limite,
                status__in=[TicketStatus.ABERTO, TicketStatus.EM_ANDAMENTO]
            )
        
        return queryset.filter(q_objects)
