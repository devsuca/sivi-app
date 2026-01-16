# Script para corrigir erro do Next.js 15.5.4
Write-Host "🔧 Corrigindo erro do Next.js..." -ForegroundColor Yellow

# Parar o servidor se estiver rodando
Write-Host "⏹️ Parando servidor..." -ForegroundColor Blue
Get-Process -Name "node" -ErrorAction SilentlyContinue | Where-Object { $_.CommandLine -like "*next*" } | Stop-Process -Force

# Limpar cache do Next.js
Write-Host "🧹 Limpando cache..." -ForegroundColor Blue
if (Test-Path ".next") { Remove-Item -Recurse -Force ".next" }
if (Test-Path "node_modules/.cache") { Remove-Item -Recurse -Force "node_modules/.cache" }

# Limpar cache do npm/pnpm
Write-Host "🧹 Limpando cache do pnpm..." -ForegroundColor Blue
pnpm store prune

# Reinstalar dependências
Write-Host "📦 Reinstalando dependências..." -ForegroundColor Blue
pnpm install

# Iniciar servidor
Write-Host "🚀 Iniciando servidor..." -ForegroundColor Green
pnpm dev
