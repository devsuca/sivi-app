# Configuração do PostgreSQL para SIVI+360°

Este documento contém todas as instruções para configurar o PostgreSQL como banco de dados do SIVI+360°.

## 🐘 Por que PostgreSQL?

- **Performance**: Melhor performance para aplicações web
- **Concorrência**: Suporte nativo a múltiplas conexões simultâneas
- **Recursos Avançados**: JSON, arrays, full-text search, etc.
- **Escalabilidade**: Suporte a grandes volumes de dados
- **Confiabilidade**: ACID compliance e transações robustas
- **Backup**: Ferramentas avançadas de backup e recuperação

## 🚀 Instalação Rápida

### 1. Configuração Automática

```bash
# Executar script de configuração
chmod +x setup-postgresql.sh
sudo ./setup-postgresql.sh
```

### 2. Configuração Manual

#### Ubuntu/Debian
```bash
# Instalar PostgreSQL
sudo apt update
sudo apt install -y postgresql postgresql-contrib python3-psycopg2

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

#### CentOS/RHEL
```bash
# Instalar PostgreSQL
sudo yum install -y postgresql-server postgresql-contrib python3-psycopg2

# Inicializar banco
sudo postgresql-setup initdb

# Iniciar serviço
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

## 🔧 Configuração do Banco de Dados

### 1. Criar Usuário e Bancos

```bash
# Acessar PostgreSQL como superusuário
sudo -u postgres psql

# Criar usuário
CREATE USER sivis_user WITH PASSWORD 'sivis_password';

# Criar bancos de dados
CREATE DATABASE sivis_development OWNER sivis_user;
CREATE DATABASE sivis_production OWNER sivis_user;

# Conceder privilégios
GRANT ALL PRIVILEGES ON DATABASE sivis_development TO sivis_user;
GRANT ALL PRIVILEGES ON DATABASE sivis_production TO sivis_user;

# Conceder privilégios no schema public
\c sivis_development
GRANT ALL ON SCHEMA public TO sivis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sivis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sivis_user;

\c sivis_production
GRANT ALL ON SCHEMA public TO sivis_user;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO sivis_user;
GRANT ALL PRIVILEGES ON ALL SEQUENCES IN SCHEMA public TO sivis_user;

# Sair
\q
```

### 2. Configurar Autenticação

Editar `/etc/postgresql/*/main/pg_hba.conf`:

```bash
# Local connections
local   all             all                                     peer
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Reiniciar PostgreSQL:
```bash
sudo systemctl restart postgresql
```

## 🔄 Migração do SQLite para PostgreSQL

### 1. Migração Automática

```bash
# Executar script de migração
chmod +x migrate-to-postgresql.sh
./migrate-to-postgresql.sh
```

### 2. Migração Manual

```bash
# Fazer backup do SQLite
cp db.sqlite3 db.sqlite3.backup

# Exportar dados do SQLite
python manage.py dumpdata --natural-foreign --natural-primary --indent=2 > data_dump.json

# Configurar Django para PostgreSQL
# (Editar settings.py para usar PostgreSQL)

# Aplicar migrações
python manage.py migrate

# Importar dados
python manage.py loaddata data_dump.json

# Verificar migração
python manage.py shell -c "
from django.contrib.auth.models import User
from apps.pessoas.models import Pessoa
from apps.visitas.models import Visita
print(f'Users: {User.objects.count()}')
print(f'Pessoas: {Pessoa.objects.count()}')
print(f'Visitas: {Visita.objects.count()}')
"
```

## ⚙️ Configurações do Django

### 1. Settings de Desenvolvimento

```python
# config/settings_development.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': 'sivis_development',
        'USER': 'sivis_user',
        'PASSWORD': 'sivis_password',
        'HOST': 'localhost',
        'PORT': '5432',
        'OPTIONS': {
            'sslmode': 'prefer',
        },
    }
}
```

### 2. Settings de Produção

```python
# config/settings_production.py
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': os.environ.get('DB_NAME', 'sivis_production'),
        'USER': os.environ.get('DB_USER', 'sivis_user'),
        'PASSWORD': os.environ.get('DB_PASSWORD', 'sivis_password'),
        'HOST': os.environ.get('DB_HOST', 'localhost'),
        'PORT': os.environ.get('DB_PORT', '5432'),
        'OPTIONS': {
            'sslmode': 'prefer',
        },
    }
}
```

## 📦 Dependências Python

Adicionar ao `requirements.txt`:

```txt
psycopg2-binary>=2.9.0
gunicorn>=21.0.0
```

Instalar:
```bash
pip install psycopg2-binary gunicorn
```

## 🔍 Verificação e Testes

### 1. Testar Conexão

```bash
# Testar conexão direta
psql -h localhost -U sivis_user -d sivis_development

