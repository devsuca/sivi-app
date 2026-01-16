# SIVI+360° Frontend

Frontend do Sistema Integrado de Visitas e Segurança, construído com Next.js 14, TypeScript e Tailwind CSS.

## 🚀 Tecnologias

- **Framework**: Next.js 14 (App Router)
- **Linguagem**: TypeScript
- **Estilização**: Tailwind CSS + shadcn/ui
- **Componentes**: Radix UI + Lucide React
- **Formulários**: React Hook Form + Zod
- **Tabelas**: TanStack Table
- **Estado**: React Context + Zustand
- **HTTP Client**: Axios
- **Exportação**: XLSX, jsPDF
- **Testes**: Jest + React Testing Library

## 📁 Estrutura do Projeto

```
src/
├── app/                    # App Router (Next.js 14)
│   ├── dashboard/         # Páginas do dashboard
│   ├── login/            # Página de login
│   ├── layout.tsx        # Layout principal
│   └── page.tsx          # Página inicial
├── components/            # Componentes React
│   ├── ui/               # Componentes base (shadcn/ui)
│   ├── layout/           # Componentes de layout
│   ├── pessoas/          # Componentes de pessoas
│   ├── visitas/          # Componentes de visitas
│   └── data-table/       # Componentes de tabela
├── context/              # React Context
├── hooks/                # Custom hooks
├── services/             # Serviços API
├── types/                # Definições TypeScript
├── utils/                # Utilitários
└── lib/                  # Configurações de bibliotecas
```

## 🛠️ Instalação e Configuração

### Pré-requisitos

- Node.js 18+
- npm ou yarn
- Backend SIVI+360° rodando

### 1. Instalar Dependências

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

```bash
cp .env.local.example .env.local
```

Edite o arquivo `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:8000/api
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api
NEXT_PUBLIC_APP_NAME=SIVI+360°
NEXT_PUBLIC_APP_VERSION=1.0.0
```

### 3. Executar em Desenvolvimento

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000) no seu navegador.

## 🧪 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build de produção
npm run build

# Iniciar servidor de produção
npm start

# Lint
npm run lint

# Lint com correção automática
npm run lint:fix

# Testes
npm test

# Testes em modo watch
npm run test:watch

# Análise do bundle
npm run analyze
```

## 🎨 Componentes

### Componentes Base (shadcn/ui)

- Button, Input, Select, Textarea
- Card, Dialog, Sheet, Tabs
- Table, Badge, Avatar
- Form, Label, Checkbox, Radio
- Toast, Alert, Skeleton

### Componentes Customizados

- **DashboardLayout**: Layout principal do dashboard
- **DataTable**: Tabela com filtros e paginação
- **VisitanteSearch**: Busca de visitantes
- **PertencesManager**: Gerenciador de pertences
- **ExportFiltersModal**: Modal para filtros de exportação

## 🔐 Autenticação

O sistema usa JWT para autenticação:

```typescript
// Context de autenticação
const { user, login, logout, isAuthenticated } = useAuth();

// Hook para verificar permissões
const { hasPermission } = usePermissions();
```

## 📊 Funcionalidades

### Gestão de Visitas
- Listagem com filtros avançados
- Criação e edição de visitas
- Detalhes da visita
- Exportação (PDF, Excel, Impressão)

### Gestão de Pessoas
- CRUD de pessoas
- Busca por documento
- Conversão de acompanhantes em visitantes

### Sistema de Permissões
- Perfis: Admin, Portaria, Secretaria, Recepção
- Controle de acesso baseado em roles
- Restrições específicas por perfil

### Exportação e Relatórios
- Exportação para Excel (XLSX)
- Exportação para PDF (jsPDF)
- Impressão direta
- Filtros avançados

## 🚀 Deploy

### Build de Produção

```bash
npm run build
```

### Deploy com Docker

```bash
# Build da imagem
docker build -f Dockerfile.production -t sivis-frontend .

# Executar container
docker run -p 3000:3000 sivis-frontend
```

### Deploy Tradicional

```bash
# Build
npm run build

# Iniciar servidor
npm start
```

## 🧪 Testes

```bash
# Executar todos os testes
npm test

# Testes em modo watch
npm run test:watch

# Testes com coverage
npm run test:coverage
```

## 📚 Documentação

- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS](https://tailwindcss.com/docs)
- [shadcn/ui](https://ui.shadcn.com/)
- [TanStack Table](https://tanstack.com/table)
- [React Hook Form](https://react-hook-form.com/)

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📄 Licença

Este projeto está licenciado sob a licença MIT.

---

**SIVI+360° Frontend** - Sistema Integrado de Visitas e Segurança
