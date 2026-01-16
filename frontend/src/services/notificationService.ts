import { toast } from 'sonner';

export interface DSINotification {
  id: string;
  nome_pessoa: string;
  data_visita: string;
  hora_visita: string;
  observacoes?: string;
  urgencia: 'baixa' | 'media' | 'alta';
  enviado_por: string;
  orgao: string;
  data_envio: string;
  status: 'pendente' | 'visualizada' | 'processada';
  visitante_id?: number;
  visita_id?: number;
  orgao_id?: number;
}

interface NotificationFilters {
  role: string;
  orgao?: string;
  orgao_id?: number;
}

class NotificationService {
  private notifications: DSINotification[] = [];
  private listeners: ((notifications: DSINotification[]) => void)[] = [];
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectInterval = 3000;
  private currentUser: any = null;
  private pollingInterval: NodeJS.Timeout | null = null;

  // Simular armazenamento local (em produção, usar API)
  private storageKey = 'dsi_notifications';

  constructor() {
    this.loadNotifications();
    this.initializeWebSocket();
    // Carregar notificações da API imediatamente
    this.fetchNotificationsFromAPI();
  }

  // Definir usuário atual para filtros
  setCurrentUser(user: any) {
    // Evitar loops infinitos - só atualizar se o usuário mudou
    if (this.currentUser?.id === user?.id && 
        this.currentUser?.role === user?.role &&
        this.currentUser?.orgao?.id === user?.orgao?.id) {
      return;
    }
    
    this.currentUser = user;
    this.filterNotificationsForUser();
  }

  // Filtrar notificações baseado no usuário
  private filterNotificationsForUser() {
    if (!this.currentUser) return;

    // Se for portaria do DSI, mostrar todas as notificações
    if (this.shouldReceiveNotifications()) {
      this.notifyListeners();
    }
  }

  // Verificar se o usuário deve receber notificações
  private shouldReceiveNotifications(): boolean {
    if (!this.currentUser) return false;

    // Verificar se é portaria
    if (this.currentUser.role !== 'portaria') return false;

    // Verificar se pertence ao DSI
    const isDSI = this.currentUser.orgao?.nome === 'DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL' ||
                  this.currentUser.orgao?.nome?.includes('SEGURANÇA INSTITUCIONAL') ||
                  this.currentUser.orgao?.sigla === 'DSI';

    return isDSI;
  }

  // Método auxiliar para converter readyState em texto legível
  private getReadyStateText(readyState: number): string {
    switch (readyState) {
      case WebSocket.CONNECTING:
        return 'CONNECTING';
      case WebSocket.OPEN:
        return 'OPEN';
      case WebSocket.CLOSING:
        return 'CLOSING';
      case WebSocket.CLOSED:
        return 'CLOSED';
      default:
        return `UNKNOWN (${readyState})`;
    }
  }

  // Inicializar WebSocket para notificações em tempo real
  private initializeWebSocket() {
    if (typeof window === 'undefined') return;

    // Verificar se já existe uma conexão ativa
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      if (process.env.NODE_ENV === 'development') {
      }
      return;
    }

    const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8000/ws/notifications/';
    
    // Em produção, se não há URL configurada, usar polling diretamente
    if (process.env.NODE_ENV === 'production' && !process.env.NEXT_PUBLIC_WS_URL) {
      this.startPolling();
      return;
    }
    
