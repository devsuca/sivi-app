# 🚀 Solução Rápida - SIVI+360°

## ❌ Problema Atual
```
FATAL: password authentication failed for user "sivis_user"
```

## ✅ Solução Imediata

### Configurar PostgreSQL (Recomendado)

```powershell
# Execute como Administrador
cd SIC-SIVIS
.\setup-postgresql-windows.ps1
```

## 🔧 Comandos para Testar

### 1. Backend com PostgreSQL
```powershell
cd SIC-SIVIS\backend-sivis
python manage.py migrate --settings=config.settings_development
python manage.py createsuperuser --settings=config.settings_development
python manage.py runserver --settings=config.settings_development
```

### 2. Frontend
```powershell
cd SIC-SIVIS\frontend-sivis
npm run dev
```

## 🌐 URLs de Teste

- **Frontend**: http://localhost:3000
- **Backend**: http://localhost:8000
- **API Health**: http://localhost:8000/api/health/
- **Admin**: http://localhost:8000/admin/

## 📋 Checklist

- [ ] Backend iniciado sem erros
- [ ] Frontend iniciado sem erros
- [ ] Health check responde: http://localhost:8000/api/health/
- [ ] Login funciona no frontend
- [ ] Não há erros no console do navegador

## 🆘 Se Ainda Não Funcionar

1. **Verifique se as portas estão livres:**
   ```powershell
   netstat -an | findstr :8000
   netstat -an | findstr :3000
   ```

2. **Reinicie os serviços:**
   ```powershell
   # Parar processos Python
   taskkill /f /im python.exe
   
   # Parar processos Node
   taskkill /f /im node.exe
   ```

3. **Limpe cache:**
   ```powershell
   # Frontend
   cd SIC-SIVIS\frontend-sivis
   rm -rf .next
   npm run dev
   ```

## 📞 Suporte

Se o problema persistir, consulte:
- `TROUBLESHOOTING.md` - Guia completo
- `README.md` - Instruções de instalação
- `POSTGRESQL_SETUP.md` - Configuração do PostgreSQL