# Testar com Django
python manage.py check --database default
python manage.py dbshell
```

### 2. Verificar Performance

```bash
# Verificar conexões ativas
sudo -u postgres psql -c "SELECT * FROM pg_stat_activity;"

# Verificar tamanho do banco
sudo -u postgres psql -c "SELECT pg_size_pretty(pg_database_size('sivis_development'));"

# Verificar tabelas
python manage.py shell -c "
from django.db import connection
cursor = connection.cursor()
cursor.execute('SELECT tablename FROM pg_tables WHERE schemaname = %s', ['public'])
print(cursor.fetchall())
"
```

## 🛠️ Comandos Úteis

### Gerenciamento de Banco

```bash
# Conectar ao banco
psql -h localhost -U sivis_user -d sivis_development

# Listar bancos
sudo -u postgres psql -l

# Backup
pg_dump -h localhost -U sivis_user -d sivis_development > backup.sql

# Restore
psql -h localhost -U sivis_user -d sivis_development < backup.sql

# Verificar status
sudo systemctl status postgresql

# Reiniciar
sudo systemctl restart postgresql
```

### Django Management

```bash
# Migrações
python manage.py makemigrations
python manage.py migrate

# Shell do banco
python manage.py dbshell

# Verificar integridade
python manage.py check --database default

# Resetar banco (CUIDADO!)
python manage.py flush
```

## 🔒 Segurança

### 1. Configurações de Segurança

```bash
# Editar postgresql.conf
sudo nano /etc/postgresql/*/main/postgresql.conf

# Configurações recomendadas:
listen_addresses = 'localhost'
port = 5432
max_connections = 100
shared_buffers = 256MB
effective_cache_size = 1GB
```

### 2. Firewall

```bash
# Permitir apenas conexões locais
sudo ufw allow from 127.0.0.1 to any port 5432
sudo ufw deny 5432
```

### 3. Backup Automático

```bash
# Adicionar ao crontab
0 2 * * * pg_dump -h localhost -U sivis_user -d sivis_production > /backup/sivis_$(date +\%Y\%m\%d).sql
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro de Conexão**
   ```bash
   # Verificar se PostgreSQL está rodando
   sudo systemctl status postgresql
   
   # Verificar logs
   sudo journalctl -u postgresql -f
   ```

2. **Erro de Permissão**
   ```bash
   # Verificar pg_hba.conf
   sudo nano /etc/postgresql/*/main/pg_hba.conf
   
   # Reiniciar PostgreSQL
   sudo systemctl restart postgresql
   ```

3. **Erro de Autenticação**
   ```bash
   # Verificar usuário e senha
   sudo -u postgres psql -c "SELECT usename FROM pg_user;"
   
   # Recriar usuário se necessário
   sudo -u postgres psql -c "DROP USER IF EXISTS sivis_user;"
   sudo -u postgres psql -c "CREATE USER sivis_user WITH PASSWORD 'sivis_password';"
   ```

4. **Erro de Encoding**
   ```bash
   # Verificar encoding do banco
   sudo -u postgres psql -c "SELECT datname, encoding FROM pg_database;"
   
   # Recriar banco com encoding correto
   sudo -u postgres psql -c "DROP DATABASE IF EXISTS sivis_development;"
   sudo -u postgres psql -c "CREATE DATABASE sivis_development WITH ENCODING 'UTF8' OWNER sivis_user;"
   ```

## 📊 Monitoramento

### 1. Logs

```bash
# Logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log

# Logs do Django
tail -f logs/django.log
```

### 2. Performance

```bash
# Verificar queries lentas
sudo -u postgres psql -c "SELECT query, mean_time, calls FROM pg_stat_statements ORDER BY mean_time DESC LIMIT 10;"

# Verificar conexões
sudo -u postgres psql -c "SELECT count(*) FROM pg_stat_activity;"
```

## 📚 Recursos Adicionais

- [Documentação Oficial do PostgreSQL](https://www.postgresql.org/docs/)
- [Django PostgreSQL Guide](https://docs.djangoproject.com/en/stable/ref/databases/#postgresql-notes)
- [psycopg2 Documentation](https://www.psycopg.org/docs/)

## 🆘 Suporte

Para suporte técnico:
- 📧 Email: suporte@sivis.com
- 📱 Telefone: +244 XXX XXX XXX
- 🌐 Website: https://sivis.com
