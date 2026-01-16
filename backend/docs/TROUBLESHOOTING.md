# Guia de Troubleshooting - SIVI+360°

Este documento contém soluções para problemas comuns encontrados durante o desenvolvimento e uso do SIVI+360°.

## 🌐 Problemas de Conectividade

### Erro: "Network Error" no Frontend

**Sintomas:**
- Console mostra `AxiosError: Network Error`
- Frontend não consegue conectar ao backend
- Erro em `getMe()` ou outras chamadas de API

**Causas Possíveis:**
1. Backend não está rodando
2. Porta incorreta ou conflito de porta
3. CORS não configurado
4. Firewall bloqueando conexões
5. URL da API incorreta

**Soluções:**

#### 1. Verificar se o Backend está Rodando

```bash
# Verificar se o processo está rodando
ps aux | grep python
# ou
netstat -tlnp | grep :8000

# Iniciar o backend
cd SIC-SIVIS/backend-sivis
python manage.py runserver --settings=config.settings_development
```

#### 2. Verificar a URL da API

```bash
# Testar conectividade
curl http://127.0.0.1:8000/api/health/

# Verificar variáveis de ambiente
echo $NEXT_PUBLIC_API_URL
```

#### 3. Configurar Variáveis de Ambiente

Criar arquivo `.env.local` no frontend:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8000/api
```

#### 4. Verificar CORS

No backend, verificar `settings.py`:

```python
CORS_ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]
```

#### 5. Verificar Firewall

```bash
# Ubuntu/Debian
sudo ufw status
sudo ufw allow 8000

# CentOS/RHEL
sudo firewall-cmd --list-ports
sudo firewall-cmd --add-port=8000/tcp --permanent
sudo firewall-cmd --reload
```

### Erro: "Connection Refused"

**Sintomas:**
- `ECONNREFUSED` no console
- Backend não responde

**Soluções:**

1. **Verificar se o backend está rodando:**
   ```bash
   cd SIC-SIVIS/backend-sivis
   python manage.py runserver 0.0.0.0:8000
   ```

2. **Verificar se a porta está livre:**
   ```bash
   lsof -i :8000
   # ou
   netstat -tlnp | grep :8000
   ```

3. **Usar porta diferente:**
   ```bash
   python manage.py runserver 8001
   ```

## 🗄️ Problemas de Banco de Dados

### Erro: "Database Connection Failed" ou "password authentication failed"

**Sintomas:**
- Erro ao conectar ao PostgreSQL
- Migrações falham
- `FATAL: password authentication failed for user "sivis_user"`

**Soluções:**

#### 1. Solução Rápida - Configurar PostgreSQL

```bash
# Configurar PostgreSQL para desenvolvimento
cd SIC-SIVIS/backend-sivis
python manage.py runserver --settings=config.settings_development
```

#### 2. Configurar PostgreSQL (Windows)

```powershell
# Execute como Administrador
cd SIC-SIVIS
.\setup-postgresql-windows.ps1
```

#### 3. Configurar PostgreSQL (Linux/Mac)

```bash
# Verificar se está rodando
sudo systemctl status postgresql

# Iniciar se necessário
sudo systemctl start postgresql

# Verificar conexão
sudo -u postgres psql -c "SELECT 1;"
```

#### 2. Verificar Configurações

```bash
# Verificar arquivo .env
cat SIC-SIVIS/backend-sivis/.env

# Testar conexão
cd SIC-SIVIS/backend-sivis
python manage.py dbshell
```

#### 3. Recriar Banco de Dados

```bash
# Fazer backup
pg_dump -h localhost -U sivis_user -d sivis_development > backup.sql

# Recriar banco
sudo -u postgres psql -c "DROP DATABASE IF EXISTS sivis_development;"
sudo -u postgres psql -c "CREATE DATABASE sivis_development OWNER sivis_user;"

# Aplicar migrações
python manage.py migrate --settings=config.settings_development
```

## 🔐 Problemas de Autenticação

### Erro: "Token Invalid" ou "Unauthorized"

**Sintomas:**
- Usuário é redirecionado para login
- Erro 401 em todas as requisições

**Soluções:**

#### 1. Limpar Tokens

```javascript
// No console do navegador
localStorage.removeItem('accessToken');
localStorage.removeItem('refreshToken');
```

#### 2. Verificar Configuração JWT

No backend `settings.py`:

```python
SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
    'ROTATE_REFRESH_TOKENS': True,
}
```

#### 3. Recriar Superusuário

```bash
cd SIC-SIVIS/backend-sivis
python manage.py createsuperuser --settings=config.settings_development
```

## 📦 Problemas de Dependências

### Erro: "Module Not Found"

**Sintomas:**
- `ModuleNotFoundError` no Python
- `Cannot resolve module` no Node.js

**Soluções:**

#### Backend (Python)

```bash
# Reinstalar dependências
cd SIC-SIVIS
pip install -r requirements.txt

# Verificar ambiente virtual
which python
pip list
```

#### Frontend (Node.js)

```bash
# Limpar cache e reinstalar
cd SIC-SIVIS/frontend-sivis
rm -rf node_modules package-lock.json
npm install

# Verificar versões
node --version
npm --version
```

## 🐳 Problemas com Docker

### Erro: "Container Won't Start"

**Sintomas:**
- Containers falham ao iniciar
- Erro de conectividade entre containers

**Soluções:**

#### 1. Verificar Docker

```bash
# Verificar se Docker está rodando
docker --version
docker-compose --version

# Verificar containers
docker ps -a
```

#### 2. Rebuild Containers

```bash
# Parar e remover containers
docker-compose -f docker-compose.production.yml down

# Rebuild
docker-compose -f docker-compose.production.yml up --build
```

#### 3. Verificar Logs

```bash
# Ver logs dos containers
docker-compose -f docker-compose.production.yml logs backend
docker-compose -f docker-compose.production.yml logs frontend
```

## 🔧 Ferramentas de Debug

### 1. Health Check

```bash
# Verificar status do backend
curl http://127.0.0.1:8000/api/health/

# Resposta esperada:
{
  "status": "healthy",
  "timestamp": "2024-01-01T12:00:00Z",
  "services": {
    "database": "healthy",
    "cache": "healthy",
    "redis": "healthy"
  }
}
```

### 2. Logs do Backend

```bash
# Ver logs em tempo real
tail -f /var/log/sivis/django.log

# Ou no desenvolvimento
python manage.py runserver --verbosity=2
```

### 3. Network Debug

```bash
# Verificar conectividade
ping 127.0.0.1
telnet 127.0.0.1 8000

# Verificar portas abertas
netstat -tlnp | grep :8000
```

### 4. Browser DevTools

```javascript
// No console do navegador
// Verificar variáveis de ambiente
console.log(process.env.NEXT_PUBLIC_API_URL);

// Testar API diretamente
fetch('http://127.0.0.1:8000/api/health/')
  .then(response => response.json())
  .then(data => console.log(data));
```

## 📞 Suporte

Se o problema persistir:

1. **Verificar logs completos**
2. **Documentar passos para reproduzir**
3. **Incluir informações do sistema:**
   - Sistema operacional
   - Versões do Python/Node.js
   - Logs de erro completos

**Contato:**
- 📧 Email: suporte@sivis.com
- 📱 Telefone: +244 XXX XXX XXX
- 🌐 Website: https://sivis.com

---

**Última atualização:** $(date)
