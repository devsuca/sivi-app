# Sistema de Controle de Acesso - SIVI+360°

## Visão Geral

O sistema implementa um controle de acesso baseado em roles (perfis) que garante que usuários tenham acesso apenas aos dados apropriados conforme seu nível de autorização.

## Perfis de Usuário

### 1. **Administrador (admin)**
- **Acesso**: Total ao sistema
- **Visitas**: Pode visualizar, criar, editar e excluir visitas de todos os órgãos
- **Relatórios**: Acesso completo a todos os relatórios e estatísticas
- **Funcionalidades**: Controle total do sistema

### 2. **Portaria (portaria)**
- **Acesso**: Controle global de visitas
- **Visitas**: Pode visualizar, criar, editar e excluir visitas de **TODOS** os órgãos
- **Relatórios**: Acesso completo a todos os relatórios e estatísticas
- **Funcionalidades**: Gerenciamento centralizado de todas as visitas

### 3. **Recepção (recepcao)**
- **Acesso**: Limitado ao órgão do usuário
- **Visitas**: Pode visualizar e criar visitas **APENAS** do seu órgão (lista filtrada automaticamente)
- **Restrições**: NÃO pode finalizar visitas nem associar crachás, só pode agendar visitas para o seu órgão
- **Relatórios**: Acesso apenas aos relatórios do seu órgão
- **Funcionalidades**: Agendamento de visitas e visualização local

### 4. **Secretaria (secretaria)**
- **Acesso**: Limitado ao órgão do usuário
- **Visitas**: Pode visualizar e criar visitas **APENAS** do seu órgão
- **Relatórios**: Acesso apenas aos relatórios do seu órgão
- **Funcionalidades**: Apoio administrativo local

## Implementação Técnica

### Permissões Personalizadas

```python
# apps/authentication/permissions.py
class CanAccessAllVisitas(BasePermission):
    """Admin e Portaria - acesso a todas as visitas"""
    
class CanAccessOrgaoVisitas(BasePermission):
    """Recepção - acesso apenas ao órgão do usuário"""
    
class CanViewVisitas(BasePermission):
    """Admin, Portaria, Secretaria e Recepção podem visualizar visitas"""
    
class CanViewOrgaoVisitas(BasePermission):
    """Recepção - visualização apenas do órgão do usuário"""
    
class CanCreateVisita(BasePermission):
    """Todos os perfis podem criar visitas"""
    
class CanModifyVisita(BasePermission):
    """Admin, Portaria e Secretaria podem modificar visitas"""
    
class CanFinalizeVisita(BasePermission):
    """Admin, Portaria e Secretaria podem finalizar visitas"""
    
class CanAssociateCracha(BasePermission):
    """Admin, Portaria e Secretaria podem associar crachás"""
    
class CanManagePertences(BasePermission):
    """Admin, Portaria e Secretaria podem gerenciar pertences"""
```

### Mixin de Controle de Acesso

```python
# apps/authentication/mixins.py
class OrgaoAccessMixin:
    def get_user_orgao(self, user):
        """Obtém o órgão do usuário baseado no perfil"""
        
    def filter_queryset_by_orgao(self, queryset, user):
        """Filtra queryset baseado no órgão do usuário"""
        
    def validate_orgao_access(self, user, orgao):
        """Valida se usuário pode acessar um órgão específico"""
```

### Aplicação nas Views

```python
# apps/visitas/views.py
class VisitaViewSet(OrgaoAccessMixin, viewsets.ModelViewSet):
    def get_permissions(self):
        if self.action in ['list', 'retrieve']:
            # Admin, Portaria e Secretaria podem ver todas as visitas
            # Recepção pode ver apenas visitas do seu órgão
            permission_classes = [CanViewVisitas | CanViewOrgaoVisitas]
        elif self.action == 'create':
            permission_classes = [CanCreateVisita]
        elif self.action in ['update', 'partial_update', 'destroy']:
            permission_classes = [CanModifyVisita]
        elif self.action == 'finalizar':
            permission_classes = [CanFinalizeVisita]
        elif self.action in ['atribuir_crachas', 'get_crachas']:
            permission_classes = [CanAssociateCracha]
    
    def get_queryset(self):
        return self.filter_queryset_by_orgao(queryset, self.request.user)
```

## Fluxo de Controle de Acesso

### 1. **Autenticação**
- Usuário faz login no sistema
- Sistema valida credenciais
- Sessão é estabelecida com informações do perfil

### 2. **Autorização**
- Middleware valida perfil do usuário
- Permissões são verificadas para cada ação
- Filtros são aplicados baseados no órgão

### 3. **Filtragem de Dados**
- **Admin/Portaria**: Acesso a todos os dados
- **Recepção/Secretaria**: Dados filtrados por órgão

## Exemplos de Uso

### Usuário Portaria
```python
# Pode acessar todas as visitas
GET /api/visitas/
# Retorna: Todas as visitas de todos os órgãos
```

