# Script para corrigir dependências e resolver problemas de compatibilidade
Write-Host "🔧 Iniciando correção de dependências..." -ForegroundColor Green

# Parar processos em execução
Write-Host "⏹️ Parando processos em execução..." -ForegroundColor Yellow
Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force -ErrorAction SilentlyContinue

# Limpar cache e dependências
Write-Host "🧹 Limpando cache e dependências..." -ForegroundColor Yellow
Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue
Remove-Item -Force package-lock.json -ErrorAction SilentlyContinue
Remove-Item -Force pnpm-lock.yaml -ErrorAction SilentlyContinue

# Limpar cache do npm
Write-Host "🧹 Limpando cache do npm..." -ForegroundColor Yellow
npm cache clean --force

# Reinstalar dependências
Write-Host "📦 Reinstalando dependências..." -ForegroundColor Yellow
npm install

# Verificar instalação
Write-Host "✅ Verificando instalação..." -ForegroundColor Green
npm list --depth=0

Write-Host "🎉 Correção concluída! Execute 'npm run dev' para iniciar o servidor." -ForegroundColor Green





