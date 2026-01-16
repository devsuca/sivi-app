# Debug Detalhado - Campo "Efetivo a Visitar" - SIVI+360°

## Problema Persistente

O campo "Efetivo a Visitar" continua não preenchendo o dado ao selecionar e não salva o nome.

## Logs de Debug Adicionados

Adicionei logs detalhados em todo o fluxo para identificar exatamente onde o problema está ocorrendo:

### 1. **Combobox Component** (`src/components/ui/combobox.tsx`)
- ✅ Logs de props recebidas
- ✅ Logs de display check (valor vs opções)
- ✅ Logs de onSelect (seleção)
- ✅ Logs de onChange (mudança de valor)

### 2. **VisitaDetails Component** (`src/components/visitas/VisitaDetails.tsx`)
- ✅ Logs de dados carregados (órgãos e efetivos)
- ✅ Logs de estado do formulário
- ✅ Logs específicos para mudanças no efetivo_visitar
- ✅ Logs de opções criadas para o combobox

### 3. **useVisitaForm Hook** (`src/hooks/useVisitaForm.ts`)
- ✅ Logs de setFormField chamado
- ✅ Logs de actions no reducer
- ✅ Logs de novo estado

## Como Fazer o Debug

### 1. **Acesse a Página**
```
http://localhost:3000/dashboard/visitas/novo
```

### 2. **Abra o Console do Navegador**
- Pressione **F12**
- Vá para a aba **Console**
- Limpe o console (botão 🗑️)

### 3. **Execute o Teste Passo a Passo**

#### Passo 1: Carregamento da Página
```javascript
// Logs esperados:
🔍 DEBUG: Órgãos
🔍 DEBUG: Efetivos
📋 ESTADO DO FORMULÁRIO
🟠 efetivoOptions criadas: []
```

#### Passo 2: Selecionar Órgão
```javascript
// Logs esperados:
Órgão selecionado: 1
handleFieldChange: orgao 1
🟢 useVisitaForm - setFormField chamado: {field: "orgao", value: 1, valueType: "string"}
🟣 formReducer - Action recebida: {type: "SET_FIELD", field: "orgao", value: 1}
🟣 formReducer - Novo estado: {orgao: 1, ...}
🟠 efetivoOptions criadas: [{value: "5", label: "João Silva", data: {...}}]
```

#### Passo 3: Selecionar Efetivo
```javascript
// Logs esperados:
Combobox onSelect: {currentValue: "5", currentValueType: "string", value: "", valueType: "string"}
Combobox onChange called with: 5
🔵 VisitaDetails - Efetivo selecionado: 5 tipo: string
🟢 useVisitaForm - setFormField chamado: {field: "efetivo_visitar", value: "5", valueType: "string"}
🟣 formReducer - Action recebida: {type: "SET_FIELD", field: "efetivo_visitar", value: "5"}
🟣 formReducer - Novo estado: {efetivo_visitar: "5", ...}
🟡 VisitaDetails - Estado do efetivo_visitar mudou: {efetivo_visitar: "5", tipo: "string", ...}
🔍 Combobox Display Check: {valueProp: "5", valuePropType: "string", foundOption: {value: "5", label: "João Silva"}, ...}
```

## O que Procurar nos Logs

### ✅ **Se Funcionando Corretamente**
1. **setFormField** é chamado com o valor correto
2. **formReducer** recebe a action correta
3. **Novo estado** tem o efetivo_visitar preenchido
4. **Combobox Display Check** encontra a opção correta
5. **Campo é preenchido** com o nome do efetivo

### ❌ **Se Há Problema**
1. **setFormField não é chamado** → Problema no VisitaDetails
2. **formReducer não recebe action** → Problema no hook
3. **Novo estado não tem o valor** → Problema no reducer
4. **Combobox Display Check não encontra opção** → Problema de tipos
5. **Campo não é preenchido** → Problema no Combobox

## Possíveis Causas

### 1. **Problema de Tipos**
- IDs sendo comparados como string vs número
- Valor não sendo convertido corretamente

### 2. **Problema no Estado**
- Estado não sendo atualizado
- Reducer não funcionando corretamente

### 3. **Problema no Combobox**
- Display não encontrando a opção
- Valor não sendo passado corretamente

### 4. **Problema nos Dados**
- Efetivos não sendo carregados
- Estrutura dos dados incorreta

## Próximos Passos

1. **Execute o teste** com os logs
2. **Copie TODOS os logs** do console
3. **Identifique onde o fluxo para**
4. **Reporte o resultado** para correção específica

## Comandos de Debug Úteis

```javascript
// No console do navegador
console.log('Estado atual:', window.formState);
console.log('Efetivos carregados:', window.efetivos);
console.log('Órgãos carregados:', window.orgaos);
```

## Arquivos com Logs Adicionados

- ✅ `src/components/ui/combobox.tsx`
- ✅ `src/components/visitas/VisitaDetails.tsx`
- ✅ `src/hooks/useVisitaForm.ts`
- ✅ `src/utils/debugForm.ts`

Execute o teste e me envie os logs para identificar exatamente onde está o problema!

