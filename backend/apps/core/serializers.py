from rest_framework import serializers
from .models import Orgao, LogSistema


class OrgaoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Orgao
        fields = '__all__'


class LogSistemaSerializer(serializers.ModelSerializer):
    usuario_username = serializers.CharField(source='user.username', read_only=True)
    usuario_email = serializers.EmailField(source='user.email', read_only=True)
    
    class Meta:
        model = LogSistema
        fields = [
            'id',
            'entidade',
            'acao',
            'user',
            'usuario_username',
            'usuario_email',
            'data_hora',
            'dados_anteriores',
            'dados_novos'
        ]
        read_only_fields = ['id', 'data_hora']


class LogSistemaListSerializer(serializers.ModelSerializer):
    """Serializer para listagem de logs com informações do usuário"""
    usuario_info = serializers.SerializerMethodField()
    detalhes = serializers.SerializerMethodField()
    
    class Meta:
        model = LogSistema
        fields = [
            'id',
            'entidade',
            'acao',
            'user',
            'usuario_info',
            'detalhes',
            'data_hora',
            'dados_anteriores',
            'dados_novos'
        ]
    
    def get_usuario_info(self, obj):
        """Retorna informações detalhadas do usuário"""
        if obj.user:
            try:
                # Priorizar o campo 'nome' do nosso modelo de usuário customizado
                nome_exibicao = getattr(obj.user, 'nome', '') or obj.user.get_full_name() or obj.user.username
                
                return {
                    'id': obj.user.id,
                    'username': obj.user.username,
                    'email': obj.user.email,
                    'nome_completo': nome_exibicao,
                    'perfil': getattr(obj.user.perfil, 'nome', 'N/A') if hasattr(obj.user, 'perfil') and obj.user.perfil else 'N/A'
                }
            except Exception as e:
                print(f"Erro ao serializar usuário no log: {e}")
                return {
                    'id': obj.user.id,
                    'username': obj.user.username,
                    'email': getattr(obj.user, 'email', 'N/A'),
                    'nome_completo': obj.user.username,
                    'perfil': 'N/A'
                }
        return {'username': 'Sistema', 'nome_completo': 'Sistema'}

    def get_detalhes(self, obj):
        """Gera uma descrição amigável das alterações"""
        acao = obj.acao.lower()
        
        if acao == 'login':
            return "Realizou login no sistema"
        if acao == 'logout':
            return "Saiu do sistema"
            
        try:
            if acao == 'create' and obj.dados_novos:
                # Tentar extrair um nome identificador
                identificador = obj.dados_novos.get('nome') or obj.dados_novos.get('designacao_social') or obj.dados_novos.get('numero_funcional') or ""
                return f"Criou {obj.entidade}: {identificador}".strip(': ')
                
            if acao == 'update' and obj.dados_anteriores and obj.dados_novos:
                campos_alterados = []
                for campo, valor_novo in obj.dados_novos.items():
                    valor_antigo = obj.dados_anteriores.get(campo)
                    if valor_novo != valor_antigo:
                        # Formatar nome do campo (de underscore para espaço e Capitalize)
                        nome_campo = campo.replace('_', ' ').capitalize()
                        campos_alterados.append(nome_campo)
                
                if campos_alterados:
                    return f"Alterou: {', '.join(campos_alterados)}"
                return "Atualizou registro (sem mudanças de valores)"
                
            if acao == 'delete' and obj.dados_anteriores:
                identificador = obj.dados_anteriores.get('nome') or obj.dados_anteriores.get('designacao_social') or ""
                return f"Removeu {obj.entidade}: {identificador}".strip(': ')
                
            return f"Ação {obj.acao} em {obj.entidade}"
        except:
            return f"Processou {obj.entidade}"