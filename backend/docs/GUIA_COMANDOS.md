# 🚀 Guia de Comandos - SIVI+360°

Este guia contém todos os comandos necessários para executar o SIVI+360° no Windows PowerShell.

## 📋 **Pré-requisitos**

- ✅ Python 3.8+ instalado
- ✅ Node.js 18+ instalado
- ✅ PostgreSQL instalado (opcional)
- ✅ Ambiente virtual ativado

## 🔧 **Configuração Inicial**

### 1. Ativar Ambiente Virtual

```powershell
# Navegar para o diretório do projeto
cd C:\Users\DDS\Documents\SIC_MININT\SIC-SIVIS

# Ativar ambiente virtual
.\venv\Scripts\Activate.ps1
```

### 2. Instalar Dependências

```powershell
# Instalar dependências Python
pip install -r requirements.txt

# Navegar para o frontend
cd frontend-sivis

# Instalar dependências Node.js
npm install

# Voltar para o diretório raiz
cd ..
```

## 🗄️ **Configuração do Banco de Dados**

### Opção A: Usar SQLite (Mais Fácil)

```powershell
# Navegar para o backend
cd backend-sivis

# Executar migrações
python manage.py migrate

# Criar superusuário
python manage.py createsuperuser

# Iniciar servidor
python manage.py runserver
```

### Opção B: Usar PostgreSQL

#### 1. Criar arquivo .env

```powershell
# Executar script para criar .env
.\create-env.ps1
```

#### 2. Configurar PostgreSQL

```powershell
# Conectar ao PostgreSQL
psql -U postgres

# Criar banco de dados
CREATE DATABASE sivis_db;

# Sair do psql
\q
```

#### 3. Executar com PostgreSQL

```powershell
# Navegar para o backend
cd backend-sivis

# Executar migrações
python manage.py migrate --settings=config.settings_development

# Criar superusuário
python manage.py createsuperuser --settings=config.settings_development

# Iniciar servidor
python manage.py runserver --settings=config.settings_development
```

## 🖥️ **Executar o Sistema**

### 1. Backend (Terminal 1)

```powershell
# Navegar para o backend
cd SIC-SIVIS\backend-sivis

# Com SQLite (padrão)
python manage.py runserver

# Com PostgreSQL
python manage.py runserver --settings=config.settings_development
```

### 2. Frontend (Terminal 2)

```powershell
# Navegar para o frontend
cd SIC-SIVIS\frontend-sivis

# Iniciar servidor de desenvolvimento
npm run dev
```

## 🌐 **URLs de Acesso**

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Health**: http://localhost:8000/api/health/
- **Admin Django**: http://localhost:8000/admin/
- **API Docs**: http://localhost:8000/api/schema/swagger-ui/

## 🔍 **Comandos de Verificação**

### Verificar se está funcionando

```powershell
# Testar backend
curl http://localhost:8000/api/health/

# Verificar processos
netstat -an | findstr :8000
netstat -an | findstr :3000
```

### Verificar logs

```powershell
# Ver logs do Django (se configurado)
Get-Content SIC-SIVIS\backend-sivis\logs\django.log -Tail 20

# Ver logs do Node.js
# Os logs aparecem no terminal onde npm run dev está rodando
```

## 🛠️ **Comandos de Manutenção**

### Limpar cache

```powershell
# Limpar cache do frontend
cd SIC-SIVIS\frontend-sivis
Remove-Item -Recurse -Force .next
npm run dev
```

### Resetar banco de dados

```powershell
# SQLite
cd SIC-SIVIS\backend-sivis
Remove-Item db.sqlite3
python manage.py migrate
python manage.py createsuperuser

# PostgreSQL
psql -U postgres -c "DROP DATABASE IF EXISTS sivis_db;"
psql -U postgres -c "CREATE DATABASE sivis_db;"
python manage.py migrate --settings=config.settings_development
python manage.py createsuperuser --settings=config.settings_development
```

### Atualizar dependências

```powershell
# Python
pip install -r requirements.txt --upgrade

# Node.js
cd SIC-SIVIS\frontend-sivis
npm update
```

## 🚨 **Solução de Problemas**

### Erro: "&& is not a valid statement separator"

**Problema**: PowerShell não reconhece `&&`

**Solução**: Use comandos separados:

```powershell
# ❌ Errado
cd SIC-SIVIS/backend-sivis && python manage.py runserver

# ✅ Correto
cd SIC-SIVIS\backend-sivis
python manage.py runserver
```

### Erro: "Module not found"

```powershell
# Reinstalar dependências
pip install -r requirements.txt
```

### Erro: "Port already in use"

```powershell
# Verificar processos
netstat -an | findstr :8000

# Parar processos Python
taskkill /f /im python.exe

# Parar processos Node
taskkill /f /im node.exe
```

### Erro: "Database connection failed"

```powershell
# Usar PostgreSQL para desenvolvimento
python manage.py runserver --settings=config.settings_development
```

## 📝 **Comandos Úteis**

### Desenvolvimento

```powershell
# Executar testes
python manage.py test

# Criar migrações
python manage.py makemigrations

# Aplicar migrações
python manage.py migrate

# Coletar arquivos estáticos
python manage.py collectstatic
```

### Frontend

```powershell
# Build para produção
npm run build

# Executar testes
npm test

# Lint
npm run lint

# Análise de bundle
npm run analyze
```

## 🎯 **Sequência Completa de Inicialização**

### Para SQLite (Recomendado para desenvolvimento)

```powershell
# 1. Ativar ambiente virtual
cd C:\Users\DDS\Documents\SIC_MININT\SIC-SIVIS
.\venv\Scripts\Activate.ps1

# 2. Backend (Terminal 1)
cd backend-sivis
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver

# 3. Frontend (Terminal 2 - novo terminal)
cd SIC-SIVIS\frontend-sivis
npm run dev
```

### Para PostgreSQL

```powershell
# 1. Ativar ambiente virtual
cd C:\Users\DDS\Documents\SIC_MININT\SIC-SIVIS
.\venv\Scripts\Activate.ps1

# 2. Criar .env
.\create-env.ps1

# 3. Configurar PostgreSQL
psql -U postgres -c "CREATE DATABASE sivis_db;"

# 4. Backend (Terminal 1)
cd backend-sivis
python manage.py migrate --settings=config.settings_development
python manage.py createsuperuser --settings=config.settings_development
python manage.py runserver --settings=config.settings_development

# 5. Frontend (Terminal 2 - novo terminal)
cd SIC-SIVIS\frontend-sivis
npm run dev
```

## 📞 **Suporte**

Se encontrar problemas:

1. **Verifique os logs** no terminal
2. **Consulte** `TROUBLESHOOTING.md`
3. **Execute** `.\check-connectivity.sh` (se disponível)
4. **Verifique** se todas as dependências estão instaladas

---

**💡 Dica**: Mantenha este guia aberto durante o desenvolvimento para referência rápida!