    try {
      if (process.env.NODE_ENV === 'development') {
      }
      this.ws = new WebSocket(wsUrl);
      
      this.ws.onopen = () => {
        if (process.env.NODE_ENV === 'development') {
        }
        this.reconnectAttempts = 0;
        
        // Autenticar com token JWT
        const token = localStorage.getItem('accessToken');
        if (token) {
          if (process.env.NODE_ENV === 'development') {
          }
          this.ws?.send(JSON.stringify({
            type: 'authenticate',
            token: token
          }));
        } else {
        }
        
        // Enviar informações do usuário para o servidor
        if (this.currentUser) {
          this.sendUserInfo();
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleWebSocketMessage(data);
        } catch (error) {
        }
      };

      this.ws.onclose = (event) => {
        // Só tentar reconectar se não foi um fechamento intencional
        if (event.code !== 1000) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        // Melhorar o log de erro com mais informações
        const errorInfo = {
          type: 'WebSocket Error',
          message: error instanceof ErrorEvent ? error.message : 'Erro desconhecido',
          type_error: error instanceof ErrorEvent ? error.type : typeof error,
          readyState: this.ws?.readyState,
          readyStateText: this.ws ? this.getReadyStateText(this.ws.readyState) : 'N/A',
          url: wsUrl,
          timestamp: new Date().toISOString()
        };
        
        // Log apenas em modo de desenvolvimento e se não for erro de conexão esperado
        if (process.env.NODE_ENV === 'development') {
        }
        
        // Log mais detalhado do erro apenas em desenvolvimento
        if (this.ws && process.env.NODE_ENV === 'development') {
          // Log detalhado do estado do WebSocket
        }
        
        // Verificar se é um erro de conexão que requer reconexão
        const shouldReconnect = this.ws?.readyState === WebSocket.CLOSED || 
                               this.ws?.readyState === WebSocket.CLOSING ||
                               this.ws?.readyState === WebSocket.CONNECTING;
        
        if (shouldReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
          if (process.env.NODE_ENV === 'development') {
          }
          setTimeout(() => {
            this.attemptReconnect();
          }, 5000); // Aumentar intervalo para 5 segundos
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          if (process.env.NODE_ENV === 'development') {
          }
          this.startPolling();
        }
      };
    } catch (error) {
      // Fallback para polling se WebSocket falhar
      this.startPolling();
    }
  }

  // Tentar reconectar WebSocket
  private attemptReconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      if (process.env.NODE_ENV === 'development') {
      }
      
      // Fechar conexão anterior se existir
      if (this.ws) {
        if (process.env.NODE_ENV === 'development') {
        }
        this.ws.close();
        this.ws = null;
      }
      
      // Aumentar intervalo de reconexão exponencialmente
      const delay = this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1);
      if (process.env.NODE_ENV === 'development') {
      }
      
      setTimeout(() => {
        if (process.env.NODE_ENV === 'development') {
        }
        this.initializeWebSocket();
      }, delay);
    } else {
      if (process.env.NODE_ENV === 'development') {
      }
      this.startPolling();
    }
  }

  // Fallback: polling para notificações
  private startPolling() {
    if (process.env.NODE_ENV === 'development') {
    }
    
    // Limpar qualquer polling anterior
    if (this.pollingInterval) {
      if (process.env.NODE_ENV === 'development') {
      }
      clearInterval(this.pollingInterval);
    }
    
    // Fazer primeira busca imediatamente
    if (process.env.NODE_ENV === 'development') {
    }
    this.fetchNotificationsFromAPI();
    
    // Configurar polling a cada 10 segundos
    this.pollingInterval = setInterval(() => {
      if (process.env.NODE_ENV === 'development') {
      }
      this.fetchNotificationsFromAPI();
    }, 10000);
  }

  // Enviar informações do usuário para o servidor
  private sendUserInfo() {
    if (this.ws && this.ws.readyState === WebSocket.OPEN && this.currentUser) {
      this.ws.send(JSON.stringify({
        type: 'user_info',
        user: {
          id: this.currentUser.id,
          role: this.currentUser.role,
          orgao: this.currentUser.orgao
        }
      }));
    }
  }

  // Processar mensagens do WebSocket
  private handleWebSocketMessage(data: any) {
    switch (data.type) {
      case 'auth_success':
        break;
      case 'auth_error':
        break;
      case 'user_info_success':
        break;
      case 'user_info_error':
        break;
      case 'new_notification':
        this.handleNewNotification(data.notification);
        break;
      case 'notification_updated':
        this.handleNotificationUpdate(data.notification);
        break;
      case 'notification_deleted':
        this.handleNotificationDelete(data.notification_id);
        break;
      case 'error':
        break;
      default:
    }
  }

  // Buscar notificações da API
  private async fetchNotificationsFromAPI() {
    // Remover a restrição de autorização para permitir que todos vejam as notificações
    // if (!this.shouldReceiveNotifications()) {
    //   return;
    // }

    try {
      const token = localStorage.getItem('accessToken');
      if (!token) {
        return;
      }

      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/notifications/`;

      const response = await fetch(apiUrl, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        try {
          const data = await response.json();
          const notifications = data.results || data;
          
          this.notifications = notifications;
          this.saveNotifications();
          this.notifyListeners();
        } catch (jsonError) {
          const responseText = await response.text();
        }
      } else {
        try {
          const errorData = await response.json();
        } catch (jsonError) {
          const errorText = await response.text();
        }
      }
    } catch (error) {
    }
  }

  // Processar nova notificação
  private handleNewNotification(notification: DSINotification) {
    // Verificar se deve receber esta notificação
    if (!this.shouldReceiveNotifications()) return;

    // Verificar se já existe
    const exists = this.notifications.find(n => n.id === notification.id);
    if (exists) return;

    this.notifications.unshift(notification);
    this.saveNotifications();
    this.notifyListeners();
    this.showRealtimeNotification(notification);
  }

  // Processar atualização de notificação
  private handleNotificationUpdate(notification: DSINotification) {
    const index = this.notifications.findIndex(n => n.id === notification.id);
    if (index !== -1) {
      this.notifications[index] = notification;
      this.saveNotifications();
      this.notifyListeners();
    }
  }

  // Processar exclusão de notificação
  private handleNotificationDelete(notificationId: string) {
    this.notifications = this.notifications.filter(n => n.id !== notificationId);
    this.saveNotifications();
    this.notifyListeners();
  }

  private loadNotifications() {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          this.notifications = JSON.parse(stored);
        }
      } catch (error) {
        this.notifications = [];
      }
    }
  }

  private saveNotifications() {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(this.notifications));
      } catch (error) {
      }
    }
  }

  // Adicionar notificação
  addNotification(notification: Omit<DSINotification, 'id' | 'data_envio' | 'status'>) {
    const newNotification: DSINotification = {
      ...notification,
      id: Date.now().toString(),
      data_envio: new Date().toISOString(),
      status: 'pendente'
    };

    this.notifications.unshift(newNotification);
    this.saveNotifications();
    this.notifyListeners();

    // Mostrar notificação em tempo real para usuários de portaria do DSI
    if (this.shouldReceiveNotifications()) {
      this.showRealtimeNotification(newNotification);
    }

    return newNotification;
  }

  // Mostrar notificação em tempo real
  private showRealtimeNotification(notification: DSINotification) {
    const urgenciaColors = {
      baixa: 'info',
      media: 'warning', 
      alta: 'error'
    } as const;

    const urgenciaLabels = {
      baixa: 'Baixa',
      media: 'Média',
      alta: 'Alta'
    };

    const urgenciaIcons = {
      baixa: 'ℹ️',
      media: '⚠️',
      alta: '🚨'
    };

    toast[urgenciaColors[notification.urgencia]](
      `${urgenciaIcons[notification.urgencia]} Nova Notificação DSI - ${urgenciaLabels[notification.urgencia]} Urgência`,
      {
        description: `${notification.nome_pessoa} - ${notification.data_visita} às ${notification.hora_visita}`,
        duration: 10000,
        action: {
          label: 'Ver Detalhes',
          onClick: () => {
            // Em produção, abrir modal ou redirecionar
            // Aqui você pode implementar navegação para a notificação
            window.open(`/dashboard/notificacoes?notification=${notification.id}`, '_blank');
          }
        }
      }
    );
  }

  // Obter todas as notificações (filtradas para o usuário atual)
  getNotifications(): DSINotification[] {
    // Remover a restrição de autorização para permitir que todos vejam as notificações
    // if (!this.shouldReceiveNotifications()) {
    //   return [];
    // }
    return [...this.notifications];
  }

  // Obter notificações por status
  getNotificationsByStatus(status: DSINotification['status']): DSINotification[] {
    return this.getNotifications().filter(n => n.status === status);
  }

  // Marcar notificação como visualizada
  async markAsViewed(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'visualizada';
      this.saveNotifications();
      this.notifyListeners();
      
      // Sincronizar com o backend
      await this.syncNotificationStatus(id, 'visualizada');
    }
  }

  // Marcar notificação como processada
  async markAsProcessed(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.status = 'processada';
      this.saveNotifications();
      this.notifyListeners();
      
      // Sincronizar com o backend
      await this.syncNotificationStatus(id, 'processada');
    }
  }

  // Sincronizar status da notificação com o backend
  private async syncNotificationStatus(id: string, status: string) {
    try {
      const token = localStorage.getItem('accessToken');
      if (!token) return;

      await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api'}/notifications/${id}/`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ status })
      });
    } catch (error) {
    }
  }

  // Contar notificações pendentes
  getPendingCount(): number {
    return this.getNotifications().filter(n => n.status === 'pendente').length;
  }

  // Adicionar listener para mudanças
  addListener(callback: (notifications: DSINotification[]) => void) {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(l => l !== callback);
    };
  }

  // Notificar listeners
  private notifyListeners() {
    const filteredNotifications = this.getNotifications();
    this.listeners.forEach(listener => listener(filteredNotifications));
  }

  // Simular notificação de teste
  simulateNotification() {
    const testNotification: Omit<DSINotification, 'id' | 'data_envio' | 'status'> = {
      nome_pessoa: 'João Silva Santos',
      data_visita: new Date().toISOString().split('T')[0],
      hora_visita: '14:30',
      observacoes: 'Visita de teste para demonstração do sistema DSI',
      urgencia: 'media',
      enviado_por: 'recepcao_user',
      orgao: 'DEPARTAMENTO DE SEGURANÇA INSTITUCIONAL',
      orgao_id: 1
    };

    return this.addNotification(testNotification);
  }

  // Verificar status da conexão
  getConnectionStatus() {
    const wsStatus = this.ws ? {
      readyState: this.ws.readyState,
      url: this.ws.url,
      protocol: this.ws.protocol
    } : null;
    
    return {
      isWebSocketConnected: this.ws?.readyState === WebSocket.OPEN,
      isPollingActive: this.pollingInterval !== null,
      reconnectAttempts: this.reconnectAttempts,
      maxReconnectAttempts: this.maxReconnectAttempts,
      wsStatus: wsStatus,
      currentUser: this.currentUser ? {
        id: this.currentUser.id,
        role: this.currentUser.role,
        orgao: this.currentUser.orgao?.nome
      } : null
    };
  }

  // Método público para forçar carregamento das notificações
  async refreshNotifications() {
    await this.fetchNotificationsFromAPI();
  }

  // Fechar conexão WebSocket e limpar recursos
  disconnect() {
    
    // Fechar WebSocket
    if (this.ws) {
      this.ws.close(1000, 'Desconexão intencional');
      this.ws = null;
    }
    
    // Limpar polling
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
      this.pollingInterval = null;
    }
    
    // Resetar contadores
    this.reconnectAttempts = 0;
    
  }
}

