# Debug do Formulário de Visitas - SIVI+360°

## Problema Identificado

Os campos "Órgão" e "Efetivo a Visitar" não estavam sendo preenchidos corretamente ao selecionar na página de criação de visitas (`http://localhost:3000/dashboard/visitas/novo`).

## Causa Raiz

O problema estava relacionado à **comparação de tipos de dados**:

1. **IDs como strings vs números**: Os IDs dos órgãos e efetivos estavam sendo comparados sem conversão adequada
2. **Comparações de igualdade**: `===` falhava quando comparava string com número
3. **Valores do Select**: O componente Select esperava strings, mas recebia números

## Correções Implementadas

### 1. **Conversão de Tipos Consistente**

```typescript
// ANTES (problemático)
efetivos.find(e => e.id === formState.efetivo_visitar)
orgaos.find(o => o.id === formState.orgao)

// DEPOIS (corrigido)
efetivos.find(e => String(e.id) === String(formState.efetivo_visitar))
orgaos.find(o => String(o.id) === String(formState.orgao))
```

### 2. **Valores do Select Corrigidos**

```typescript
// ANTES
<Select value={formState.orgao || ''}>

// DEPOIS
<Select value={String(formState.orgao || '')}>
```

### 3. **Filtros de Efetivos Corrigidos**

```typescript
// ANTES
efetivos.filter((e) => !formState.orgao || e.orgao === formState.orgao)

// DEPOIS
efetivos.filter((e) => !formState.orgao || String(e.orgao) === String(formState.orgao))
```

### 4. **Logs de Debug Adicionados**

- Console logs para rastrear seleções
- Debug de dados recebidos
- Verificação de opções do combobox

## Arquivos Modificados

### `src/components/visitas/VisitaDetails.tsx`
- ✅ Correção de comparações de tipos
- ✅ Conversão consistente para string
- ✅ Logs de debug adicionados
- ✅ Filtros de efetivos corrigidos

### `src/app/dashboard/visitas/novo/page.tsx`
- ✅ Logs de debug na função handleEfetivoChange
- ✅ Logs de debug na função handleFieldChange
- ✅ Conversão de tipos corrigida

### `src/utils/debugForm.ts` (novo)
- ✅ Utilitários de debug para formulários
- ✅ Funções para debug de dados, estado e opções

## Como Testar

### 1. **Acesse a Página**
```
http://localhost:3000/dashboard/visitas/novo
```

### 2. **Teste Seleção de Órgão**
1. Clique no campo "Órgão"
2. Selecione qualquer órgão da lista
3. ✅ **Resultado esperado**: Campo deve ser preenchido e mostrar o nome do órgão

### 3. **Teste Seleção de Efetivo**
1. Primeiro selecione um órgão
2. Clique no campo "Efetivo a Visitar"
3. Selecione um efetivo da lista filtrada
4. ✅ **Resultado esperado**: 
   - Campo deve ser preenchido com o nome do efetivo
   - Órgão deve ser preenchido automaticamente (se diferente)

### 4. **Verifique os Logs**
Abra o Console do navegador (F12) e verifique:
- Logs de debug dos dados carregados
- Logs de seleções de órgão e efetivo
- Logs de preenchimento automático

## Logs de Debug Esperados

```javascript
// Ao carregar a página
🔍 DEBUG: Órgãos
🔍 DEBUG: Efetivos
📋 ESTADO DO FORMULÁRIO

// Ao selecionar órgão
Órgão selecionado: 1
handleFieldChange: orgao 1

// Ao selecionar efetivo
Efetivo selecionado: 5
Efetivo encontrado: {id: "5", nome_completo: "João Silva", orgao: "1"}
Preenchendo órgão automaticamente: 1
```

## Validações de Funcionamento

### ✅ **Cenários de Sucesso**
1. **Seleção de órgão**: Campo preenchido corretamente
2. **Seleção de efetivo**: Campo preenchido + órgão preenchido automaticamente
3. **Filtro de efetivos**: Apenas efetivos do órgão selecionado aparecem
4. **Limpeza de seleção**: Efetivo é limpo ao trocar de órgão

### ❌ **Cenários de Erro (corrigidos)**
1. ~~Campo não preenchido após seleção~~
2. ~~Órgão não preenchido automaticamente~~
3. ~~Efetivos de outros órgãos aparecendo~~

## Próximos Passos

1. **Teste completo** da funcionalidade
2. **Remoção dos logs** de debug (após confirmação)
3. **Teste com diferentes usuários** (recepção, portaria, admin)
4. **Validação do envio** do formulário

## Troubleshooting

### Se ainda houver problemas:

1. **Verifique o Console** para logs de erro
2. **Confirme os dados** carregados (órgãos e efetivos)
3. **Teste com dados simples** primeiro
4. **Verifique a rede** (requisições para API)

### Comandos de Debug Úteis:

```javascript
// No console do navegador
console.log('Form State:', window.formState);
console.log('Órgãos:', window.orgaos);
console.log('Efetivos:', window.efetivos);
```

