# Funcionalidade de Finalizar Visitas - SIVI+360°

## Visão Geral

A funcionalidade de finalizar visitas permite que usuários autorizados marquem uma visita como concluída, registrando automaticamente a hora de saída e atualizando o status da visita.

## Como Usar

### 1. **Acessar a Lista de Visitas**
- Navegue para `http://localhost:3000/dashboard/visitas`
- Faça login com um usuário autorizado (Portaria, Recepção ou Admin)

### 2. **Identificar Visitas em Curso**
- Visitas em curso aparecem com o badge amarelo "Em Curso"
- Apenas visitas com status "em_curso" podem ser finalizadas

### 3. **Finalizar uma Visita**
- Na coluna "Ações Rápidas", clique no botão verde "Finalizar"
- Um modal de confirmação será exibido
- Confirme a finalização clicando em "Finalizar Visita"

### 4. **Tratamento de Crachás**
- Se a visita possui crachás associados, será exibido um aviso
- É obrigatório marcar a opção "Confirmo que os crachás foram devolvidos"
- Os crachás serão automaticamente desassociados da visita

## Controle de Acesso

### **Usuários Autorizados**
- **Admin**: Pode finalizar qualquer visita
- **Portaria**: Pode finalizar qualquer visita (controle global)
- **Recepção**: Pode finalizar apenas visitas do seu órgão

### **Validações de Segurança**
- ✅ Usuário deve estar autenticado
- ✅ Usuário deve ter permissão para acessar a visita
- ✅ Visita deve estar em status "em_curso"
- ✅ Se houver crachás, deve confirmar devolução

## Interface do Usuário

### **Botão de Finalizar**
- Aparece apenas para visitas "em_curso"
- Cor verde para indicar ação positiva
- Ícone de check para clareza visual

### **Modal de Confirmação**
- **Título**: "Finalizar Visita"
- **Informações**: Número da visita e explicação da ação
- **Avisos**: 
  - Crachás associados (se aplicável)
  - Hora de saída será registrada automaticamente
- **Botões**: Cancelar e Finalizar Visita

### **Feedback Visual**
- Toast de sucesso após finalização
- Atualização automática da tabela
- Badge da visita muda para "Concluída" (verde)

## Fluxo Técnico

### **Frontend**
1. Usuário clica em "Finalizar"
2. Modal de confirmação é exibido
3. Validações são executadas
4. Requisição é enviada para o backend
5. Interface é atualizada

### **Backend**
1. Valida permissões do usuário
2. Verifica se visita está em curso
3. Verifica crachás associados
4. Registra hora de saída
5. Atualiza status para "concluida"
6. Desassocia crachás (se necessário)

## Código Implementado

### **Componente FinalizeVisitaButton**
```typescript
// src/components/visitas/FinalizeVisitaButton.tsx
- Modal de confirmação
- Validação de crachás
- Tratamento de erros
- Feedback visual
```

### **Serviço de API**
```typescript
// src/services/visitaService.ts
export async function finalizeVisita(visitaId: string, options?: { devolver_cracha?: boolean })
```

### **Integração na Tabela**
```typescript
// src/app/dashboard/visitas/columns.tsx
- Nova coluna "Ações Rápidas"
- Botão de finalizar integrado
- Atualização automática
```

## Tratamento de Erros

### **Erros Comuns**
- **400**: Crachás não devolvidos
- **403**: Acesso negado
- **404**: Visita não encontrada
- **500**: Erro interno do servidor

### **Mensagens de Erro**
- Toast de erro com mensagem específica
- Logs detalhados no console
- Fallback para erro genérico

## Logs e Auditoria

### **Frontend**
- Logs de ações do usuário
- Tratamento de erros
- Performance de requisições

### **Backend**
- Logs de finalização de visitas
- Auditoria de permissões
- Rastreamento de crachás

## Testes

### **Cenários de Teste**
1. **Finalização Normal**
   - Visita em curso sem crachás
   - Usuário com permissão
   - Finalização bem-sucedida

2. **Finalização com Crachás**
   - Visita em curso com crachás
   - Confirmação de devolução
   - Desassociação automática

3. **Validações de Segurança**
   - Usuário sem permissão
   - Visita já finalizada
   - Crachás não devolvidos

### **Usuários de Teste**
- **portaria**: Pode finalizar qualquer visita
- **recepcao1**: Pode finalizar apenas visitas da Direção Geral
- **admin**: Pode finalizar qualquer visita

## Melhorias Futuras

### **Funcionalidades Planejadas**
- [ ] Verificação automática de crachás
- [ ] Notificações em tempo real
- [ ] Histórico de finalizações
- [ ] Relatórios de tempo de permanência

### **Otimizações**
- [ ] Atualização sem reload da página
- [ ] Cache de dados de visitas
- [ ] Lazy loading de componentes
- [ ] PWA para uso offline

## Troubleshooting

### **Problemas Comuns**

1. **Botão não aparece**
   - Verificar se visita está "em_curso"
   - Verificar permissões do usuário

2. **Erro de crachás**
   - Confirmar que crachás foram devolvidos
   - Verificar se checkbox está marcado

3. **Erro de permissão**
   - Verificar perfil do usuário
   - Verificar se usuário tem acesso ao órgão

### **Logs Úteis**
```bash
# Frontend (Console do navegador)
console.log('Finalizando visita:', visitaId);

# Backend (Logs do Django)
logger.info(f"Visita {visita.id} finalizada por {user.username}");
```