// Instância singleton
export const notificationService = new NotificationService();

// Hook para usar o serviço
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<DSINotification[]>([]);
  const [pendingCount, setPendingCount] = useState(0);
  const [connectionStatus, setConnectionStatus] = useState(notificationService.getConnectionStatus());

  useEffect(() => {
    try {
      // Carregar notificações iniciais
      const initialNotifications = notificationService.getNotifications();
      const initialPendingCount = notificationService.getPendingCount();
      
      setNotifications(initialNotifications);
      setPendingCount(initialPendingCount);

      // Adicionar listener com debounce para evitar loops
      let timeoutId: NodeJS.Timeout;
      const unsubscribe = notificationService.addListener((newNotifications) => {
        // Debounce para evitar múltiplas atualizações
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          setNotifications(newNotifications);
          setPendingCount(notificationService.getPendingCount());
        }, 100);
      });

      return () => {
        clearTimeout(timeoutId);
        unsubscribe();
      };
    } catch (error) {
    }
  }, []);

  // Atualizar status da conexão periodicamente
  useEffect(() => {
    const updateConnectionStatus = () => {
      setConnectionStatus(notificationService.getConnectionStatus());
    };

    // Atualizar imediatamente
    updateConnectionStatus();

    // Atualizar a cada 5 segundos
    const interval = setInterval(updateConnectionStatus, 5000);

    return () => clearInterval(interval);
  }, []);

  return {
    notifications,
    pendingCount,
    connectionStatus,
    isConnected: connectionStatus.isWebSocketConnected,
    addNotification: notificationService.addNotification.bind(notificationService),
    markAsViewed: notificationService.markAsViewed.bind(notificationService),
    markAsProcessed: notificationService.markAsProcessed.bind(notificationService),
    simulateNotification: notificationService.simulateNotification.bind(notificationService),
    setCurrentUser: notificationService.setCurrentUser.bind(notificationService),
    getConnectionStatus: notificationService.getConnectionStatus.bind(notificationService),
    refreshNotifications: notificationService.refreshNotifications.bind(notificationService),
    disconnect: notificationService.disconnect.bind(notificationService)
  };
};

// Import necessário para o hook
import { useState, useEffect } from 'react';