#!/bin/bash

# Define o diretório do projeto frontend
FRONTEND_DIR="/home/dds/sivis-app/frontend"
PM2_CONFIG="ecosystem.config.js"

# Muda para o diretório do projeto
cd "$FRONTEND_DIR" || { echo "ERRO: Não foi possível acessar o diretório $FRONTEND_DIR" >&2; exit 1; }

# Reinicia a aplicação PM2 usando a configuração existente
echo "Iniciando restart da aplicação PM2..."
/usr/bin/pm2 restart "$PM2_CONFIG"

if [ $? -eq 0 ]; then
    echo "PM2 reiniciado com sucesso."
    exit 0 # Sucesso
else
    echo "ERRO ao reiniciar PM2. Verifique se o PM2 está instalado e se o usuário 'dds' pode acessá-lo." >&2
    exit 1 # Falha no PM2
fi
