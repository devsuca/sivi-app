'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, X } from 'lucide-react';
import { useNotifications } from '@/services/notificationService';
import { cn } from '@/lib/utils';

interface NotificationIndicatorProps {
  className?: string;
  onClick?: () => void;
}

export default function NotificationIndicator({ className, onClick }: NotificationIndicatorProps) {
  const { pendingCount } = useNotifications();
  const [isAnimating, setIsAnimating] = useState(false);

  // Animação quando há novas notificações
  React.useEffect(() => {
    if (pendingCount > 0) {
      setIsAnimating(true);
      const timer = setTimeout(() => setIsAnimating(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [pendingCount]);

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className={cn(
        "relative p-2 hover:bg-gray-100 transition-all duration-200",
        isAnimating && "animate-pulse",
        className
      )}
    >
      <Bell className={cn(
        "h-5 w-5 transition-colors",
        pendingCount > 0 ? "text-orange-500" : "text-gray-500"
      )} />
      
      {pendingCount > 0 && (
        <Badge 
          variant="destructive" 
          className={cn(
            "absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center text-xs font-bold",
            isAnimating && "animate-bounce"
          )}
        >
          {pendingCount > 9 ? '9+' : pendingCount}
        </Badge>
      )}
      
      {/* Efeito de brilho para notificações urgentes */}
      {pendingCount > 0 && (
        <div className="absolute inset-0 rounded-full bg-orange-500/20 animate-ping" />
      )}
    </Button>
  );
}










