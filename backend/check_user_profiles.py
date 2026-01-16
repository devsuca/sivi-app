#!/usr/bin/env python
"""
Script de diagnóstico para verificar perfis de usuários
Identifica usuários sem perfil ou com configuração incompleta
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.usuarios.models import Usuario
from apps.authentication.models import Perfil

def check_user_profiles():
    """Verifica se todos os usuários têm perfis válidos"""
    
    print("\n" + "="*80)
    print("DIAGNOSTICO DE PERFIS DE USUARIOS")
    print("="*80 + "\n")
    
    # 1. Verificar usuários totais
    total_users = Usuario.objects.count()
    print(f"Total de usuarios no sistema: {total_users}\n")
    
    # 2. Verificar usuários sem perfil
    users_without_profile = Usuario.objects.filter(perfil__isnull=True)
    if users_without_profile.exists():
        print(f"[X] Usuarios SEM perfil: {users_without_profile.count()}")
        for user in users_without_profile:
            print(f"   - ID: {user.id} | Username: {user.username} | Email: {user.email}")
            print(f"     Sugestao: Atribuir perfil usando Django Admin ou criar perfil manualmente")
    else:
        print(f"[OK] Todos os usuarios tem perfil atribuido")
    
    print()
    
    # 3. Verificar usuários com perfil
    users_with_profile = Usuario.objects.filter(perfil__isnull=False)
    if users_with_profile.exists():
        print(f"[OK] Usuarios COM perfil: {users_with_profile.count()}\n")
        
        # Agrupar por nível de acesso
        perfil_stats = {}
        for user in users_with_profile:
            nivel = user.perfil.nivel_acesso
            if nivel not in perfil_stats:
                perfil_stats[nivel] = []
            perfil_stats[nivel].append(user)
        
        print(f"Distribuicao por perfil:")
        for nivel, users in perfil_stats.items():
            print(f"   {nivel.upper()}: {len(users)} usuario(s)")
            for user in users:
                orgao_info = ""
                if nivel == 'recepcao':
                    if hasattr(user, 'orgao') and user.orgao:
                        orgao_info = f" | Orgao: {user.orgao.nome}"
                    else:
                        orgao_info = f" | [!] SEM ORGAO VINCULADO!"
                elif nivel == 'portaria':
                    if hasattr(user, 'efetivo') and user.efetivo:
                        orgao_info = f" | Efetivo: {user.efetivo}"
                        if hasattr(user.efetivo, 'orgao') and user.efetivo.orgao:
                            orgao_info += f" | Orgao: {user.efetivo.orgao.nome}"
                    else:
                        orgao_info = f" | [!] SEM EFETIVO VINCULADO"
                
                print(f"      - {user.username}{orgao_info}")
    
    print()
    
    # 4. Verificar usuários com perfil recepção sem órgão
    recepcao_users = Usuario.objects.filter(perfil__nivel_acesso='recepcao')
    if recepcao_users.exists():
        recepcao_sem_orgao = [u for u in recepcao_users if not hasattr(u, 'orgao') or not u.orgao]
        if recepcao_sem_orgao:
            print(f"[X] Usuarios RECEPCAO sem orgao: {len(recepcao_sem_orgao)}")
            for user in recepcao_sem_orgao:
                print(f"   - Username: {user.username}")
                print(f"     Problema: Usuarios de recepcao devem ter um orgao vinculado")
                print(f"     Sugestao: Atribuir orgao usando Django Admin")
            print()
    
    # 5. Verificar usuários com perfil portaria sem efetivo
    portaria_users = Usuario.objects.filter(perfil__nivel_acesso='portaria')
    if portaria_users.exists():
        portaria_sem_efetivo = [u for u in portaria_users if not hasattr(u, 'efetivo') or not u.efetivo]
        if portaria_sem_efetivo:
            print(f"[!] Usuarios PORTARIA sem efetivo: {len(portaria_sem_efetivo)}")
            for user in portaria_sem_efetivo:
                print(f"   - Username: {user.username}")
                print(f"     Info: Portaria pode funcionar sem efetivo, mas idealmente deveria ter")
            print()
    
    # 6. Sumário e recomendações
    print("="*80)
    print("SUMARIO E RECOMENDACOES")
    print("="*80 + "\n")
    
    issues_found = []
    
    if users_without_profile.exists():
        issues_found.append(f"[CRITICO] {users_without_profile.count()} usuario(s) sem perfil")
        print(f"[!] ACAO NECESSARIA:")
        print(f"   Criar perfis para os usuarios listados acima")
        print(f"   Comando: python manage.py shell")
        print(f"   >>> from apps.usuarios.models import Usuario")
        print(f"   >>> from apps.authentication.models import Perfil")
        print(f"   >>> user = Usuario.objects.get(username='USERNAME')")
        print(f"   >>> perfil = Perfil.objects.create(usuario=user, nivel_acesso='admin')")
        print()
    
    if recepcao_users.exists():
        recepcao_sem_orgao = [u for u in recepcao_users if not hasattr(u, 'orgao') or not u.orgao]
        if recepcao_sem_orgao:
            issues_found.append(f"[CRITICO] {len(recepcao_sem_orgao)} usuario(s) recepcao sem orgao")
            print(f"[!] ACAO NECESSARIA:")
            print(f"   Vincular orgao aos usuarios de recepcao listados acima")
            print()
    
    if not issues_found:
        print(f"[OK] Nenhum problema critico encontrado!")
        print(f"[OK] Todos os usuarios estao configurados corretamente")
    else:
        print(f"Total de problemas encontrados: {len(issues_found)}")
        for issue in issues_found:
            print(f"   - {issue}")
    
    print("\n" + "="*80 + "\n")

if __name__ == '__main__':
    try:
        check_user_profiles()
    except Exception as e:
        print(f"[X] Erro ao executar diagnostico: {e}")
        import traceback
        traceback.print_exc()
