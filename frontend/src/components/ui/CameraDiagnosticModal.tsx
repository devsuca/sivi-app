'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Camera, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Settings, 
  Monitor,
  Smartphone,
  Wifi,
  Shield,
  Info
} from 'lucide-react';

interface CameraDiagnosticModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPermissionGranted?: () => void;
}

interface DiagnosticResult {
  test: string;
  status: 'success' | 'error' | 'warning' | 'info';
  message: string;
  details?: string;
}

export default function CameraDiagnosticModal({
  isOpen,
  onClose,
  onPermissionGranted
}: CameraDiagnosticModalProps) {
  const [isRunning, setIsRunning] = useState(false);
  const [results, setResults] = useState<DiagnosticResult[]>([]);
  const [permissionStatus, setPermissionStatus] = useState<'unknown' | 'granted' | 'denied' | 'prompt'>('unknown');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [currentStream, setCurrentStream] = useState<MediaStream | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const addResult = useCallback((test: string, status: DiagnosticResult['status'], message: string, details?: string) => {
    setResults(prev => [...prev, { test, status, message, details }]);
  }, []);

  const clearResults = useCallback(() => {
    setResults([]);
  }, []);

  // Effect para definir srcObject no video element
  useEffect(() => {
    if (videoRef.current && currentStream) {
      videoRef.current.srcObject = currentStream;
    }
  }, [currentStream]);

  const checkPermissionAPI = useCallback(async () => {
    try {
      if (!navigator.permissions) {
        addResult('API de Permissões', 'warning', 'API de permissões não disponível neste navegador');
        return 'unknown';
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setPermissionStatus(permission.state as any);
      
      if (permission.state === 'granted') {
        addResult('API de Permissões', 'success', 'Permissões de câmera concedidas');
      } else if (permission.state === 'denied') {
        addResult('API de Permissões', 'error', 'Permissões de câmera negadas', 'Clique no ícone de câmera na barra de endereços para permitir');
      } else {
        addResult('API de Permissões', 'info', 'Aguardando permissão do usuário');
      }
      
      return permission.state;
    } catch (error: any) {
      addResult('API de Permissões', 'error', `Erro ao verificar permissões: ${error.message}`);
      return 'unknown';
    }
  }, [addResult]);

  const enumerateCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      
      if (cameras.length > 0) {
        addResult('Detecção de Câmeras', 'success', `${cameras.length} câmera(s) detectada(s)`);
        cameras.forEach((camera, index) => {
          addResult(`Câmera ${index + 1}`, 'info', camera.label || 'Câmera sem nome', `ID: ${camera.deviceId.substring(0, 20)}...`);
        });
      } else {
        addResult('Detecção de Câmeras', 'error', 'Nenhuma câmera detectada', 'Verifique se há uma câmera conectada');
      }
      
      return cameras;
    } catch (error: any) {
      addResult('Detecção de Câmeras', 'error', `Erro ao enumerar câmeras: ${error.message}`);
      return [];
    }
  }, [addResult]);

  const testBasicPermission = useCallback(async () => {
    try {
      addResult('Teste de Permissão', 'info', 'Solicitando acesso à câmera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCurrentStream(stream);
      
      addResult('Teste de Permissão', 'success', 'Acesso à câmera concedido com sucesso!');
      setPermissionStatus('granted');
      onPermissionGranted?.();
      
      return true;
    } catch (error: any) {
      let errorMessage = '';
      let details = '';
      
      if (error.name === 'NotAllowedError') {
        errorMessage = 'Permissão de câmera negada';
        details = 'Clique no ícone de câmera na barra de endereços e selecione "Permitir"';
      } else if (error.name === 'NotFoundError') {
        errorMessage = 'Nenhuma câmera encontrada';
        details = 'Verifique se há uma câmera conectada e funcionando';
      } else if (error.name === 'NotReadableError') {
        errorMessage = 'Câmera em uso por outro aplicativo';
        details = 'Feche outros aplicativos que possam estar usando a câmera';
      } else {
        errorMessage = `Erro inesperado: ${error.message}`;
        details = 'Tente reiniciar o navegador ou usar um navegador diferente';
      }
      
      addResult('Teste de Permissão', 'error', errorMessage, details);
      setPermissionStatus('denied');
      return false;
    }
  }, [addResult, onPermissionGranted]);

  const testConstraints = useCallback(async () => {
    try {
      addResult('Teste de Constraints', 'info', 'Testando configurações específicas da câmera...');
      
      const constraints = {
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          facingMode: 'environment'
        }
      };
      
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      stream.getTracks().forEach(track => track.stop());
      
      addResult('Teste de Constraints', 'success', 'Configurações específicas funcionando');
      return true;
    } catch (error: any) {
      addResult('Teste de Constraints', 'warning', 'Configurações específicas falharam, usando configurações básicas');
      return false;
    }
  }, [addResult]);

  const checkBrowserCompatibility = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    let browser = 'Desconhecido';
    let compatible = false;
    
    if (userAgent.includes('chrome')) {
      browser = 'Google Chrome';
      compatible = true;
    } else if (userAgent.includes('firefox')) {
      browser = 'Mozilla Firefox';
      compatible = true;
    } else if (userAgent.includes('safari')) {
      browser = 'Safari';
      compatible = true;
    } else if (userAgent.includes('edge')) {
      browser = 'Microsoft Edge';
      compatible = true;
    }
    
    addResult('Compatibilidade do Navegador', compatible ? 'success' : 'warning', 
      `Navegador: ${browser}`, 
      compatible ? 'Navegador compatível com APIs de câmera' : 'Navegador pode ter limitações');
    
    return compatible;
  }, [addResult]);

  const checkProtocol = useCallback(() => {
    const isSecure = window.location.protocol === 'https:' || window.location.hostname === 'localhost';
    
    addResult('Protocolo de Segurança', isSecure ? 'success' : 'error',
      `Protocolo: ${window.location.protocol}`,
      isSecure ? 'Protocolo seguro - APIs de câmera disponíveis' : 'Protocolo inseguro - APIs de câmera podem estar bloqueadas');
    
    return isSecure;
  }, [addResult]);

  const runFullDiagnostic = useCallback(async () => {
    setIsRunning(true);
    clearResults();
    
    addResult('Início do Diagnóstico', 'info', 'Iniciando diagnóstico completo de câmera...');
    
    try {
      // 1. Verificar compatibilidade do navegador
      checkBrowserCompatibility();
      
      // 2. Verificar protocolo
      checkProtocol();
      
      // 3. Verificar API de permissões
      await checkPermissionAPI();
      
      // 4. Enumerar câmeras
      await enumerateCameras();
      
      // 5. Testar permissão básica
      const hasPermission = await testBasicPermission();
      
      if (hasPermission) {
        // 6. Testar constraints específicas
        await testConstraints();
        
        addResult('Diagnóstico Completo', 'success', 'Todos os testes passaram! Câmera funcionando perfeitamente.');
      } else {
        addResult('Diagnóstico Completo', 'error', 'Diagnóstico concluído com problemas. Verifique as recomendações abaixo.');
      }
      
    } catch (error: any) {
      addResult('Diagnóstico Completo', 'error', `Erro inesperado durante diagnóstico: ${error.message}`);
    } finally {
      setIsRunning(false);
    }
  }, [clearResults, checkBrowserCompatibility, checkProtocol, checkPermissionAPI, enumerateCameras, testBasicPermission, testConstraints, addResult]);

  const requestPermission = useCallback(async () => {
    setIsRunning(true);
    
    try {
      addResult('Solicitação de Permissão', 'info', 'Solicitando permissão de câmera...');
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCurrentStream(stream);
      
      addResult('Solicitação de Permissão', 'success', 'Permissão concedida com sucesso!');
      setPermissionStatus('granted');
      onPermissionGranted?.();
      
    } catch (error: any) {
      addResult('Solicitação de Permissão', 'error', `Permissão negada: ${error.message}`);
      setPermissionStatus('denied');
    } finally {
      setIsRunning(false);
    }
  }, [addResult, onPermissionGranted]);

  const stopCamera = useCallback(() => {
    if (currentStream) {
      currentStream.getTracks().forEach(track => track.stop());
      setCurrentStream(null);
      addResult('Câmera', 'info', 'Câmera parada');
    }
  }, [currentStream, addResult]);

  const getBrowserInstructions = useCallback(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    if (userAgent.includes('chrome')) {
      return {
        title: 'Google Chrome',
        steps: [
          'Clique no ícone de câmera na barra de endereços',
          'Selecione "Permitir" para este site',
          'Se não aparecer, clique no cadeado → "Configurações do site"',
          'Encontre "Câmera" e selecione "Permitir"',
          'Recarregue a página'
        ]
      };
    } else if (userAgent.includes('firefox')) {
      return {
        title: 'Mozilla Firefox',
        steps: [
          'Clique no ícone de câmera na barra de endereços',
          'Selecione "Permitir" para este site',
          'Se não aparecer, clique no escudo → "Configurações de permissões"',
          'Encontre "Câmera" e selecione "Permitir"',
          'Recarregue a página'
        ]
      };
    } else if (userAgent.includes('safari')) {
      return {
        title: 'Safari',
        steps: [
          'Vá em Safari → Preferências → Sites',
          'Selecione "Câmera" no menu lateral',
          'Encontre este site e selecione "Permitir"',
          'Recarregue a página'
        ]
      };
    } else if (userAgent.includes('edge')) {
      return {
        title: 'Microsoft Edge',
        steps: [
          'Clique no ícone de câmera na barra de endereços',
          'Selecione "Permitir" para este site',
          'Se não aparecer, clique no cadeado → "Permissões"',
          'Encontre "Câmera" e selecione "Permitir"',
          'Recarregue a página'
        ]
      };
    } else {
      return {
        title: 'Navegador Genérico',
        steps: [
          'Procure por um ícone de câmera na barra de endereços',
          'Clique nele e selecione "Permitir"',
          'Se não aparecer, procure por configurações de privacidade',
          'Permita o acesso à câmera para este site',
          'Recarregue a página'
        ]
      };
    }
  }, []);

  const getStatusIcon = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-600" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case 'info': return <Info className="h-4 w-4 text-blue-600" />;
    }
  };

  const getStatusColor = (status: DiagnosticResult['status']) => {
    switch (status) {
      case 'success': return 'text-green-800 bg-green-50 border-green-200';
      case 'error': return 'text-red-800 bg-red-50 border-red-200';
      case 'warning': return 'text-yellow-800 bg-yellow-50 border-yellow-200';
      case 'info': return 'text-blue-800 bg-blue-50 border-blue-200';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Diagnóstico de Câmera - SIVI+360°
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="diagnostic" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="diagnostic">Diagnóstico</TabsTrigger>
            <TabsTrigger value="instructions">Instruções</TabsTrigger>
            <TabsTrigger value="results">Resultados</TabsTrigger>
          </TabsList>

          <TabsContent value="diagnostic" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Monitor className="h-5 w-5" />
                  Status Atual
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4">
                  <Badge 
                    className={
                      permissionStatus === 'granted' 
                        ? 'bg-green-100 text-green-800' 
                        : permissionStatus === 'denied'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }
                  >
                    {permissionStatus === 'granted' && <CheckCircle className="h-3 w-3 mr-1" />}
                    {permissionStatus === 'denied' && <XCircle className="h-3 w-3 mr-1" />}
                    {permissionStatus === 'prompt' && <AlertTriangle className="h-3 w-3 mr-1" />}
                    {permissionStatus === 'unknown' && <Info className="h-3 w-3 mr-1" />}
                    {permissionStatus === 'granted' ? 'Permitido' : 
                     permissionStatus === 'denied' ? 'Negado' : 
                     permissionStatus === 'prompt' ? 'Aguardando' : 'Desconhecido'}
                  </Badge>
                  
                  <Badge variant="outline">
                    <Camera className="h-3 w-3 mr-1" />
                    {availableCameras.length} câmera(s)
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                onClick={runFullDiagnostic}
                disabled={isRunning}
                className="flex items-center gap-2"
              >
                <RefreshCw className={`h-4 w-4 ${isRunning ? 'animate-spin' : ''}`} />
                {isRunning ? '🔄 Executando...' : '🚀 Executar Diagnóstico'}
              </Button>
              
              <Button
                onClick={requestPermission}
                disabled={isRunning || permissionStatus === 'granted'}
                variant="outline"
                className="flex items-center gap-2"
              >
                <Camera className="h-4 w-4" />
                📷 Solicitar Permissão
              </Button>
              
              {currentStream && (
                <Button
                  onClick={stopCamera}
                  variant="destructive"
                  className="flex items-center gap-2"
                >
                  <XCircle className="h-4 w-4" />
                  ⏹️ Parar Câmera
                </Button>
              )}
            </div>

            {currentStream && (
              <Card>
                <CardHeader>
                  <CardTitle>Preview da Câmera</CardTitle>
                </CardHeader>
                <CardContent>
                  <video
                    ref={videoRef}
                    autoPlay
                    muted
                    playsInline
                    className="w-full max-w-md rounded-lg"
                  />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="instructions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  Instruções para {getBrowserInstructions().title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {getBrowserInstructions().steps.map((step, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Badge variant="outline" className="mt-0.5">
                        {index + 1}
                      </Badge>
                      <p className="text-sm">{step}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                <strong>Dica:</strong> Se as instruções acima não funcionarem, tente usar o modo incógnito/privado do navegador ou reinicie o navegador completamente.
              </AlertDescription>
            </Alert>
          </TabsContent>

          <TabsContent value="results" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Resultados do Diagnóstico</h3>
              <Button
                onClick={clearResults}
                variant="outline"
                size="sm"
              >
                Limpar
              </Button>
            </div>
            
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {results.length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  Nenhum resultado ainda. Execute o diagnóstico para ver os resultados.
                </p>
              ) : (
                results.map((result, index) => (
                  <div
                    key={index}
                    className={`p-3 rounded-lg border ${getStatusColor(result.status)}`}
                  >
                    <div className="flex items-start gap-3">
                      {getStatusIcon(result.status)}
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{result.test}</span>
                          <Badge variant="outline" className="text-xs">
                            {new Date().toLocaleTimeString()}
                          </Badge>
                        </div>
                        <p className="text-sm mt-1">{result.message}</p>
                        {result.details && (
                          <p className="text-xs mt-1 opacity-75">{result.details}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
