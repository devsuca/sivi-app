# Guia de Deploy para Produção - SIVI+360°

Este documento contém todas as instruções necessárias para fazer o deploy do SIVI+360° em um ambiente de produção.

## 📋 Pré-requisitos

### Servidor
- **Sistema Operacional**: Ubuntu 20.04+ ou Debian 11+
- **RAM**: Mínimo 4GB (Recomendado: 8GB+)
- **CPU**: Mínimo 2 cores (Recomendado: 4+ cores)
- **Disco**: Mínimo 50GB (Recomendado: 100GB+ SSD)
- **Rede**: Acesso à internet e domínio configurado

### Software Necessário
- Python 3.8+
- Node.js 18+
- PostgreSQL 12+
- Redis 6+
- Nginx
- SSL Certificate (Let's Encrypt recomendado)

## 🚀 Deploy Automático

### 1. Preparar o Servidor

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências básicas
sudo apt install -y curl wget git unzip

# Clonar o repositório
git clone <seu-repositorio> /tmp/sivis
cd /tmp/sivis
```

### 2. Executar Script de Deploy

```bash
# Tornar o script executável
chmod +x deploy.sh

# Executar deploy (como root)
sudo ./deploy.sh
```

O script irá:
- ✅ Instalar todas as dependências
- ✅ Configurar PostgreSQL e Redis
- ✅ Configurar ambiente virtual Python
- ✅ Instalar dependências do frontend
- ✅ Configurar Nginx
- ✅ Configurar systemd services
- ✅ Configurar firewall
- ✅ Iniciar todos os serviços

## 🔧 Deploy Manual

### 1. Instalar Dependências do Sistema

```bash
# Atualizar sistema
sudo apt update && sudo apt upgrade -y

# Instalar dependências
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx postgresql postgresql-contrib redis-server supervisor git curl

# Instalar Node.js 18+ se necessário
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Instalar PM2
sudo npm install -g pm2
```

### 2. Configurar PostgreSQL

```bash
# Executar script de configuração automática
chmod +x setup-postgresql.sh
sudo ./setup-postgresql.sh

# Ou configurar manualmente:
# Acessar PostgreSQL
sudo -u postgres psql

# Criar database e usuário
CREATE DATABASE sivis_development;
CREATE DATABASE sivis_production;
CREATE USER sivis_user WITH PASSWORD 'sua_senha_segura';
GRANT ALL PRIVILEGES ON DATABASE sivis_development TO sivis_user;
GRANT ALL PRIVILEGES ON DATABASE sivis_production TO sivis_user;
\q
```

### 3. Configurar Backend

```bash
# Criar diretório do projeto
sudo mkdir -p /var/www/sivis
sudo cp -r backend-sivis /var/www/sivis/
sudo cp -r frontend-sivis /var/www/sivis/

# Configurar ambiente virtual
cd /var/www/sivis/backend-sivis
sudo python3 -m venv ../venv
sudo ../venv/bin/pip install --upgrade pip
sudo ../venv/bin/pip install -r requirements.txt

# Configurar variáveis de ambiente
sudo cp development.env.example .env
sudo nano .env  # Editar com suas configurações

# Migrar dados do SQLite para PostgreSQL (se necessário)
chmod +x migrate-to-postgresql.sh
./migrate-to-postgresql.sh

# Executar migrações
sudo ../venv/bin/python manage.py migrate --settings=config.settings_development
sudo ../venv/bin/python manage.py collectstatic --noinput --settings=config.settings_development
sudo ../venv/bin/python manage.py createsuperuser --settings=config.settings_development
```

### 4. Configurar Frontend

```bash
cd /var/www/sivis/frontend-sivis

# Instalar dependências
sudo npm install

# Build de produção
sudo npm run build

# Configurar PM2
sudo pm2 start npm --name "sivis-frontend" -- start
sudo pm2 save
sudo pm2 startup
```

### 5. Configurar Nginx

```bash
# Copiar configuração
sudo cp nginx.conf /etc/nginx/sites-available/sivis

# Editar configuração
sudo nano /etc/nginx/sites-available/sivis

# Ativar site
sudo ln -s /etc/nginx/sites-available/sivis /etc/nginx/sites-enabled/
sudo rm /etc/nginx/sites-enabled/default

# Testar configuração
sudo nginx -t

# Reiniciar Nginx
sudo systemctl restart nginx
```

### 6. Configurar SSL (Let's Encrypt)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obter certificado
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Configurar renovação automática
sudo crontab -e
# Adicionar: 0 12 * * * /usr/bin/certbot renew --quiet
```

### 7. Configurar Systemd Services

```bash
# Copiar arquivos de serviço
sudo cp backend-sivis/sivis-backend.service /etc/systemd/system/
sudo cp frontend-sivis/sivis-frontend.service /etc/systemd/system/

# Recarregar systemd
sudo systemctl daemon-reload

# Habilitar e iniciar serviços
sudo systemctl enable sivis-backend
sudo systemctl start sivis-backend
sudo systemctl enable nginx
sudo systemctl start nginx
```

## 🔒 Configurações de Segurança

### 1. Firewall

```bash
# Configurar UFW
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw --force enable
```

### 2. Variáveis de Ambiente Seguras

```bash
# Gerar SECRET_KEY segura
python3 -c 'from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())'

# Configurar no .env
SECRET_KEY=sua_chave_secreta_aqui
DEBUG=False
ALLOWED_HOSTS=your-domain.com,www.your-domain.com
```

### 3. Permissões de Arquivos

```bash
# Configurar permissões
sudo chown -R www-data:www-data /var/www/sivis
sudo chmod -R 755 /var/www/sivis
sudo chmod 600 /var/www/sivis/backend-sivis/.env
```

## 📊 Monitoramento

### 1. Configurar Backup Automático

```bash
# Tornar script executável
sudo chmod +x backup.sh

# Configurar cron
sudo crontab -e
# Adicionar: 0 2 * * * /var/www/sivis/backup.sh
```

### 2. Configurar Monitoramento

```bash
# Tornar script executável
sudo chmod +x monitor.sh

# Configurar cron
sudo crontab -e
# Adicionar: */5 * * * * /var/www/sivis/monitor.sh
```

### 3. Verificar Status dos Serviços

```bash
# Status dos serviços
sudo systemctl status sivis-backend
sudo systemctl status nginx
sudo systemctl status postgresql
sudo systemctl status redis
pm2 status

# Logs
sudo journalctl -u sivis-backend -f
sudo tail -f /var/log/sivis/django.log
pm2 logs sivis-frontend
```

## 🔧 Comandos Úteis

### Gerenciamento de Serviços

```bash
# Reiniciar backend
sudo systemctl restart sivis-backend

# Reiniciar frontend
pm2 restart sivis-frontend

# Reiniciar Nginx
sudo systemctl restart nginx

# Ver logs em tempo real
sudo journalctl -u sivis-backend -f
```

### Backup e Restore

```bash
# Backup manual
sudo ./backup.sh

# Restore do banco
sudo -u postgres psql -d sivis_production < backup/database_YYYYMMDD_HHMMSS.sql

# Restore de arquivos
sudo tar -xzf backup/media_YYYYMMDD_HHMMSS.tar.gz -C /var/www/sivis/backend-sivis/
```

### Atualizações

```bash
# Atualizar código
cd /var/www/sivis
sudo git pull origin main

# Atualizar backend
cd backend-sivis
sudo ../venv/bin/pip install -r requirements.txt
sudo ../venv/bin/python manage.py migrate --settings=config.settings_production
sudo ../venv/bin/python manage.py collectstatic --noinput --settings=config.settings_production
sudo systemctl restart sivis-backend

# Atualizar frontend
cd ../frontend-sivis
sudo npm install
sudo npm run build
pm2 restart sivis-frontend
```

## 🚨 Troubleshooting

### Problemas Comuns

1. **Erro 502 Bad Gateway**
   ```bash
   # Verificar se o backend está rodando
   sudo systemctl status sivis-backend
   sudo journalctl -u sivis-backend -f
   ```

2. **Erro de Permissão**
   ```bash
   # Corrigir permissões
   sudo chown -R www-data:www-data /var/www/sivis
   sudo chmod -R 755 /var/www/sivis
   ```

3. **Erro de Banco de Dados**
   ```bash
   # Verificar conexão
   sudo -u postgres psql -d sivis_production -c "SELECT 1;"
   ```

4. **Erro de SSL**
   ```bash
   # Renovar certificado
   sudo certbot renew --dry-run
   ```

### Logs Importantes

- **Backend**: `/var/log/sivis/django.log`
- **Nginx**: `/var/log/nginx/error.log`
- **Systemd**: `sudo journalctl -u sivis-backend`
- **PM2**: `pm2 logs sivis-frontend`

## 📞 Suporte

Para suporte técnico:
- 📧 Email: suporte@sivis.com
- 📱 Telefone: +244 XXX XXX XXX
- 🌐 Website: https://sivis.com

## 📝 Changelog

- **v1.0.0** - Deploy inicial
- **v1.1.0** - Adicionado monitoramento
- **v1.2.0** - Melhorias de segurança
