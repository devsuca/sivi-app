'use client';

import { useAuth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { 
  LogOut, 
  User, 
  Shield, 
  Bell, 
  Search,
  Settings,
  Sun,
  Moon,
  ChevronDown,
  HelpCircle
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import Link from 'next/link';
import Image from 'next/image';
import { useVisitasEmCurso } from '@/hooks/useVisitasEmCurso';

export default function Header() {
  const { logout, user } = useAuth();
  const [userData, setUserData] = useState({ nome: '', role: '', id: '' });
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const { count: visitasEmCursoCount, loading: loadingVisitas } = useVisitasEmCurso();

  // Recupera dados do usuário do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const nome = localStorage.getItem('user_nome') || '';
      const role = localStorage.getItem('user_role') || '';
      const id = localStorage.getItem('user_id') || '';
      setUserData({ nome, role, id });
      
      // Verifica preferência de tema
      const isDark = document.documentElement.classList.contains('dark');
      setIsDarkMode(isDark);
    }
  }, []);

  const toggleDarkMode = () => {
    setIsDarkMode(!isDarkMode);
    document.documentElement.classList.toggle('dark');
  };

  const getRoleIcon = (role: string) => {
    switch(role.toLowerCase()) {
      case 'admin':
        return <Shield className="h-4 w-4 text-red-500" />;
      case 'portaria':
        return <Shield className="h-4 w-4 text-blue-500" />;
      case 'secretaria':
        return <User className="h-4 w-4 text-purple-500" />;
      case 'recepcao':
        return <User className="h-4 w-4 text-green-500" />;
      default:
        return <User className="h-4 w-4 text-gray-500" />;
    }
  };

  const getRoleColor = (role: string) => {
    switch(role.toLowerCase()) {
      case 'admin':
        return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
      case 'portaria':
        return 'bg-blue-100 text-blue-800 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-800';
      case 'secretaria':
        return 'bg-purple-100 text-purple-800 border-purple-200 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-800';
      case 'recepcao':
        return 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/30 dark:text-green-300 dark:border-green-800';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200 dark:bg-gray-900/30 dark:text-gray-300 dark:border-gray-800';
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-700/50">
      <div className="flex items-center justify-between px-6 py-4">
        {/* Lado Esquerdo - Logo e Título */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 flex items-center justify-center p-1">
              <Image
                src="/sic_logo.png"
                alt="SIC Logo"
                width={32}
                height={32}
                className="object-contain rounded-lg"
                priority
              />
            </div>
            <div className="flex flex-col">
              <h1 className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                <span className="hidden sm:inline">Sistema de Visitas do SIC</span>
                <span className="sm:hidden">SIVIS</span>
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">SIVIS+360º</p>
            </div>
          </div>
        </div>

        {/* Lado Direito - Ações e User Menu */}
        <div className="flex items-center space-x-4">
          {/* Barra de Pesquisa */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Pesquisar..."
              className="pl-10 pr-4 py-2 bg-gray-100 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-64"
            />
          </div>

          {/* Botão de Tema */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleDarkMode}
            className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600" />
            )}
          </Button>

          {/* Notificações - Visitas em Curso (apenas para Admin, Portaria e Secretaria) */}
          {user?.role !== 'recepcao' && (
            <Button
              variant="ghost"
              size="sm"
              className="relative rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
              title={`${visitasEmCursoCount} visita(s) em curso`}
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-400" />
              {visitasEmCursoCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                  {visitasEmCursoCount}
                </span>
              )}
              {loadingVisitas && (
                <span className="absolute -top-1 -right-1 bg-gray-400 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  ...
                </span>
              )}
            </Button>
          )}

          {/* Configurações */}
          <Button
            variant="ghost"
            size="sm"
            className="rounded-xl p-2 hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200"
          >
            <Settings className="h-5 w-5 text-gray-600 dark:text-gray-400" />
          </Button>

          {/* Separador */}
          <div className="h-8 w-px bg-gray-200 dark:bg-gray-600" />

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700 transition-all duration-200 group"
            >
              {/* Avatar do Usuário */}
              <div className="relative">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-sm shadow-lg group-hover:scale-105 transition-transform duration-200">
                  {userData.nome ? userData.nome.charAt(0).toUpperCase() : 'U'}
                </div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-400 rounded-full border-2 border-white dark:border-gray-800"></div>
              </div>

              {/* Informações do Usuário (visível apenas em desktop) */}
              <div className="hidden lg:block text-left">
                <div className="flex items-center space-x-2">
                  <span className="font-semibold text-gray-900 dark:text-white text-sm">
                    {userData.nome || 'Utilizador'}
                  </span>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-gray-500 transition-transform duration-200",
                    showUserMenu && "rotate-180"
                  )} />
                </div>
                {userData.role && (
                  <div className={cn(
                    "inline-flex items-center space-x-1 px-2 py-1 rounded-full text-xs border mt-1",
                    getRoleColor(userData.role)
                  )}>
                    {getRoleIcon(userData.role)}
                    <span className="font-medium">{userData.role}</span>
                  </div>
                )}
              </div>
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-700 backdrop-blur-lg py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                {/* Header do Menu */}
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center text-white font-semibold text-lg">
                      {userData.nome ? userData.nome.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 dark:text-white truncate">
                        {userData.nome || 'Utilizador'}
                      </p>
                      <div className="flex items-center space-x-2 mt-1">
                        {userData.role && (
                          <>
                            {getRoleIcon(userData.role)}
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {userData.role}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Itens do Menu */}
                <div className="py-2">
                  <Link href="/dashboard/perfil" passHref>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                      <User className="h-4 w-4" />
                      <span>Meu Perfil</span>
                    </button>
                  </Link>
                  <Link href="/dashboard/configuracoes" passHref>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                      <Settings className="h-4 w-4" />
                      <span>Configurações</span>
                    </button>
                  </Link>
                  <Link href="/dashboard/ajuda" passHref>
                    <button className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors duration-150">
                      <HelpCircle className="h-4 w-4" />
                      <span>Ajuda</span>
                    </button>
                  </Link>
                </div>

                {/* Footer do Menu */}
                <div className="border-t border-gray-100 dark:border-gray-700 pt-2">
                  <button
                    onClick={logout}
                    className="w-full flex items-center space-x-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors duration-150 rounded-lg mx-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Terminar Sessão</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Overlay para fechar o menu */}
      {showUserMenu && (
        <div 
          className="fixed inset-0 z-30"
          onClick={() => setShowUserMenu(false)}
        />
      )}
    </header>
  );
}