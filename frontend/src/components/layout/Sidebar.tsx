import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import { 
  Home, 
  Users, 
  Car, 
  Briefcase, 
  ChevronLeft, 
  ChevronRight, 
  UserCog,
  Building,
  IdCard,
  Shield,
  Settings,
  BarChart3,
  ClipboardList,
  FileText,
  Eye,
  EyeOff,
  Lock
} from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth';

const menuItems = [
  { 
    href: '/dashboard', 
    label: 'Dashboard', 
    icon: BarChart3,
    description: 'Visão geral do sistema'
  },
  { 
    href: '/dashboard/pessoas', 
    label: 'Visitantes', 
    icon: Users,
    description: 'Cadastro de Visitantes'
  },
  { 
    href: '/dashboard/visitas', 
    label: 'Visitas', 
    icon: ClipboardList,
    description: 'Gestão de visitas'
  },

  { 
    href: '/dashboard/efetivos', 
    label: 'Efetivos', 
    icon: Shield,
    description: 'Militares e funcionários'
  },
  { 
    href: '/dashboard/usuarios', 
    label: 'Usuários', 
    icon: UserCog,
    description: 'Usuários do sistema'
  },
  { 
    href: '/dashboard/orgaos', 
    label: 'Órgãos', 
    icon: Building,
    description: 'Unidades organizacionais'
  },
  { 
    href: '/dashboard/pertences', 
    label: 'Pertences', 
    icon: Briefcase,
    description: 'Objetos e pertences'
  },
  { 
    href: '/dashboard/crachas', 
    label: 'Cartões de Vista', 
    icon: IdCard,
    description: 'Gestão de credenciais de acesso'
  },
  { 
    href: '/dashboard/notificacoes', 
    label: 'Notificações', 
    icon: Users,
    description: 'Notificações ao DSI'
  },
  { 
    href: '/dashboard/configuracoes', 
    label: 'Configurações', 
    icon: Settings,
    description: 'Configurações do sistema'
  },
  { 
    href: '/dashboard/audit-logs', 
    label: 'Logs de Auditoria', 
    icon: Shield,
    description: 'Histórico de atividades e segurança',
    roles: ['admin', 'portaria', 'suporte']
  },
  { 
    href: '/dashboard/relatorios', 
    label: 'Relatórios', 
    icon: FileText,
    description: 'Relatórios e estatísticas'
  },
];

