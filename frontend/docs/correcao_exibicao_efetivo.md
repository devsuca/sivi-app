# Correção da Exibição do Efetivo na Lista de Visitas - SIVI+360°

## Problema Identificado

O campo "Efetivo a Visitar" estava sendo preenchido corretamente no formulário de registro, mas o nome do efetivo não aparecia na lista de visitas (coluna "Efetivo" mostrava apenas "-").

## Causa Raiz

O problema estava na **coluna da tabela** (`src/app/dashboard/visitas/columns.tsx`):

- **Campo incorreto**: O código estava tentando acessar `efetivo_visitar_obj?.nome`
- **Campo correto**: O EfetivoSerializer retorna `nome_completo`

## Estrutura dos Dados

### Backend (EfetivoSerializer)
```python
# apps/pessoas/serializers.py
class EfetivoSerializer(serializers.ModelSerializer):
    class Meta:
        model = Efetivo
        fields = (
            'id', 'nome_completo', 'numero_funcional', 'tipo', 'orgao',
            'email', 'telefone', 'ativo', 'usuario'
        )
```

### Frontend (Coluna da Tabela)
```typescript
// ANTES (incorreto)
const nome = (info.row.original as any).efetivo_visitar_obj?.nome || '-';

// DEPOIS (correto)
const nome = efetivo?.nome_completo || '-';
```

## Correção Implementada

### Arquivo: `src/app/dashboard/visitas/columns.tsx`

```typescript
{
  accessorKey: 'efetivo_visitar_obj',
  header: 'Efetivo',
  cell: info => {
    const efetivo = (info.row.original as any).efetivo_visitar_obj;
    const nome = efetivo?.nome_completo || '-';
    console.log('🔍 Coluna Efetivo - Dados:', { efetivo, nome });
    return (
      <div className="max-w-[150px] truncate" title={nome}>{nome}</div>
    );
  },
  size: 150,
},
```

## Mudanças Realizadas

1. **Campo corrigido**: `nome` → `nome_completo`
2. **Log de debug adicionado**: Para verificar os dados recebidos
3. **Estrutura melhorada**: Separação da lógica para melhor legibilidade

## Como Testar

### 1. **Acesse a Lista de Visitas**
```
http://localhost:3000/dashboard/visitas
```

### 2. **Verifique a Coluna "Efetivo"**
- ✅ **Antes**: Mostrava apenas "-"
- ✅ **Depois**: Deve mostrar o nome completo do efetivo

### 3. **Verifique os Logs no Console**
```javascript
🔍 Coluna Efetivo - Dados: {
  efetivo: {id: "5", nome_completo: "João Silva", ...},
  nome: "João Silva"
}
```

## Resultado Esperado

### ✅ **Funcionamento Correto**
1. **Coluna "Efetivo" preenchida**: Nome completo do efetivo aparece
2. **Tooltip funcionando**: Hover mostra o nome completo
3. **Logs no console**: Dados do efetivo são exibidos corretamente

### ❌ **Se ainda não funcionar**
1. **Verifique os logs** no console
2. **Confirme se há efetivos** associados às visitas
3. **Verifique a API** se está retornando `efetivo_visitar_obj`

## Fluxo Completo

1. **Registro de Visita**: Campo "Efetivo a Visitar" preenchido ✅
2. **Salvamento**: Dados salvos no backend ✅
3. **Listagem**: Nome do efetivo exibido na tabela ✅

## Arquivos Modificados

- ✅ `src/app/dashboard/visitas/columns.tsx` - Correção da coluna Efetivo

## Próximos Passos

1. **Teste a funcionalidade** completa
2. **Verifique se todas as visitas** mostram o efetivo
3. **Remova os logs** de debug (após confirmação)
4. **Teste com diferentes tipos** de efetivos

A correção foi simples mas crucial: o campo correto é `nome_completo`, não `nome`!

