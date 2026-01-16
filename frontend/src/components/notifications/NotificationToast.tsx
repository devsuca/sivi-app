'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  Bell, 
  X, 
  AlertTriangle, 
  Clock, 
  CheckCircle, 
  Eye,
  User,
  MapPin,
  Calendar
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NotificationToastProps {
  notification: {
    id: string;
    nome_pessoa: string;
    orgao: string;
    data_visita: string;
    hora_visita: string;
    urgencia: string;
    status: string;
    observacoes?: string;
    data_envio: string;
  };
  onClose: (id: string) => void;
  onView: (id: string) => void;
  onProcess: (id: string) => void;
  autoClose?: boolean;
  duration?: number;
}

export default function NotificationToast({ 
  notification, 
  onClose, 
  onView, 
  onProcess, 
  autoClose = true, 
  duration = 5000 
}: NotificationToastProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  useEffect(() => {
    // Animação de entrada
    const timer = setTimeout(() => setIsVisible(true), 100);
    
    // Auto-close
    if (autoClose) {
      const closeTimer = setTimeout(() => {
        handleClose();
      }, duration);
      
      return () => clearTimeout(closeTimer);
    }
    
    return () => clearTimeout(timer);
  }, [autoClose, duration]);

  const handleClose = () => {
    setIsClosing(true);
    setTimeout(() => {
      onClose(notification.id);
    }, 300);
  };

  const getUrgenciaColor = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return 'destructive';
      case 'media': return 'default';
      case 'baixa': return 'secondary';
      default: return 'secondary';
    }
  };

  const getUrgenciaIcon = (urgencia: string) => {
    switch (urgencia) {
      case 'alta': return <AlertTriangle className="h-4 w-4 text-red-500 animate-pulse" />;
      case 'media': return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'baixa': return <CheckCircle className="h-4 w-4 text-green-500" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 transform transition-all duration-300 ease-in-out",
        isVisible && !isClosing ? "translate-x-0 opacity-100" : "translate-x-full opacity-0",
        isClosing && "translate-x-full opacity-0 scale-95"
      )}
    >
      <Card className="w-80 shadow-2xl border-l-4 border-l-orange-500 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            {/* Ícone de urgência */}
            <div className="flex-shrink-0 mt-1">
              {getUrgenciaIcon(notification.urgencia)}
            </div>

            {/* Conteúdo */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant={getUrgenciaColor(notification.urgencia)} className="text-xs">
                  {notification.urgencia.toUpperCase()}
                </Badge>
                <span className="text-xs text-gray-500">Nova notificação</span>
              </div>

              <h4 className="font-semibold text-sm mb-2 line-clamp-1">
                Visita - {notification.nome_pessoa}
              </h4>

              <div className="space-y-1 text-xs text-gray-600">
                <div className="flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  <span>{notification.data_visita} às {notification.hora_visita}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  <span>{notification.orgao}</span>
                </div>
              </div>

              {notification.observacoes && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">
                  {notification.observacoes}
                </p>
              )}
            </div>

            {/* Botão de fechar */}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0 hover:bg-gray-100"
            >
              <X className="h-3 w-3" />
            </Button>
          </div>

          {/* Ações */}
          <div className="flex gap-2 mt-3 pt-3 border-t border-gray-100">
            <Button
              size="sm"
              variant="outline"
              onClick={() => onView(notification.id)}
              className="flex-1 text-xs h-7"
            >
              <Eye className="h-3 w-3 mr-1" />
              Visualizar
            </Button>
            <Button
              size="sm"
              onClick={() => onProcess(notification.id)}
              className="flex-1 text-xs h-7 bg-green-600 hover:bg-green-700"
            >
              <CheckCircle className="h-3 w-3 mr-1" />
              Processar
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}










