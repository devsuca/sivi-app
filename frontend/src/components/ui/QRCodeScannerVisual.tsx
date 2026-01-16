'use client';

import React, { useEffect, useState } from 'react';
import { Camera, QrCode, ScanLine } from 'lucide-react';

interface QRCodeScannerVisualProps {
  isScanning: boolean;
  hasPermission: boolean;
  className?: string;
}

export default function QRCodeScannerVisual({
  isScanning,
  hasPermission,
  className = ""
}: QRCodeScannerVisualProps) {
  const [scanLinePosition, setScanLinePosition] = useState(0);
  const [pulseScale, setPulseScale] = useState(1);

  // Animação da linha de varredura
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setScanLinePosition(prev => (prev + 2) % 100);
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  // Animação de pulso
  useEffect(() => {
    if (isScanning) {
      const interval = setInterval(() => {
        setPulseScale(prev => prev === 1 ? 1.05 : 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isScanning]);

  return (
    <div className={`relative ${className}`}>
      {/* Área de leitura principal */}
      <div className={`
        w-full min-h-[300px] border-2 border-dashed rounded-lg flex items-center justify-center relative overflow-hidden
        ${isScanning 
          ? 'border-blue-500 bg-blue-50 shadow-lg' 
          : hasPermission
          ? 'border-green-500 bg-green-50'
          : 'border-gray-300 bg-gray-50'
        }
        transition-all duration-300
      `}>
        
        {/* Linha de varredura animada */}
        {isScanning && (
          <div 
            className="absolute w-full h-1 bg-blue-500 opacity-80 rounded-full shadow-lg"
            style={{
              top: `${scanLinePosition}%`,
              transform: 'translateY(-50%)',
              boxShadow: '0 0 10px rgba(59, 130, 246, 0.8)'
            }}
          />
        )}

        {/* Canto superior esquerdo */}
        <div className="absolute top-4 left-4 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-lg" />
        
        {/* Canto superior direito */}
        <div className="absolute top-4 right-4 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-lg" />
        
        {/* Canto inferior esquerdo */}
        <div className="absolute bottom-4 left-4 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-lg" />
        
        {/* Canto inferior direito */}
        <div className="absolute bottom-4 right-4 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-lg" />

        {/* Conteúdo central */}
        <div className="text-center z-10">
          {isScanning ? (
            <div className="space-y-4">
              <div className="relative">
                <QrCode 
                  className={`h-16 w-16 mx-auto text-blue-600 transition-transform duration-1000 ${
                    pulseScale === 1.05 ? 'scale-110' : 'scale-100'
                  }`}
                />
                <div className="absolute inset-0 flex items-center justify-center">
                  <ScanLine className="h-8 w-8 text-blue-500 animate-pulse" />
                </div>
              </div>
              <div className="space-y-2">
                <p className="text-lg font-semibold text-blue-800">
                  🔍 Escaneando QR Code...
                </p>
                <p className="text-sm text-blue-600">
                  Posicione o documento dentro da área de leitura
                </p>
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            </div>
          ) : hasPermission ? (
            <div className="space-y-4">
              <Camera className="h-16 w-16 mx-auto text-green-600" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-green-800">
                  📷 Câmera Pronta
                </p>
                <p className="text-sm text-green-600">
                  Clique em "Iniciar Leitura" para começar
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Camera className="h-16 w-16 mx-auto text-gray-400" />
              <div className="space-y-2">
                <p className="text-lg font-semibold text-gray-600">
                  📷 Câmera Desabilitada
                </p>
                <p className="text-sm text-gray-500">
                  Permita o acesso à câmera para continuar
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Efeito de brilho quando escaneando */}
        {isScanning && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-200/20 to-transparent animate-pulse" />
        )}
      </div>

      {/* Instruções adicionais */}
      <div className="mt-4 text-center">
        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <span>Posicione o QR Code</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Mantenha estável</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
            <span>Boa iluminação</span>
          </div>
        </div>
      </div>
    </div>
  );
}

