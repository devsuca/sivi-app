# SIVI+360° API (backend-sivis)

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](https://example.com/build-status)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](../LICENSE)
[![Python Version](https://img.shields.io/badge/python-3.8+-blue.svg)](https://www.python.org/downloads/)
[![Django Version](https://img.shields.io/badge/django-5.2-blue.svg)](https://www.djangoproject.com/)
[![DRF Version](https://img.shields.io/badge/DRF-3.16-blue.svg)](https://www.django-rest-framework.org/)
[![PostgreSQL](https://img.shields.io/badge/database-PostgreSQL-blue)](https://postgresql.org)

API robusta e segura para o **Sistema Integrado de Visitas e Segurança (SIVI+360°)**, desenvolvida com Django e Django Rest Framework.

## 📋 Descrição

Este backend serve como o núcleo do SIVI+360°, fornecendo uma API RESTful para gerenciar todas as operações críticas do sistema, incluindo o controlo de acessos, registo de visitas, gestão de pertences e emissão de crachás.

## 🚀 Principais Funcionalidades

*   **🔐 Gestão de Identidade e Acesso:** Autenticação segura baseada em JWT e sistema de permissões baseado em perfis
*   **👥 Gestão de Pessoas:** Cadastro e gestão de visitantes, funcionários e acompanhantes
*   **📅 Controlo de Visitas:** Agendamento, registo de entrada/saída e histórico completo
*   **🎒 Gestão de Pertences:** Registo e controlo de objetos deixados na recepção
*   **🚪 Controlo de Acessos:** Gestão de áreas restritas e permissões de acesso
*   **🆔 Emissão de Crachás:** Geração e gestão de crachás de identificação
*   **📞 Registo de Atendimentos:** Rastreamento de atendimentos e serviços prestados
*   **📊 Relatórios e Exportação:** Geração de relatórios em PDF e Excel
*   **🔍 Busca Avançada:** Pesquisa por documento em visitantes e acompanhantes

## 📚 Documentação da API

A documentação completa da API é gerada automaticamente usando `drf-spectacular` e está disponível em formato Swagger UI e ReDoc. Após iniciar o servidor, aceda aos seguintes endpoints:

*   **Swagger UI:** [`http://127.0.0.1:8000/api/schema/swagger-ui/`](http://127.0.0.1:8000/api/schema/swagger-ui/)
*   **ReDoc:** [`http://127.0.0.1:8000/api/schema/redoc/`](http://127.0.0.1:8000/api/schema/redoc/)
*   **Schema (YAML):** [`http://127.0.0.1:8000/api/schema/`](http://127.0.0.1:8000/api/schema/)

## 🛠️ Tecnologias Utilizadas

*   **Framework:** Django 5.2, Django Rest Framework (DRF)
*   **Autenticação:** Django Rest Framework Simple JWT
*   **Base de Dados:** PostgreSQL (desenvolvimento e produção)
*   **Servidor WSGI:** Gunicorn
*   **Cache:** Redis
*   **Documentação API:** `drf-spectacular` (OpenAPI 3)
*   **Validação e Filtragem:** `django-filter`
*   **CORS:** `django-cors-headers`
*   **Testes:** `pytest`, `pytest-django`, `factory-boy`
*   **Processamento de Imagens:** `Pillow`
*   **Driver PostgreSQL:** `psycopg2-binary`

## 📋 Pré-requisitos

*   **Python 3.8+**
*   **PostgreSQL 12+**
*   **Redis 6+** (opcional para cache)
*   **Git**

## 🚀 Instalação e Configuração

### 1. Configurar PostgreSQL

```bash
# Configuração automática
chmod +x ../setup-postgresql.sh
sudo ../setup-postgresql.sh

# Ou configurar manualmente (ver POSTGRESQL_SETUP.md)
```

### 2. Clonar e Configurar o Projeto

```bash
# Clonar o repositório
git clone https://github.com/seu-usuario/SIC-SIVIS.git
cd SIC-SIVI

# Criar e ativar ambiente virtual
python -m venv venv
# Windows
.\venv\Scripts\activate
# macOS/Linux
source venv/bin/activate

# Instalar dependências
pip install -r requirements.txt
```

### 3. Configurar Backend

```bash
cd backend-sivis

# Configurar variáveis de ambiente
cp ../development.env.example .env
# Editar .env com suas configurações

# Migrar dados do SQLite (se necessário)
chmod +x ../migrate-to-postgresql.sh
../migrate-to-postgresql.sh

# Aplicar migrações
python manage.py migrate --settings=config.settings_development

# Criar superutilizador
python manage.py createsuperuser --settings=config.settings_development
```

## ▶️ Execução

### Servidor de Desenvolvimento teste

```bash
# Desenvolvimento
python manage.py runserver --settings=config.settings_development

# Produção
python manage.py runserver --settings=config.settings_production
```

O backend estará disponível em `http://127.0.0.1:8000/`.

### Servidor de Produção (Gunicorn)

```bash
# Usando Gunicorn
gunicorn --config gunicorn.conf.py config.wsgi_production:application
```

### Testes

```bash
# Usando pytest
pytest

# Usando Django
python manage.py test --settings=config.settings_development

# Com coverage
pytest --cov=apps
```

## 📁 Estrutura do Projeto

```
backend-sivis/
├── apps/                           # Módulos da aplicação
│   ├── authentication/            # Gestão de utilizadores e autenticação
│   ├── pessoas/                   # Gestão de visitantes, funcionários, etc.
│   ├── visitas/                   # Gestão de visitas
│   ├── pertences/                 # Gestão de pertences
│   ├── acessos/                   # Controlo de acessos
│   ├── atendimento/               # Registo de atendimentos
│   ├── crachas/                   # Emissão de crachás
│   ├── usuarios/                  # Gestão de utilizadores
│   ├── configuracoes/             # Configurações do sistema
│   ├── relatorios/                # Relatórios
│   └── core/                      # Funcionalidades centrais
├── config/                        # Configurações do projeto Django
│   ├── settings.py                # Configurações de desenvolvimento
│   ├── settings_production.py     # Configurações de produção
│   ├── settings_development.py    # Configurações específicas dev
│   ├── wsgi_production.py         # WSGI para produção
│   └── asgi_production.py         # ASGI para produção
├── tests/                         # Testes de integração e factories
├── manage.py                      # Utilitário de linha de comando
├── gunicorn.conf.py               # Configuração Gunicorn
├── docs/                          # Documentação
│   └── controle_acesso.md         # Documentação de permissões
└── README.md                      # Este arquivo
```

## 🔧 Comandos Úteis

### Desenvolvimento

```bash
# Migrações
python manage.py makemigrations
python manage.py migrate --settings=config.settings_development

# Shell do Django
python manage.py shell --settings=config.settings_development

# Coletar arquivos estáticos
python manage.py collectstatic --settings=config.settings_development

# Criar superusuário
python manage.py createsuperuser --settings=config.settings_development

# Verificar configurações
python manage.py check --settings=config.settings_development
```

### Produção

```bash
# Migrações
python manage.py migrate --settings=config.settings_production

# Coletar arquivos estáticos
python manage.py collectstatic --noinput --settings=config.settings_production

# Iniciar com Gunicorn
gunicorn --config gunicorn.conf.py config.wsgi_production:application
```

## 🚀 Deploy

### Deploy Tradicional

```bash
# Deploy completo
chmod +x ../deploy.sh
sudo ../deploy.sh
```

### Deploy com Docker

```bash
# Deploy com Docker
chmod +x ../deploy-docker.sh
sudo ../deploy-docker.sh
```

## 📚 Documentação

- [Controle de Acesso](docs/controle_acesso.md) - Documentação de permissões
- [Deploy em Produção](../DEPLOY_PRODUCTION.md) - Guia de deploy
- [Configuração PostgreSQL](../POSTGRESQL_SETUP.md) - Setup do banco de dados
- [API Documentation](http://localhost:8000/api/schema/swagger-ui/) - Swagger UI

## 📄 Licença

Este projeto está licenciado sob a licença MIT. Consulte o arquivo `LICENSE` na raiz do projeto para mais detalhes.

---

**SIVI+360° Backend** - Sistema Integrado de Visitas e Segurança
