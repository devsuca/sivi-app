'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  LayoutDashboard,
  Ticket,
  Users,
  BarChart3,
  Settings,
  MessageSquare,
  Clock,
  CheckCircle,
  AlertCircle,
  User,
  LogOut,
  Menu,
  X
} from 'lucide-react';

interface SupportSidebarProps {
  ticketStats?: {
    total: number;
    abertos: number;
    em_andamento: number;
    fechados: number;
  };
}

export default function SupportSidebar({ ticketStats }: SupportSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const pathname = usePathname();

  const menuItems = [
    {
      title: 'Dashboard',
      href: '/dashboard/suporte',
      icon: LayoutDashboard,
      description: 'Visão geral do sistema'
    },
    {
      title: 'Todos os Tickets',
      href: '/dashboard/suporte/tickets',
      icon: Ticket,
      description: 'Gerenciar tickets',
      badge: ticketStats?.total
    },
    {
      title: 'Tickets Abertos',
      href: '/dashboard/suporte/tickets?status=aberto',
      icon: AlertCircle,
      description: 'Tickets pendentes',
      badge: ticketStats?.abertos,
      badgeColor: 'bg-red-500'
    },
    {
      title: 'Em Andamento',
      href: '/dashboard/suporte/tickets?status=em_andamento',
      icon: Clock,
      description: 'Tickets em progresso',
      badge: ticketStats?.em_andamento,
      badgeColor: 'bg-yellow-500'
    },
    {
      title: 'Fechados',
      href: '/dashboard/suporte/tickets?status=fechado',
      icon: CheckCircle,
      description: 'Tickets resolvidos',
      badge: ticketStats?.fechados,
      badgeColor: 'bg-green-500'
    },
    {
      title: 'Atribuições',
      href: '/dashboard/suporte/atribuicoes',
      icon: Users,
      description: 'Gerenciar atribuições'
    },
    {
      title: 'Relatórios',
      href: '/dashboard/suporte/relatorios',
      icon: BarChart3,
      description: 'Relatórios e estatísticas'
    },
    {
      title: 'Configurações',
      href: '/dashboard/suporte/configuracoes',
      icon: Settings,
      description: 'Configurações do sistema'
    }
  ];

  const handleLogout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    window.location.href = '/login';
  };

  return (
    <div className={cn(
      "flex flex-col h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 transition-all duration-300",
      isCollapsed ? "w-16" : "w-64"
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        {!isCollapsed && (
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
                Suporte Técnico
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Sistema de Tickets
              </p>
            </div>
          </div>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2"
        >
          {isCollapsed ? <Menu className="w-4 h-4" /> : <X className="w-4 h-4" />}
        </Button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || 
            (item.href.includes('tickets') && pathname.includes('tickets'));
          
          return (
            <Link key={item.href} href={item.href}>
              <div className={cn(
                "flex items-center space-x-3 px-3 py-2 rounded-lg transition-colors group",
                isActive 
                  ? "bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
              )}>
                <Icon className={cn(
                  "w-5 h-5 flex-shrink-0",
                  isActive ? "text-blue-600 dark:text-blue-400" : "text-gray-500 dark:text-gray-400"
                )} />
                {!isCollapsed && (
                  <>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {item.description}
                      </p>
                    </div>
                    {item.badge !== undefined && (
                      <Badge 
                        variant="secondary" 
                        className={cn(
                          "text-xs",
                          item.badgeColor || "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </>
                )}
              </div>
            </Link>
          );
        })}
      </nav>

      {/* User Info & Logout */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700">
        {!isCollapsed ? (
          <div className="space-y-3">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                  Suporte Técnico
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Equipe de Suporte
                </p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="w-full justify-start"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Sair
            </Button>
          </div>
        ) : (
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-gray-600 dark:text-gray-300" />
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="p-2"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
