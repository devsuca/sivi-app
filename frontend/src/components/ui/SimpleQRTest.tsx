'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Camera, CameraOff, CheckCircle, XCircle } from 'lucide-react';

export default function SimpleQRTest() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      console.log('🎥 Iniciando câmera...');
      setError(null);
      
      // Parar stream anterior se existir
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }

      // Solicitar acesso à câmera
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { 
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        } 
      });
      
      console.log('✅ Stream obtido:', stream);
      streamRef.current = stream;
      setCameraPermission('granted');

      // Conectar ao elemento de vídeo
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        console.log('✅ Vídeo iniciado');
        setIsScanning(true);
      }
    } catch (err: any) {
      console.error('❌ Erro ao iniciar câmera:', err);
      setError(`Erro: ${err.message}`);
      setCameraPermission('denied');
    }
  };

  const stopCamera = () => {
    console.log('🛑 Parando câmera...');
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
    setCameraPermission('unknown');
  };

  const captureFrame = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        
        // Simular detecção de QR Code
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        console.log('📸 Frame capturado:', imageData);
        setLastResult('Frame capturado com sucesso!');
      }
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          Teste Simples de Câmera
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status da Câmera */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Status da Câmera:</span>
          {cameraPermission === 'granted' && (
            <div className="flex items-center gap-1 text-green-600">
              <CheckCircle className="h-4 w-4" />
              <span>Ativa</span>
            </div>
          )}
          {cameraPermission === 'denied' && (
            <div className="flex items-center gap-1 text-red-600">
              <XCircle className="h-4 w-4" />
              <span>Negada</span>
            </div>
          )}
          {cameraPermission === 'unknown' && (
            <div className="flex items-center gap-1 text-gray-600">
              <CameraOff className="h-4 w-4" />
              <span>Desconhecido</span>
            </div>
          )}
        </div>

        {/* Erro */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Resultado */}
        {lastResult && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>{lastResult}</AlertDescription>
          </Alert>
        )}

        {/* Controles */}
        <div className="flex gap-2">
          <Button 
            onClick={startCamera} 
            disabled={isScanning}
            className="flex items-center gap-2"
          >
            <Camera className="h-4 w-4" />
            Iniciar Câmera
          </Button>
          
          <Button 
            onClick={stopCamera} 
            disabled={!isScanning}
            variant="outline"
            className="flex items-center gap-2"
          >
            <CameraOff className="h-4 w-4" />
            Parar Câmera
          </Button>
          
          <Button 
            onClick={captureFrame} 
            disabled={!isScanning}
            variant="secondary"
          >
            Capturar Frame
          </Button>
        </div>

        {/* Vídeo */}
        {isScanning && (
          <div className="relative">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full max-w-md mx-auto rounded-lg border"
            />
            <canvas
              ref={canvasRef}
              className="hidden"
            />
          </div>
        )}

        {/* Instruções */}
        <div className="text-sm text-muted-foreground">
          <p><strong>Instruções:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Clique em "Iniciar Câmera"</li>
            <li>Permita o acesso à câmera quando solicitado</li>
            <li>Verifique se o vídeo aparece</li>
            <li>Clique em "Capturar Frame" para testar</li>
            <li>Verifique os logs no console (F12)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}












