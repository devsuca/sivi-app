'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Camera, Play, Pause, RotateCcw, CheckCircle, AlertTriangle } from 'lucide-react';

interface StartReadingButtonProps {
  isScanning: boolean;
  cameraPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  availableCameras: number;
  onStart: () => void;
  onStop: () => void;
  disabled?: boolean;
  className?: string;
}

export default function StartReadingButton({
  isScanning,
  cameraPermission,
  availableCameras,
  onStart,
  onStop,
  disabled = false,
  className = ""
}: StartReadingButtonProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [pulseAnimation, setPulseAnimation] = useState(false);

  // Animação de pulso quando há problemas
  useEffect(() => {
    if (cameraPermission === 'denied' || availableCameras === 0) {
      setPulseAnimation(true);
      const interval = setInterval(() => {
        setPulseAnimation(prev => !prev);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setPulseAnimation(false);
    }
  }, [cameraPermission, availableCameras]);

  const getButtonContent = () => {
    if (isScanning) {
      return {
        icon: <Pause className="h-4 w-4" />,
        text: "Parar Leitura",
        variant: "destructive" as const,
        badge: null
      };
    }

    if (cameraPermission === 'denied') {
      return {
        icon: <AlertTriangle className="h-4 w-4" />,
        text: "🔧 Resolver & Iniciar",
        variant: "default" as const,
        badge: <Badge variant="destructive" className="ml-2 text-xs">Permissão Negada</Badge>
      };
    }

    if (availableCameras === 0) {
      return {
        icon: <Camera className="h-4 w-4" />,
        text: "📷 Câmera Não Encontrada",
        variant: "outline" as const,
        badge: <Badge variant="secondary" className="ml-2 text-xs">Sem Câmera</Badge>
      };
    }

    if (cameraPermission === 'granted') {
      return {
        icon: <Play className="h-4 w-4" />,
        text: "🚀 Iniciar Leitura",
        variant: "default" as const,
        badge: <Badge variant="default" className="ml-2 text-xs bg-green-100 text-green-800">Pronto</Badge>
      };
    }

    return {
      icon: <Camera className="h-4 w-4" />,
      text: "📷 Iniciar Leitura",
      variant: "default" as const,
      badge: <Badge variant="secondary" className="ml-2 text-xs">Aguardando</Badge>
    };
  };

  const buttonContent = getButtonContent();

  const handleClick = () => {
    if (isScanning) {
      onStop();
    } else {
      onStart();
    }
  };

  const isDisabled = disabled || (cameraPermission === 'denied' && !isScanning) || availableCameras === 0;

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <Button
        onClick={handleClick}
        disabled={isDisabled}
        variant={buttonContent.variant}
        className={`
          flex items-center gap-2 transition-all duration-300
          ${pulseAnimation ? 'animate-pulse' : ''}
          ${isHovered ? 'scale-105' : 'scale-100'}
          ${cameraPermission === 'granted' && !isScanning ? 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700' : ''}
          ${cameraPermission === 'denied' ? 'bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700' : ''}
          ${isScanning ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700' : ''}
        `}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        {buttonContent.icon}
        <span className="font-medium">{buttonContent.text}</span>
        {isScanning && (
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
            <div className="w-2 h-2 bg-white rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
          </div>
        )}
      </Button>
      
      {buttonContent.badge}
      
      {/* Indicador de status adicional */}
      <div className="flex items-center gap-1 text-xs text-muted-foreground">
        {cameraPermission === 'granted' && (
          <CheckCircle className="h-3 w-3 text-green-600" />
        )}
        {cameraPermission === 'denied' && (
          <AlertTriangle className="h-3 w-3 text-red-600" />
        )}
        {availableCameras > 0 && (
          <span>{availableCameras} câmera(s)</span>
        )}
      </div>
    </div>
  );
}