export default function Sidebar() {
  const { isSidebarOpen, toggleSidebar } = useUiStore();
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();

  // Definir rotas permitidas para cada role
  const recepcaoRoutes = [
    '/dashboard', 
    '/dashboard/visitas',  // Recepção pode visualizar visitas do seu órgão
    '/dashboard/notificacoes'  // Recepção pode notificar o DSI
  ];
  const portariaRoutes = [
    '/dashboard', 
    '/dashboard/pessoas',
    '/dashboard/visitas', 
    '/dashboard/crachas',
    '/dashboard/audit-logs',
    '/dashboard/relatorios'
  ];
  const secretariaRoutes = [
    '/dashboard', 
    '/dashboard/visitas', 
    '/dashboard/pessoas', 
    '/dashboard/relatorios'
  ];

  // Filtrar itens do menu baseado no role do usuário
  const getFilteredMenuItems = () => {
    if (user?.role === 'recepcao') {
      return menuItems.filter(item => recepcaoRoutes.includes(item.href));
    } else if (user?.role === 'portaria') {
      return menuItems.filter(item => portariaRoutes.includes(item.href));
    } else if (user?.role === 'secretaria') {
      return menuItems.filter(item => secretariaRoutes.includes(item.href));
    }
    
    // Para admin e outros roles, filtrar por roles específicos se definido
    return menuItems.filter(item => {
      // Se o item não tem roles definidos, mostrar para todos
      if (!item.roles) return true;
      
      // Se tem roles definidos, verificar se o usuário tem permissão
      return item.roles.includes(user?.role || '');
    });
  };

  const filteredMenuItems = getFilteredMenuItems();

  // Função para obter informações sobre permissões de cada item
  const getItemPermissions = (item: any) => {
    const role = user?.role;
    
    if (role === 'recepcao') {
      switch (item.href) {
        case '/dashboard/visitas':
          return {
            canView: true,
            canEdit: false,
            canDelete: false,
            canFinalize: false,
            canAssociateCracha: false,
            description: 'Visualizar visitas do seu órgão'
          };
        case '/dashboard/notificacoes':
          return {
            canView: true,
            canEdit: true,
            canDelete: false,
            description: 'Notificar o DSI sobre visitas'
          };
        default:
          return {
            canView: true,
            canEdit: false,
            canDelete: false,
            description: 'Acesso básico'
          };
      }
    }
    
    return {
      canView: true,
      canEdit: true,
      canDelete: true,
      description: 'Acesso completo'
    };
  };

  return (
    <aside
      className={cn(
        'bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 text-white flex flex-col transition-all duration-300 ease-in-out relative shadow-2xl border-r border-gray-700',
        isSidebarOpen ? 'w-80' : 'w-24'
      )}
    >
      {/* Header com logo */}
      <div className="p-6 border-b border-gray-700">
        <div className={cn(
          "flex items-center transition-all duration-300",
          isSidebarOpen ? "justify-start space-x-3" : "justify-center"
        )}>
          <div className="relative">
            <div className="w-12 h-12 flex items-center justify-center p-1 transition-transform duration-200 hover:scale-105">
              <Image
                src="/sic_logo.png"
                alt="SIC Logo"
                width={40}
                height={40}
                className="object-contain rounded-xl shadow-lg"
                priority
              />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-gray-900 animate-pulse"></div>
          </div>
          <div className={cn(
            "transition-all duration-300 overflow-hidden",
            isSidebarOpen ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            <h2 className="text-xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
              SIVIS+360º
            </h2>
            <p className="text-xs text-gray-400 mt-1">Sistema Integrado</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
        <ul className="space-y-2">
          {filteredMenuItems.map((item) => {
            // Lógica melhorada para ativação do menu
            const currentPath = pathname ?? '';
            let isActive = false;
            
            if (item.href === '/dashboard') {
              // Para o Dashboard, ativa se estiver na rota /dashboard ou em qualquer subrota específica do role
              const userRole = user?.role;
              let dashboardPath = '/dashboard';
              
              switch (userRole) {
                case 'admin':
                  dashboardPath = '/dashboard/admin';
                  break;
                case 'portaria':
                  dashboardPath = '/dashboard/portaria';
                  break;
                case 'secretaria':
                  dashboardPath = '/dashboard/secretaria';
                  break;
                case 'recepcao':
                  dashboardPath = '/dashboard/recepcao';
                  break;
                default:
                  dashboardPath = '/dashboard';
              }
              
              isActive = currentPath === '/dashboard' || currentPath === dashboardPath || currentPath.startsWith('/dashboard/');
            } else {
              // Para outros itens, NUNCA ativa se estiver em qualquer rota do dashboard
              // Apenas ativa se estiver exatamente na rota correspondente E não for uma subrota do dashboard
              isActive = currentPath === item.href && !currentPath.startsWith('/dashboard/');
            }
            
            const Icon = item.icon;
            const permissions = getItemPermissions(item);
            
            return (
              <li key={item.href}>
                <button
                  className={cn(
                    "group flex items-center p-3 rounded-2xl transition-all duration-200 relative overflow-hidden w-full text-left",
                    "hover:bg-white/10 hover:scale-105 hover:shadow-lg",
                    isActive 
                      ? "bg-blue-500/20 text-blue-400 shadow-lg scale-105 border border-blue-500/30" 
                      : "text-gray-300 hover:text-white",
                    !isSidebarOpen && "justify-center"
                  )}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    console.log(`🔗 Navegando para: ${item.label} -> ${item.href}`);
                    
                    // Para o Dashboard, redirecionar para o dashboard específico do role
                    if (item.href === '/dashboard') {
                      const userRole = user?.role;
                      let dashboardPath = '/dashboard';
                      
                      switch (userRole) {
                        case 'admin':
                          dashboardPath = '/dashboard/admin';
                          break;
                        case 'portaria':
                          dashboardPath = '/dashboard/portaria';
                          break;
                        case 'secretaria':
                          dashboardPath = '/dashboard/secretaria';
                          break;
                        case 'recepcao':
                          dashboardPath = '/dashboard/recepcao';
                          break;
                        default:
                          dashboardPath = '/dashboard';
                      }
                      
                      console.log(`🎯 Redirecionando para dashboard específico: ${dashboardPath}`);
                      router.push(dashboardPath);
                    } else {
                      // Para outros itens, usar navegação normal
                      router.push(item.href);
                    }
                  }}
                >
                  {/* Efeito de brilho no hover */}
                  <div className={cn(
                    "absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 opacity-0 transition-opacity duration-200",
                    "group-hover:opacity-100"
                  )} />
                  
                  {/* Ícone */}
                  <div className={cn(
                    "relative z-10 transition-transform duration-200",
                    isActive && "scale-110",
                    "group-hover:scale-110"
                  )}>
                    <Icon className={cn(
                      "h-5 w-5 flex-shrink-0 transition-colors duration-200",
                      isActive ? "text-blue-400" : "text-gray-400 group-hover:text-white"
                    )} />
                    
                    {/* Indicadores de permissão para recepção */}
                    {user?.role === 'recepcao' && isSidebarOpen && (
                      <div className="absolute -top-1 -right-1 flex space-x-1">
                        {permissions.canView && (
                          <Eye className="h-3 w-3 text-green-400" />
                        )}
                        {!permissions.canEdit && (
                          <Lock className="h-3 w-3 text-yellow-400" />
                        )}
                        {!permissions.canFinalize && item.href === '/dashboard/visitas' && (
                          <EyeOff className="h-3 w-3 text-red-400" />
                        )}
                      </div>
                    )}
                  </div>
                  
                  {/* Texto e descrição */}
                  <div className={cn(
                    "relative z-10 transition-all duration-300 overflow-hidden",
                    isSidebarOpen ? "ml-4 opacity-100 w-auto" : "opacity-0 w-0 ml-0"
                  )}>
                    <span className={cn(
                      "font-medium transition-colors duration-200 block",
                      isActive ? "text-blue-400" : "text-gray-200 group-hover:text-white"
                    )}>
                      {item.label}
                    </span>
                    <span className={cn(
                      "text-xs transition-all duration-200",
                      isActive ? "text-blue-300/80" : "text-gray-400 group-hover:text-gray-300",
                      isSidebarOpen ? "opacity-100 h-auto mt-1" : "opacity-0 h-0 mt-0"
                    )}>
                      {user?.role === 'recepcao' ? permissions.description : item.description}
                    </span>
                  </div>

                  {/* Indicador de página ativa */}
                  {isActive && (
                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                    </div>
                  )}

                  {/* Tooltip quando sidebar está recolhida */}
                  {!isSidebarOpen && (
                    <div className="absolute left-full ml-4 px-3 py-2 bg-gray-900 text-white text-sm rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 whitespace-nowrap border border-gray-700">
                      <div className="font-medium">{item.label}</div>
                      <div className="text-xs text-gray-400 mt-1">
                        {user?.role === 'recepcao' ? permissions.description : item.description}
                      </div>
                      {user?.role === 'recepcao' && (
                        <div className="flex items-center space-x-2 mt-2">
                          {permissions.canView && <Eye className="h-3 w-3 text-green-400" />}
                          {!permissions.canEdit && <Lock className="h-3 w-3 text-yellow-400" />}
                          {!permissions.canFinalize && item.href === '/dashboard/visitas' && <EyeOff className="h-3 w-3 text-red-400" />}
                        </div>
                      )}
                    </div>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Seção informativa para recepção */}
      {user?.role === 'recepcao' && isSidebarOpen && (
        <div className="px-4 py-3 border-t border-gray-700">
          <div className="bg-green-900/20 border border-green-700/30 rounded-lg p-3">
            <div className="flex items-center space-x-2 mb-2">
              <Shield className="h-4 w-4 text-green-400" />
              <span className="text-xs font-medium text-green-400">Permissões de Recepção</span>
            </div>
            <div className="space-y-1 text-xs text-gray-300">
              <div className="flex items-center space-x-2">
                <Eye className="h-3 w-3 text-green-400" />
                <span>Visualizar visitas do seu órgão</span>
              </div>
              <div className="flex items-center space-x-2">
                <Shield className="h-3 w-3 text-blue-400" />
                <span>Notificar o DSI sobre visitas</span>
              </div>
              <div className="flex items-center space-x-2">
                <Lock className="h-3 w-3 text-yellow-400" />
                <span>Não pode finalizar visitas</span>
              </div>
              <div className="flex items-center space-x-2">
                <EyeOff className="h-3 w-3 text-red-400" />
                <span>Não pode associar crachás</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Footer com botão de toggle */}
      <div className="p-4 border-t border-gray-700">
        <button
          onClick={toggleSidebar}
          className={cn(
            "group flex items-center justify-center w-full p-3 rounded-2xl transition-all duration-300",
            "bg-gray-800/50 hover:bg-gray-700/50 border border-gray-600/50 hover:border-gray-500/50",
            "hover:scale-105 hover:shadow-lg"
          )}
        >
          <div className="relative flex items-center justify-center">
            {isSidebarOpen ? (
              <>
                <ChevronLeft className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-200" />
                <span className="ml-3 text-sm text-gray-400 group-hover:text-white transition-all duration-200">
                  Recolher
                </span>
              </>
            ) : (
              <ChevronRight className="h-5 w-5 text-gray-400 group-hover:text-white transition-colors duration-200" />
            )}
          </div>
        </button>

        {/* Versão do sistema quando sidebar está aberta */}
        {isSidebarOpen && (
          <div className="mt-4 text-center">
            <div className="text-xs text-gray-500 bg-gray-800/30 rounded-lg py-2 px-3 border border-gray-700/50">
              <div>v2.1.0</div>
              <div className="text-green-400 font-medium mt-1">● Sistema Online</div>
            </div>
          </div>
        )}
      </div>

      {/* Efeito de brilho lateral */}
      <div className="absolute top-0 right-0 w-1 h-full bg-gradient-to-b from-blue-500/50 to-purple-500/50 opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
    </aside>
  );
}
