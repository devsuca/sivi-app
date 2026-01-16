'use client';

import { useState, useEffect, useCallback } from 'react';
import { useNotifications } from '@/services/notificationService';
import { toast } from 'sonner';

interface NotificationManager {
  newNotifications: any[];
  showToast: (notification: any) => void;
  dismissToast: (id: string) => void;
  markAsViewed: (id: string) => void;
  markAsProcessed: (id: string) => void;
}

export function useNotificationManager(): NotificationManager {
  const { notifications, markAsViewed: markViewed, markAsProcessed: markProcessed } = useNotifications();
  const [newNotifications, setNewNotifications] = useState<any[]>([]);
  const [previousNotifications, setPreviousNotifications] = useState<any[]>([]);

  // Detectar novas notificações
  useEffect(() => {
    if (notifications.length > previousNotifications.length) {
      const newOnes = notifications.filter(
        n => !previousNotifications.some(p => p.id === n.id)
      );
      
      newOnes.forEach(notification => {
        if (notification.status === 'pendente') {
          showToast(notification);
        }
      });
    }
    
    setPreviousNotifications(notifications);
  }, [notifications, previousNotifications]);

  const showToast = useCallback((notification: any) => {
    setNewNotifications(prev => [...prev, notification]);
    
    // Auto-remove após 8 segundos
    setTimeout(() => {
      dismissToast(notification.id);
    }, 8000);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setNewNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAsViewed = useCallback((id: string) => {
    markViewed(id);
    dismissToast(id);
    toast.success('Notificação marcada como visualizada');
  }, [markViewed, dismissToast]);

  const markAsProcessed = useCallback((id: string) => {
    markProcessed(id);
    dismissToast(id);
    toast.success('Notificação marcada como processada');
  }, [markProcessed, dismissToast]);

  return {
    newNotifications,
    showToast,
    dismissToast,
    markAsViewed,
    markAsProcessed
  };
}










