'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  TrendingUp, 
  TrendingDown, 
  Activity, 
  Clock, 
  CheckCircle, 
  AlertTriangle,
  Zap,
  BarChart3
} from 'lucide-react';
import { useNotifications } from '@/services/notificationService';
import { cn } from '@/lib/utils';

interface NotificationStatsProps {
  className?: string;
}

export default function NotificationStats({ className }: NotificationStatsProps) {
  const { notifications, pendingCount } = useNotifications();

  // Calcular estatísticas
  const totalNotifications = notifications.length;
  const processedCount = notifications.filter(n => n.status === 'processada').length;
  const viewedCount = notifications.filter(n => n.status === 'visualizada').length;
  const highUrgencyCount = notifications.filter(n => n.urgencia === 'alta').length;
  const mediumUrgencyCount = notifications.filter(n => n.urgencia === 'media').length;
  const lowUrgencyCount = notifications.filter(n => n.urgencia === 'baixa').length;

  // Calcular métricas de tempo
  const today = new Date();
  const todayNotifications = notifications.filter(n => {
    const notificationDate = new Date(n.data_envio);
    return notificationDate.toDateString() === today.toDateString();
  }).length;

  const thisWeekNotifications = notifications.filter(n => {
    const notificationDate = new Date(n.data_envio);
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    return notificationDate >= weekAgo;
  }).length;

  const avgProcessingTime = notifications
    .filter(n => n.status === 'processada')
    .reduce((acc, n) => {
      const sent = new Date(n.data_envio);
      const processed = new Date(); // Assumindo que foi processada agora
      const diffInMinutes = (processed.getTime() - sent.getTime()) / (1000 * 60);
      return acc + diffInMinutes;
    }, 0) / Math.max(processedCount, 1);

  const stats = [
    {
      title: 'Total de Notificações',
      value: totalNotifications,
      icon: BarChart3,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      change: '+12%',
      changeType: 'positive' as const
    },
    {
      title: 'Pendentes',
      value: pendingCount,
      icon: Clock,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      change: pendingCount > 0 ? 'Atenção' : 'Em dia',
      changeType: pendingCount > 0 ? 'negative' as const : 'positive' as const
    },
    {
      title: 'Processadas',
      value: processedCount,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      change: `${Math.round((processedCount / Math.max(totalNotifications, 1)) * 100)}%`,
      changeType: 'positive' as const
    },
    {
      title: 'Alta Urgência',
      value: highUrgencyCount,
      icon: AlertTriangle,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      change: highUrgencyCount > 0 ? 'Crítico' : 'Normal',
      changeType: highUrgencyCount > 0 ? 'negative' as const : 'positive' as const
    }
  ];

  return (
    <div className={cn("grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4", className)}>
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                  <Icon className={cn("h-5 w-5", stat.color)} />
                </div>
                <Badge 
                  variant={stat.changeType === 'positive' ? 'default' : 'destructive'}
                  className="text-xs"
                >
                  {stat.changeType === 'positive' ? (
                    <TrendingUp className="h-3 w-3 mr-1" />
                  ) : (
                    <TrendingDown className="h-3 w-3 mr-1" />
                  )}
                  {stat.change}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                <p className="text-sm text-gray-600">{stat.title}</p>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}










