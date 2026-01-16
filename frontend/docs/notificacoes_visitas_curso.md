# Notificações de Visitas em Curso - SIVI+360°

## Funcionalidade Implementada

O sino no navbar agora conta e exibe o número de visitas em curso em tempo real.

## Componentes Implementados

### 1. **Serviço de API** (`src/services/visitaService.ts`)

```typescript
// Busca visitas em curso para notificações
export const getVisitasEmCurso = async (): Promise<Visita[]> => {
  try {
    const response = await api.get('/visitas/em-curso/');
    return response.data;
  } catch (error: any) {
    console.error('Erro ao buscar visitas em curso:', error);
    return [];
  }
};
```

### 2. **Hook Personalizado** (`src/hooks/useVisitasEmCurso.ts`)

```typescript
export function useVisitasEmCurso() {
  const [visitasEmCurso, setVisitasEmCurso] = useState<Visita[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchVisitasEmCurso = async () => {
    // Lógica de busca e atualização
  };

  useEffect(() => {
    fetchVisitasEmCurso();
    // Atualizar a cada 30 segundos
    const interval = setInterval(fetchVisitasEmCurso, 30000);
    return () => clearInterval(interval);
  }, []);

  return {
    visitasEmCurso,
    loading,
    error,
    refetch: fetchVisitasEmCurso,
    count: visitasEmCurso.length
  };
}
```

### 3. **Componente Header Atualizado** (`src/components/layout/Header.tsx`)

```typescript
// ANTES (mock)
const [notifications, setNotifications] = useState(3);

// DEPOIS (real)
const { count: visitasEmCursoCount, loading: loadingVisitas } = useVisitasEmCurso();
```

## Funcionalidades

### ✅ **Contador em Tempo Real**
- **Atualização automática**: A cada 30 segundos
- **Contador preciso**: Mostra número exato de visitas em curso
- **Indicador visual**: Badge vermelho com animação

### ✅ **Estados Visuais**
- **Com visitas**: Badge vermelho com número
- **Sem visitas**: Sem badge
- **Carregando**: Badge cinza com "..."
- **Tooltip**: Mostra "X visita(s) em curso"

### ✅ **Performance**
- **Hook otimizado**: Evita re-renders desnecessários
- **Intervalo inteligente**: Atualiza a cada 30 segundos
- **Cleanup automático**: Remove intervalos ao desmontar

## Como Funciona

### 1. **Carregamento Inicial**
- Hook é inicializado no Header
- Busca visitas em curso via API
- Atualiza contador no sino

### 2. **Atualizações Automáticas**
- Timer de 30 segundos
- Busca novas visitas em curso
- Atualiza contador se houver mudanças

### 3. **Exibição Visual**
- **0 visitas**: Sino sem badge
- **1+ visitas**: Badge vermelho com número
- **Carregando**: Badge cinza com "..."

## Logs de Debug

### Console do Navegador
```javascript
🔔 Visitas em curso carregadas: 2
```

### Network Tab
```
GET /visitas/em-curso/
Response: [visita1, visita2]
```

## Integração com Backend

### Endpoint Utilizado
```
GET /visitas/em-curso/
```

### Resposta Esperada
```json
[
  {
    "id": "uuid",
    "numero": "SIC-20251001-001",
    "estado": "em_curso",
    "visitante_obj": {...},
    "efetivo_visitar_obj": {...},
    "orgao_obj": {...}
  }
]
```

## Teste da Funcionalidade

### 1. **Acesse o Dashboard**
```
http://localhost:3000/dashboard
```

### 2. **Verifique o Sino**
- Deve mostrar badge com número de visitas em curso
- Tooltip deve mostrar "X visita(s) em curso"

### 3. **Teste Atualizações**
- Crie uma nova visita em curso
- Aguarde até 30 segundos
- Contador deve atualizar automaticamente

### 4. **Verifique Logs**
- Console deve mostrar logs de carregamento
- Network tab deve mostrar requisições periódicas

## Vantagens da Implementação

### ✅ **Tempo Real**
- Atualizações automáticas
- Sem necessidade de refresh manual

### ✅ **Performance**
- Hook otimizado
- Cleanup automático de recursos

### ✅ **UX Melhorada**
- Feedback visual imediato
- Tooltip informativo
- Estados de loading

### ✅ **Manutenibilidade**
- Código modular
- Hook reutilizável
- Separação de responsabilidades

## Arquivos Modificados

- ✅ `src/services/visitaService.ts` - Função getVisitasEmCurso
- ✅ `src/hooks/useVisitasEmCurso.ts` - Hook personalizado (novo)
- ✅ `src/components/layout/Header.tsx` - Integração com hook

## Próximos Passos

1. **Teste a funcionalidade** completa
2. **Verifique atualizações** automáticas
3. **Teste com diferentes** números de visitas
4. **Confirme performance** em produção

O sino agora mostra o número real de visitas em curso e atualiza automaticamente!