### Usuário Recepção (Órgão: Direção Geral)
```python
# Pode acessar apenas visitas do seu órgão
GET /api/visitas/
# Retorna: Apenas visitas do órgão "Direção Geral"

# Pode criar visitas (órgão definido automaticamente)
POST /api/visitas/
# Sistema define orgao=user.orgao automaticamente

# NÃO pode finalizar visitas
POST /api/visitas/{id}/finalizar/
# Retorna: 403 Forbidden

# NÃO pode associar crachás
POST /api/visitas/{id}/atribuir-crachas/
# Retorna: 403 Forbidden
```

### Criação de Visita
```python
# Recepção: órgão é automaticamente definido
POST /api/visitas/
{
    "visitante": "uuid",
    "motivo": "Reunião"
}
# Sistema define orgao=user.orgao automaticamente

# Frontend: Campo órgão desabilitado para recepção
# - Apenas o órgão do usuário é mostrado
# - Campo não pode ser alterado
# - Valor é definido automaticamente

# Frontend: Lista de visitas para recepção
# - Mostra apenas visitas do órgão do usuário
# - Colunas limitadas (sem ações de edição/finalização)
# - Apenas botão "Ver" disponível
# - Filtro por número da visita disponível

# Frontend: Detalhes da visita para recepção
# - Modo somente leitura (sem botões de ação)
# - Informações sobre crachá em formato de texto
# - Card informativo sobre limitações
# - Sem botões de editar, finalizar ou associar crachás

# Frontend: Busca de visitantes expandida
# - Busca por número de documento inclui visitantes e acompanhantes
# - Acompanhantes são automaticamente convertidos em visitantes reais
# - Criação automática de visitante no backend quando acompanhante é encontrado
# - UUID válido gerado automaticamente para o novo visitante
# - Funciona para todos os roles com permissão

# Frontend: Gerenciamento de pertences
# - Formulário de pertences disponível apenas para Admin, Portaria e Secretaria
# - Recepção NÃO pode gerenciar pertences
# - Campos: descrição, tipo, quantidade

# Frontend: Exportação e Impressão de Visitas
# - Funcionalidade disponível para TODOS os roles (Admin, Portaria, Secretaria, Recepção)
# - Modal de filtros avançados para exportação/impressão
# - Filtros por data (início e fim)
# - Filtros por estado da visita (Agendada, Em Curso, Concluída)
# - Filtros por órgão
# - Seleção de campos a incluir na exportação
# - Exportação para Excel (.xlsx) com formatação adequada
# - Exportação para PDF (.pdf) em modo paisagem
# - Impressão direta via navegador com layout otimizado
# - Filtros aplicados são respeitados na exportação/impressão
# - Nome do arquivo inclui role do usuário e data
# - Indicador visual de progresso durante exportação
# - Resumo em tempo real do número de registros filtrados
# - Integrado no formulário de criação de visitas

# Portaria: pode especificar qualquer órgão
POST /api/visitas/
{
    "visitante": "uuid",
    "orgao": "uuid",
    "motivo": "Reunião"
}
```

## Usuários de Teste

Para testar o sistema, foram criados os seguintes usuários:

| Usuário | Senha | Perfil | Órgão | Acesso |
|---------|-------|--------|-------|--------|
| admin | admin123 | Admin | - | Total |
| portaria | portaria123 | Portaria | - | Todas as visitas |
| recepcao1 | recepcao123 | Recepção | Direção Geral | Apenas Direção Geral |
| recepcao2 | recepcao123 | Recepção | Recursos Humanos | Apenas RH |
| recepcao3 | recepcao123 | Recepção | Financeiro | Apenas Financeiro |
| secretaria | secretaria123 | Secretaria | Direção Geral | Apenas Direção Geral |

## Logs e Auditoria

O sistema registra todas as ações para auditoria:

```python
logger.info(f"Usuário {user.username} ({user.perfil.nivel_acesso}) acessando visitas")
logger.info(f"Visita {visita.id} criada por {user.username}")
logger.warning(f"Acesso negado para {user.username} em {request.path}")
```

## Segurança

### Boas Práticas Implementadas

1. **Princípio do Menor Privilégio**: Usuários têm apenas o acesso necessário
2. **Validação em Múltiplas Camadas**: Permissões + Filtros + Middleware
3. **Logs de Auditoria**: Todas as ações são registradas
4. **Validação de Órgão**: Verificação em cada operação
5. **Separação de Responsabilidades**: Diferentes perfis para diferentes funções

### Validações de Segurança

- ✅ Usuário deve estar autenticado
- ✅ Usuário deve ter perfil válido
- ✅ Recepção deve ter órgão vinculado
- ✅ Portaria deve ter efetivo vinculado
- ✅ Acesso a órgão é validado em cada operação
- ✅ Recepção NÃO pode finalizar visitas
- ✅ Recepção NÃO pode associar crachás
- ✅ Logs de todas as ações para auditoria

## Testando o Sistema

1. **Faça login** com cada usuário de teste
2. **Acesse a lista de visitas** e verifique os dados retornados
3. **Tente criar uma visita** e observe o comportamento
4. **Acesse os relatórios** e verifique os dados disponíveis
5. **Verifique os logs** para confirmar o controle de acesso

## Comandos Úteis

```bash
# Criar usuários de teste
python manage.py create_test_users

# Verificar logs
tail -f logs/django.log

# Testar API
curl -H "Authorization: Bearer <token>" http://localhost:8000/api/visitas/
```
