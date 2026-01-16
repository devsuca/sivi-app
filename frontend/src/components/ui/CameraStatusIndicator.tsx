'use client';

import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Camera, 
  Wifi,
  Shield,
  Monitor
} from 'lucide-react';

interface CameraStatusIndicatorProps {
  permission: 'granted' | 'denied' | 'prompt' | 'unknown';
  availableCameras: number;
  isScanning: boolean;
  className?: string;
}

export default function CameraStatusIndicator({
  permission,
  availableCameras,
  isScanning,
  className = ""
}: CameraStatusIndicatorProps) {
  const getStatusInfo = () => {
    if (isScanning) {
      return {
        icon: <Camera className="h-4 w-4 text-blue-600" />,
        text: "Lendo QR Code",
        color: "bg-blue-100 text-blue-800 border-blue-200",
        status: "active"
      };
    }

    if (permission === 'granted' && availableCameras > 0) {
      return {
        icon: <CheckCircle className="h-4 w-4 text-green-600" />,
        text: "Câmera Pronta",
        color: "bg-green-100 text-green-800 border-green-200",
        status: "ready"
      };
    }

    if (permission === 'denied') {
      return {
        icon: <XCircle className="h-4 w-4 text-red-600" />,
        text: "Permissão Negada",
        color: "bg-red-100 text-red-800 border-red-200",
        status: "denied"
      };
    }

    if (availableCameras === 0) {
      return {
        icon: <AlertTriangle className="h-4 w-4 text-yellow-600" />,
        text: "Sem Câmera",
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        status: "no-camera"
      };
    }

    return {
      icon: <AlertTriangle className="h-4 w-4 text-gray-600" />,
      text: "Aguardando",
      color: "bg-gray-100 text-gray-800 border-gray-200",
      status: "waiting"
    };
  };

  const statusInfo = getStatusInfo();

  return (
    <Card className={`${className}`}>
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {statusInfo.icon}
            <div>
              <p className="font-medium text-sm">Status da Câmera</p>
              <p className="text-xs text-muted-foreground">
                {availableCameras} câmera(s) detectada(s)
              </p>
            </div>
          </div>
          
          <Badge className={`${statusInfo.color} border`}>
            {statusInfo.text}
          </Badge>
        </div>

        {/* Indicadores adicionais */}
        <div className="flex items-center gap-4 mt-3 pt-3 border-t">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Monitor className="h-3 w-3" />
            <span>Navegador</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Shield className="h-3 w-3" />
            <span>Seguro</span>
          </div>
          
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Wifi className="h-3 w-3" />
            <span>Conectado</span>
          </div>
        </div>

        {/* Barra de progresso visual */}
        <div className="mt-3">
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className={`h-2 rounded-full transition-all duration-500 ${
                statusInfo.status === 'ready' ? 'bg-green-500 w-full' :
                statusInfo.status === 'active' ? 'bg-blue-500 w-full animate-pulse' :
                statusInfo.status === 'denied' ? 'bg-red-500 w-1/3' :
                statusInfo.status === 'no-camera' ? 'bg-yellow-500 w-1/2' :
                'bg-gray-400 w-1/4'
              }`}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

