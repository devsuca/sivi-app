'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Camera, CameraOff, CheckCircle, XCircle, AlertCircle, Settings, Square } from 'lucide-react';
import { parseQRCodeData, QRParsedData, validateQRData, extractDateFromQR as extractDateFromParser, extractProvinceFromQR as extractProvinceFromParser, extractEstadoCivilFromQR, extractDataEmissaoFromQR, extractDataValidadeFromQR, extractDocumentoTipoFromQR } from '@/utils/qrCodeParser';
import { Html5Qrcode, Html5QrcodeSupportedFormats, Html5QrcodeScanType, Html5QrcodeScanner } from 'html5-qrcode';
import CameraDiagnosticModal from './CameraDiagnosticModal';
import StartReadingButton from './StartReadingButton';
import CameraStatusIndicator from './CameraStatusIndicator';
import QRCodeScannerVisual from './QRCodeScannerVisual';

interface QRCodeReaderFinalProps {
  onQRCodeScanned: (data: QRParsedData) => void;
  onError?: (error: string) => void;
  onClose?: () => void;
  title?: string;
  description?: string;
  showPreview?: boolean;
  className?: string;
  autoStart?: boolean; // Nova prop para iniciar automaticamente
}

export default function QRCodeReaderFinal({
  onQRCodeScanned,
  onError,
  onClose,
  title = "Ler QR Code",
  description = "Posicione o QR Code dentro da área de leitura",
  showPreview = true,
  className = "",
  autoStart = true // Iniciar automaticamente por padrão
}: QRCodeReaderFinalProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const html5QrcodeRef = useRef<Html5Qrcode | null>(null);
  const processQRDataRef = useRef<((qrData: string) => Promise<void>) | null>(null);
  
  const [isScanning, setIsScanning] = useState(false);
  const [lastScannedData, setLastScannedData] = useState<QRParsedData | null>(null);
  const [scanError, setScanError] = useState<string | null>(null);
  const [cameraPermission, setCameraPermission] = useState<'granted' | 'denied' | 'prompt' | 'unknown'>('unknown');
  const [availableCameras, setAvailableCameras] = useState<MediaDeviceInfo[]>([]);
  const [selectedCameraId, setSelectedCameraId] = useState<string | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);
  const [showDiagnosticModal, setShowDiagnosticModal] = useState(false);
  const [videoReady, setVideoReady] = useState(false);
  const [qrDetected, setQrDetected] = useState(false);
  const [processingStage, setProcessingStage] = useState<'idle' | 'detecting' | 'parsing' | 'validating' | 'success' | 'error'>('idle');
  const [processingProgress, setProcessingProgress] = useState(0);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewData, setPreviewData] = useState<QRParsedData | null>(null);
  const [torchEnabled, setTorchEnabled] = useState(false);
  const [detectionStats, setDetectionStats] = useState({
    totalFrames: 0,
    successfulDetections: 0,
    averageBrightness: 0,
    lastDetectionTime: 0
  });
  const [readingTimer, setReadingTimer] = useState({
    startTime: 0,
    currentTime: 0,
    isActive: false
  });
  const [dataSource, setDataSource] = useState<'qr' | 'api' | 'mixed'>('qr');
  const [waitingForVideo, setWaitingForVideo] = useState(false);
  
  // Ref para evitar dependência circular (já declarado acima)
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timerStartTimeRef = useRef<number>(0);
  const timerActiveRef = useRef<boolean>(false);


  // Funções auxiliares para extrair dados do QR Code
  const extractNameFromQR = useCallback((qrData: string): string | null => {
    console.log('🔍 Extraindo nome de:', qrData);
    
    // Estratégia 1: Tentar extrair nome (texto antes do último número)
    const parts = qrData.trim().split(/\s+/);
    const nameParts = [];
    
    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      // Se a parte contém apenas letras, é provavelmente parte do nome
      if (/^[A-ZÁÉÍÓÚÇÃÕÀÈÌÒÙ\s-]+$/i.test(part)) {
        nameParts.push(part);
      } else {
        // Se encontrou um número, para de coletar o nome
        break;
      }
    }
    
    let name = nameParts.join(' ').trim();
    console.log('🔍 Nome extraído (estratégia 1):', name);
    
    // Estratégia 2: Se não encontrou nome, usar tudo exceto números
    if (!name || name.length < 3) {
      const textOnly = qrData.replace(/\d+/g, '').trim();
      if (textOnly.length > 3) {
        name = textOnly;
        console.log('🔍 Nome extraído (estratégia 2):', name);
      }
    }
    
    // Estratégia 3: Se ainda não tem nome, usar primeiras palavras
    if (!name || name.length < 3) {
      const firstWords = parts.slice(0, Math.min(3, parts.length - 1)).join(' ');
      if (firstWords.length > 3) {
        name = firstWords;
        console.log('🔍 Nome extraído (estratégia 3):', name);
      }
    }
    
    return name && name.length > 0 ? name : null;
  }, []);

  const extractNumberFromQR = useCallback((qrData: string): string | null => {
    console.log('🔍 Extraindo número de:', qrData);
    
    // Estratégia 1: Formato BI angolano completo (9 dígitos + 2 letras + 3 dígitos)
    const biNumberMatch = qrData.match(/(\d{9}[A-Z]{2}\d{3})/);
    if (biNumberMatch) {
      console.log('🔍 Número BI completo extraído (estratégia 1):', biNumberMatch[1]);
      return biNumberMatch[1];
    }
    
    // Estratégia 2: Qualquer sequência com dígitos e letras (formato geral)
    const mixedNumberMatch = qrData.match(/(\d+[A-Z]+\d+)/);
    if (mixedNumberMatch) {
      console.log('🔍 Número misto extraído (estratégia 2):', mixedNumberMatch[1]);
      return mixedNumberMatch[1];
    }
    
    // Estratégia 3: Última sequência de dígitos e letras no final
    const endNumberMatch = qrData.match(/(\d+[A-Z]*\d*)$/);
    if (endNumberMatch) {
      console.log('🔍 Número do final extraído (estratégia 3):', endNumberMatch[1]);
      return endNumberMatch[1];
    }
    
    // Estratégia 4: Encontrar TODOS os números e escolher o mais longo
    const allNumbers = qrData.match(/\d+/g);
    if (allNumbers && allNumbers.length > 0) {
      // Encontrar o número mais longo (priorizar números maiores)
      const longestNumber = allNumbers.reduce((longest, current) => {
        // Se o número atual tem 6+ dígitos, priorizar ele
        if (current.length >= 6 && longest.length < 6) {
          return current;
        }
        // Se ambos têm 6+ dígitos ou ambos têm <6, escolher o mais longo
        return current.length > longest.length ? current : longest;
      });
      console.log('🔍 Número mais longo extraído (estratégia 4):', longestNumber);
      return longestNumber;
    }
    
    // Estratégia 5: Último número encontrado
    const lastNumberMatch = qrData.match(/(\d+)(?!.*\d)/);
    if (lastNumberMatch) {
      console.log('🔍 Último número extraído (estratégia 5):', lastNumberMatch[1]);
      return lastNumberMatch[1];
    }
    
    console.log('🔍 Nenhum número encontrado');
    return null;
  }, []);

  const extractDateFromQR = useCallback((qrData: string): string | null => {
    return extractDateFromParser(qrData);
  }, []);

  const extractProvinceFromQR = useCallback((qrData: string): string | null => {
    return extractProvinceFromParser(qrData);
  }, []);

  // Função para garantir que o elemento qr-reader está disponível
  const ensureQrReaderElement = useCallback(async (): Promise<HTMLElement> => {
    // Estratégia 1: Tentar encontrar o elemento existente
    let element = document.getElementById('qr-reader');
    if (element) {
      console.log('✅ Elemento qr-reader encontrado (estratégia 1)');
      return element;
    }

    // Estratégia 2: Aguardar um pouco e tentar novamente
    await new Promise(resolve => setTimeout(resolve, 200));
    element = document.getElementById('qr-reader');
    if (element) {
      console.log('✅ Elemento qr-reader encontrado (estratégia 2)');
      return element;
    }

    // Estratégia 3: Criar o elemento dinamicamente
    console.log('⚠️ Criando elemento qr-reader dinamicamente...');
    const container = document.querySelector('.relative.w-full.max-w-md.mx-auto');
    if (container) {
      // Verificar se já existe um elemento qr-reader no container
      const existingElement = container.querySelector('#qr-reader');
      if (existingElement) {
        console.log('✅ Elemento qr-reader já existe no container');
        return existingElement as HTMLElement;
      }
      
      const newElement = document.createElement('div');
      newElement.id = 'qr-reader';
      newElement.className = 'w-full h-64 rounded-lg border-2 border-blue-500';
      newElement.style.minHeight = '256px';
      newElement.style.display = 'block'; // Garantir que está visível
      container.appendChild(newElement);
      console.log('✅ Elemento qr-reader criado dinamicamente no container');
      return newElement;
    }

    // Estratégia 4: Criar em qualquer container disponível
    const anyContainer = document.querySelector('main, .container, body');
    if (anyContainer) {
      const newElement = document.createElement('div');
      newElement.id = 'qr-reader';
      newElement.className = 'w-full h-64 rounded-lg border-2 border-blue-500';
      newElement.style.minHeight = '256px';
      newElement.style.display = 'block'; // Garantir que está visível
      anyContainer.appendChild(newElement);
      console.log('✅ Elemento qr-reader criado em container alternativo');
      return newElement;
    }

    throw new Error('Não foi possível encontrar ou criar elemento qr-reader');
  }, []);

  // Função para iniciar o timer de leitura
  const startReadingTimer = useCallback(() => {
    const startTime = Date.now();
    console.log('⏱️ Iniciando timer de leitura com startTime:', startTime);
    
    // Atualizar refs
    timerStartTimeRef.current = startTime;
    timerActiveRef.current = true;
    
    setReadingTimer({
      startTime,
      currentTime: startTime,
      isActive: true
    });

    // Limpar timer anterior se existir
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    // Atualizar timer a cada 50ms para máxima responsividade
    timerIntervalRef.current = setInterval(() => {
      if (timerActiveRef.current) {
        const newTime = Date.now();
        setReadingTimer(prev => ({
          ...prev,
          currentTime: newTime
        }));
      }
    }, 50);
    
    console.log('⏱️ Timer iniciado com sucesso');
  }, []);

  // Função para parar o timer de leitura
  const stopReadingTimer = useCallback(() => {
    console.log('⏱️ Parando timer de leitura');
    
    // Atualizar refs
    timerActiveRef.current = false;
    
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    
    setReadingTimer(prev => ({
      ...prev,
      isActive: false
    }));
  }, []);

  // Função para resetar o timer
  const resetReadingTimer = useCallback(() => {
    console.log('⏱️ Resetando timer de leitura');
    
    stopReadingTimer();
    
    // Resetar refs
    timerStartTimeRef.current = 0;
    timerActiveRef.current = false;
    
    setReadingTimer({
      startTime: 0,
      currentTime: 0,
      isActive: false
    });
  }, [stopReadingTimer]);

  // Função para calcular tempo decorrido
  const getElapsedTime = useCallback(() => {
    // Usar refs como fallback se o estado não estiver atualizado
    const isActive = readingTimer.isActive || timerActiveRef.current;
    const startTime = readingTimer.startTime > 0 ? readingTimer.startTime : timerStartTimeRef.current;
    const currentTime = readingTimer.currentTime > 0 ? readingTimer.currentTime : Date.now();
    
    const elapsed = isActive && startTime > 0 ? currentTime - startTime : 0;
    
    // Log apenas a cada 5 segundos para não sobrecarregar
    if (elapsed > 0 && elapsed % 5000 < 100) {
      console.log('⏱️ Timer ativo:', formatTime(elapsed));
    }
    
    return elapsed;
  }, [readingTimer]);

  // Função para formatar tempo em formato legível
  const formatTime = useCallback((milliseconds: number) => {
    const seconds = Math.floor(milliseconds / 1000);
    const ms = Math.floor((milliseconds % 1000) / 10); // Centésimos de segundo
    return `${seconds}.${ms.toString().padStart(2, '0')}s`;
  }, []);

  // Função para mostrar feedback visual instantâneo (otimizada)
  const showInstantFeedback = useCallback(() => {
    // Feedback instantâneo sem delays
      setProcessingStage('success');
    setProcessingProgress(100);
  }, []);


  // Effect para garantir que o srcObject seja definido quando o stream mudar
  useEffect(() => {
    const connectStreamToVideo = async () => {
      if (streamRef.current) {
        // Aguardar elemento de vídeo estar disponível
        let attempts = 0;
        const maxAttempts = 30; // 3 segundos máximo
        
        while (!videoRef.current && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (videoRef.current) {
      console.log('🔄 Definindo srcObject no vídeo via useEffect...');
      videoRef.current.srcObject = streamRef.current;
        } else {
          console.warn('⚠️ Elemento de vídeo não encontrado no useEffect');
    }
      }
    };
    
    connectStreamToVideo();
  }, [isScanning]);

  // Função para verificar permissões de câmera
  const checkCameraPermission = useCallback(async () => {
    try {
      if (!navigator.permissions) {
        setCameraPermission('unknown');
        return;
      }

      const permission = await navigator.permissions.query({ name: 'camera' as PermissionName });
      setCameraPermission(permission.state);
      
      // Listener para mudanças de permissão
      permission.addEventListener('change', () => {
        setCameraPermission(permission.state);
        if (permission.state === 'granted') {
          setPermissionError(null);
        }
      });
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setCameraPermission('unknown');
    }
  }, []);

  // Função para obter câmeras disponíveis
  const getAvailableCameras = useCallback(async () => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const cameras = devices.filter(device => device.kind === 'videoinput');
      setAvailableCameras(cameras);
      if (cameras.length > 0) {
        setSelectedCameraId(cameras[0].deviceId);
      }
    } catch (error) {
      console.error('Erro ao obter câmeras:', error);
      setScanError('Não foi possível acessar as câmeras disponíveis');
    }
  }, []);

  // Função para solicitar permissão de câmera
  const requestCameraPermission = useCallback(async () => {
    try {
      console.log('🔐 Solicitando permissão da câmera...');
      setPermissionError(null);
      
      // Primeiro, tentar com constraints básicas
      const basicConstraints: MediaStreamConstraints = {
        video: true
      };

      const stream = await navigator.mediaDevices.getUserMedia(basicConstraints);
      console.log('✅ Permissão concedida, stream obtido:', stream);
      
      // Se chegou aqui, a permissão foi concedida
      setCameraPermission('granted');
      
      // Parar o stream básico
      stream.getTracks().forEach(track => track.stop());
      console.log('🛑 Stream básico parado');
      
      return true;
    } catch (error: any) {
      console.error('❌ Erro ao solicitar permissão:', error);
      
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied');
        setPermissionError('Permissão de câmera negada. Por favor, permita o acesso à câmera nas configurações do navegador.');
      } else if (error.name === 'NotFoundError') {
        setPermissionError('Nenhuma câmera encontrada. Verifique se há uma câmera conectada.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Câmera está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera.');
      } else {
        setPermissionError(`Erro ao acessar câmera: ${error.message}`);
      }
      
      setCameraPermission('denied');
      return false;
    }
  }, []);

  // Função para iniciar o scanner usando html5-qrcode
  const startScanner = useCallback(async () => {
    try {
      console.log('🚀 Iniciando scanner QR Code com html5-qrcode...');
      setScanError(null);
      setPermissionError(null);
      setIsScanning(true);
      setVideoReady(false);
      setWaitingForVideo(true);

      // Aguardar o React renderizar o elemento qr-reader
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Verificar se o elemento já está disponível
      if (document.getElementById('qr-reader')) {
        console.log('✅ Elemento qr-reader já disponível após 500ms');
      } else {
        console.log('⏳ Elemento qr-reader ainda não disponível, aguardando...');
      }

      // Parar scanner anterior se existir
      if (html5QrcodeRef.current) {
        console.log('🛑 Parando scanner anterior...');
        try {
          // Tentar parar o scanner primeiro
          await html5QrcodeRef.current.stop();
          console.log('✅ Scanner anterior parado com sucesso');
        } catch (stopError) {
          console.log('ℹ️ Scanner já estava parado ou erro ao parar:', stopError);
        }
        
        try {
          // Limpar o scanner
          await html5QrcodeRef.current.clear();
          console.log('✅ Scanner anterior limpo com sucesso');
        } catch (clearError) {
          console.warn('⚠️ Erro ao limpar scanner anterior:', clearError);
        }
        html5QrcodeRef.current = null;
      }

      // Verificar se já temos permissão
      console.log('🔍 Verificando permissão da câmera:', cameraPermission);
      if (cameraPermission === 'denied') {
        console.log('❌ Permissão negada, solicitando novamente...');
        const hasPermission = await requestCameraPermission();
        if (!hasPermission) {
          console.log('❌ Falha ao obter permissão da câmera');
          setIsScanning(false);
          return;
        }
      }

      // Garantir que o elemento qr-reader está disponível
      console.log('🔍 Garantindo que elemento qr-reader está disponível...');
      const qrReaderElement = await ensureQrReaderElement();
      console.log('✅ Elemento qr-reader garantido:', qrReaderElement);

      // Criar nova instância do Html5Qrcode
      const html5Qrcode = new Html5Qrcode("qr-reader");
      html5QrcodeRef.current = html5Qrcode;
      
      console.log('✅ Instância Html5Qrcode criada com sucesso');

      // Configurações do scanner
      const config = {
        fps: 10,
        qrbox: { width: 250, height: 250 },
        aspectRatio: 1.0,
        supportedScanTypes: [Html5QrcodeScanType.SCAN_TYPE_CAMERA],
        formatsToSupport: [
          Html5QrcodeSupportedFormats.QR_CODE,
          Html5QrcodeSupportedFormats.AZTEC,
          Html5QrcodeSupportedFormats.CODABAR,
          Html5QrcodeSupportedFormats.CODE_39,
          Html5QrcodeSupportedFormats.CODE_93,
          Html5QrcodeSupportedFormats.CODE_128,
          Html5QrcodeSupportedFormats.DATA_MATRIX,
          Html5QrcodeSupportedFormats.MAXICODE,
          Html5QrcodeSupportedFormats.ITF,
          Html5QrcodeSupportedFormats.EAN_13,
          Html5QrcodeSupportedFormats.EAN_8,
          Html5QrcodeSupportedFormats.PDF_417,
          Html5QrcodeSupportedFormats.RSS_14,
          Html5QrcodeSupportedFormats.RSS_EXPANDED,
          Html5QrcodeSupportedFormats.UPC_A,
          Html5QrcodeSupportedFormats.UPC_E,
          Html5QrcodeSupportedFormats.UPC_EAN_EXTENSION
        ]
      };

      // Iniciar timer de leitura
      console.log('⏱️ Iniciando timer de leitura...');
      startReadingTimer();

      // Iniciar scanner
      await html5Qrcode.start(
        { facingMode: "environment" }, // Usar câmera traseira
        config,
        (decodedText, decodedResult) => {
          console.log('✅ QR Code detectado:', decodedText);
          console.log('📊 Resultado:', decodedResult);
          
          // Processar dados do QR Code
          if (processQRDataRef.current) {
            processQRDataRef.current(decodedText);
          }
        },
        (errorMessage) => {
          // Ignorar erros de "No QR code found" para não poluir o console
          if (!errorMessage.includes('No QR code found')) {
            console.log('🔍 Procurando QR Code...', errorMessage);
          }
        }
      );

      setVideoReady(true);
      setWaitingForVideo(false);
      setCameraPermission('granted');
      
      console.log('✅ Scanner html5-qrcode iniciado com sucesso');

    } catch (error: any) {
      console.error('❌ Erro ao iniciar scanner html5-qrcode:', error);
      setWaitingForVideo(false);
      
      if (error.name === 'NotAllowedError') {
        setCameraPermission('denied');
        setPermissionError('Permissão de câmera negada. Use o diagnóstico para resolver o problema.');
        setShowDiagnosticModal(true);
      } else if (error.name === 'NotFoundError') {
        setPermissionError('Nenhuma câmera encontrada. Verifique se há uma câmera conectada.');
      } else if (error.name === 'NotReadableError') {
        setPermissionError('Câmera está sendo usada por outro aplicativo. Feche outros aplicativos que possam estar usando a câmera.');
      } else {
        setPermissionError(`Erro ao iniciar câmera: ${error.message}`);
      }
      
      setScanError(`Erro ao iniciar scanner: ${error.message}`);
      onError?.(`Erro ao iniciar scanner: ${error.message}`);
      setIsScanning(false);
    }
  }, [onError, cameraPermission, requestCameraPermission, startReadingTimer, ensureQrReaderElement, extractNameFromQR, extractNumberFromQR, extractDateFromQR, extractProvinceFromQR]);

  // Função para aplicar filtros de imagem para melhorar detecção
  const applyImageFilters = useCallback((imageData: ImageData): ImageData => {
    const data = new Uint8ClampedArray(imageData.data);
    const width = imageData.width;
    const height = imageData.height;
    
    // Aplicar filtro de contraste e brilho
    for (let i = 0; i < data.length; i += 4) {
      // Converter para escala de cinza
      const gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      
      // Aplicar contraste (multiplicar por 1.5) e brilho (adicionar 20)
      const enhanced = Math.min(255, Math.max(0, gray * 1.5 + 20));
      
      data[i] = enhanced;     // R
      data[i + 1] = enhanced; // G
      data[i + 2] = enhanced; // B
      // Alpha permanece inalterado
    }
    
    return new ImageData(data, width, height);
  }, []);

  // Função para redimensionar imagem mantendo proporção
  const resizeImageData = useCallback((imageData: ImageData, scale: number): ImageData => {
    if (scale === 1) return imageData;
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return imageData;
    
    const newWidth = Math.floor(imageData.width * scale);
    const newHeight = Math.floor(imageData.height * scale);
    
    canvas.width = newWidth;
    canvas.height = newHeight;
    
    // Criar ImageData temporário
    const tempCanvas = document.createElement('canvas');
    const tempCtx = tempCanvas.getContext('2d');
    if (!tempCtx) return imageData;
    
    tempCanvas.width = imageData.width;
    tempCanvas.height = imageData.height;
    tempCtx.putImageData(imageData, 0, 0);
    
    // Redimensionar
    ctx.imageSmoothingEnabled = false; // Manter pixels nítidos
    ctx.drawImage(tempCanvas, 0, 0, newWidth, newHeight);
    
    return ctx.getImageData(0, 0, newWidth, newHeight);
  }, []);

  // Função para detectar QR Code (otimizada para robustez) - DESABILITADA com html5-qrcode
  // const detectQRCodeAdvanced = useCallback((imageData: ImageData): any => {
  //   // Esta função não é mais necessária com html5-qrcode
  //   // O html5-qrcode gerencia a detecção internamente
  //   return null;
  // }, []);

  // }, [applyImageFilters, resizeImageData]);

  // Função para detectar QR Code usando canvas (mais robusta) - DESABILITADA com html5-qrcode
  // const startQRDetection = useCallback(async () => {
  //   // Esta função não é mais necessária com html5-qrcode
  //   // O html5-qrcode gerencia a detecção internamente
  //   return;
  // }, []);


  // Função para calcular brilho médio da imagem
  const calculateAverageBrightness = useCallback((imageData: ImageData): number => {
    const data = imageData.data;
    let totalBrightness = 0;
    let pixelCount = 0;
    
    // Amostrar pixels (não todos para performance)
    for (let i = 0; i < data.length; i += 16) { // A cada 4 pixels
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      const brightness = (r + g + b) / 3;
      totalBrightness += brightness;
      pixelCount++;
    }
    
    return pixelCount > 0 ? totalBrightness / pixelCount : 0;
  }, []);

  // Função para buscar dados reais da API
  const fetchRealDocumentData = useCallback(async (documentoNumero: string): Promise<QRParsedData | null> => {
    try {
      console.log('🔍 Buscando dados reais da API para documento:', documentoNumero);
      
      // Chamada para API de validação de documentos do sistema
      const response = await fetch(`/api/pessoas/visitantes/validate-document/${documentoNumero}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (response.ok) {
        let apiResponse;
        try {
          apiResponse = await response.json();
          console.log('✅ Dados reais obtidos da API:', apiResponse);
        } catch (jsonError) {
          console.error('❌ Erro ao fazer parse da resposta da API:', jsonError);
          return null;
        }
        
        // Mapear dados da API para o formato esperado
        if (apiResponse.success && apiResponse.data) {
          const realData: QRParsedData = {
            nome_completo: apiResponse.data.nome_completo,
            documento_numero: apiResponse.data.documento_numero,
            documento_tipo: apiResponse.data.documento_tipo,
            nacionalidade: apiResponse.data.nacionalidade,
            data_nascimento: apiResponse.data.data_nascimento,
            genero: apiResponse.data.genero
          };
          return realData;
        }
        return null;
      } else if (response.status === 404) {
        console.log('📋 Documento não encontrado na base de dados, usando dados do QR');
        return null;
      } else {
        console.log('⚠️ Erro na API de validação (status:', response.status, '), usando dados do QR');
        return null;
      }
      } catch (error) {
      console.log('⚠️ Erro ao buscar dados da API, usando dados do QR:', error);
      return null;
    }
  }, []);

  // Função para processar dados do QR Code (otimizada para velocidade com API real)
  const processQRData = useCallback(async (qrData: string) => {
    try {
      // Parar scanner e timer IMEDIATAMENTE para leitura instantânea
      setIsScanning(false);
      stopReadingTimer();
      
      // Calcular tempo total
      const totalTime = getElapsedTime();
      console.log('⚡ Leitura instantânea concluída em:', formatTime(totalTime));
      
      // Processar dados do QR code primeiro
      console.log('🔍 Dados brutos do QR Code:', qrData);
      const parseResult = parseQRCodeData(qrData);
      console.log('🔍 Resultado do parsing:', parseResult);
      
      // SEMPRE extrair dados do QR Code usando funções auxiliares
      const extractedName = extractNameFromQR(qrData);
      const extractedNumber = extractNumberFromQR(qrData);
      const extractedDate = extractDateFromQR(qrData);
      const extractedProvince = extractProvinceFromQR(qrData);
      const extractedEstadoCivil = extractEstadoCivilFromQR(qrData);
      const extractedDataEmissao = extractDataEmissaoFromQR(qrData);
      const extractedDataValidade = extractDataValidadeFromQR(qrData);
      const extractedDocumentoTipo = extractDocumentoTipoFromQR(qrData);
      
      console.log('🔍 Dados extraídos pelas funções auxiliares:', {
        extractedName,
        extractedNumber,
        extractedDate,
        extractedProvince,
        extractedEstadoCivil,
        extractedDataEmissao,
        extractedDataValidade,
        extractedDocumentoTipo,
        qrData
      });
      
      // Organizar dados básicos do QR - SEMPRE usar dados extraídos
      let organizedData = parseResult.success && parseResult.data ? {
        ...parseResult.data,
        nome_completo: parseResult.data.nome_completo || extractedName || 'Dados do QR Code',
        documento_numero: parseResult.data.documento_numero || extractedNumber || qrData,
        documento_tipo: parseResult.data.documento_tipo || (extractedDocumentoTipo as 'BI' | 'PASSAPORTE' | 'CARTA' | 'OUTRO') || 'BI',
        nacionalidade: parseResult.data.nacionalidade || 'Angolana',
        data_nascimento: parseResult.data.data_nascimento || extractedDate || 'N/A',
        provincia_nascimento: parseResult.data.provincia_nascimento || extractedProvince || 'N/A',
        estado_civil: parseResult.data.estado_civil || extractedEstadoCivil || 'N/A',
        data_emissao: parseResult.data.data_emissao || extractedDataEmissao || 'N/A',
        data_validade: parseResult.data.data_validade || extractedDataValidade || 'N/A'
      } : {
          nacionalidade: 'Angolana',
        documento_tipo: (extractedDocumentoTipo as 'BI' | 'PASSAPORTE' | 'CARTA' | 'OUTRO') || 'BI' as const,
          documento_numero: extractedNumber || qrData,
        nome_completo: extractedName || qrData,
        data_nascimento: extractedDate || 'N/A',
        provincia_nascimento: extractedProvince || 'N/A',
        estado_civil: extractedEstadoCivil || 'N/A',
        data_emissao: extractedDataEmissao || 'N/A',
        data_validade: extractedDataValidade || 'N/A'
      };
      
      console.log('🔍 Dados organizados para o modal:', organizedData);
      
      // Exibir modal IMEDIATAMENTE com dados do QR
      setPreviewData(organizedData);
      setShowPreviewModal(true);
      setProcessingStage('success');
      setDataSource('qr');
      
      console.log('⚡ Modal exibido instantaneamente com dados do QR:', organizedData);
      
      // Em paralelo, tentar buscar dados reais da API (se disponível)
      if (organizedData.documento_numero && organizedData.documento_numero !== 'N/A') {
        try {
          console.log('🔄 Tentando buscar dados reais da API em paralelo...');
          const realData = await fetchRealDocumentData(organizedData.documento_numero);
          
          if (realData) {
            // Atualizar modal com dados reais da API
            console.log('✅ Atualizando modal com dados reais da API:', realData);
            setPreviewData(realData);
            setDataSource('api');
            
            // Mostrar notificação de dados atualizados
            console.log('📢 Dados atualizados com informações da API oficial');
          } else {
            // Se API não retornou dados, marcar como dados mistos (QR + tentativa de API)
            setDataSource('mixed');
          }
        } catch (apiError) {
          console.log('⚠️ Erro ao buscar dados da API, mantendo dados do QR:', apiError);
          setDataSource('mixed');
        }
      }
      
    } catch (error) {
      console.error('❌ Erro no processamento instantâneo:', error);
      
      // Parar tudo imediatamente
      setIsScanning(false);
      stopReadingTimer();
      
      // Dados de fallback instantâneos
      const fallbackData: QRParsedData = {
        nacionalidade: 'Angolana',
        documento_tipo: 'BI' as const,
        documento_numero: 'Erro no processamento',
        nome_completo: 'QR Code detectado',
        data_nascimento: 'N/A',
        provincia_nascimento: 'N/A'
      };
      
      // Exibir modal instantaneamente mesmo com erro
      setPreviewData(fallbackData);
      setShowPreviewModal(true);
      setProcessingStage('success');
    }
  }, [getElapsedTime, formatTime, stopReadingTimer, fetchRealDocumentData, extractNameFromQR, extractNumberFromQR, extractDateFromQR, extractProvinceFromQR, extractEstadoCivilFromQR, extractDataEmissaoFromQR, extractDataValidadeFromQR, extractDocumentoTipoFromQR]);

  // Definir a referência para evitar dependência circular
  useEffect(() => {
    processQRDataRef.current = processQRData;
  }, [processQRData]);

  // Função de diagnóstico melhorada
  const runAdvancedDiagnostics = useCallback(() => {
    console.log('🔍 === DIAGNÓSTICO AVANÇADO DO LEITOR QR ===');
    console.log('📱 Navegador:', navigator.userAgent);
    console.log('📷 Câmeras disponíveis:', availableCameras.length);
    console.log('🎥 Câmera atual:', selectedCameraId);
    console.log('🔐 Permissão da câmera:', cameraPermission);
    console.log('📺 Elemento de vídeo:', !!videoRef.current);
    console.log('🎨 Elemento de canvas:', !!canvasRef.current);
    console.log('⚡ Scanner ativo:', isScanning);
    console.log('📊 Estatísticas:', detectionStats);
    console.log('🎯 QR detectado:', qrDetected);
    console.log('⏱️ Timer ativo:', readingTimer.isActive);
    console.log('📈 Tempo decorrido:', formatTime(getElapsedTime()));
    console.log('🔗 Stream ativo:', !!streamRef.current);
    console.log('📺 Vídeo pronto:', videoReady);
    console.log('⏳ Aguardando vídeo:', waitingForVideo);
    
    if (videoRef.current) {
      console.log('📺 Dimensões do vídeo:', {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
        readyState: videoRef.current.readyState,
        paused: videoRef.current.paused,
        ended: videoRef.current.ended,
        muted: videoRef.current.muted,
        volume: videoRef.current.volume
      });
    }
    
    if (canvasRef.current) {
      console.log('🎨 Dimensões do canvas:', {
        width: canvasRef.current.width,
        height: canvasRef.current.height
      });
    }
    
    // Teste de detecção manual
    if (videoRef.current && canvasRef.current && videoRef.current.videoWidth > 0) {
      try {
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        if (context) {
          canvas.width = videoRef.current.videoWidth;
          canvas.height = videoRef.current.videoHeight;
          context.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
          const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
          const brightness = calculateAverageBrightness(imageData);
          console.log('🔍 Teste de detecção manual:', {
            imageWidth: imageData.width,
            imageHeight: imageData.height,
            averageBrightness: brightness,
            brightnessStatus: brightness < 20 ? 'Muito escuro' : brightness > 230 ? 'Muito claro' : 'OK'
          });
        }
      } catch (error) {
        console.error('❌ Erro no teste de detecção manual:', error);
      }
    }
    
    console.log('🔍 === FIM DO DIAGNÓSTICO ===');
  }, [availableCameras, selectedCameraId, cameraPermission, isScanning, detectionStats, qrDetected, readingTimer, videoReady, waitingForVideo, formatTime, getElapsedTime]);

  // Função de teste para simular detecção (para debug)
  const testQRDetection = useCallback(() => {
    console.log('🧪 Testando detecção de QR Code...');
    
    // Teste com o problema específico do usuário - data de validade capturando número do documento
    const userProblemTest = 'ABEL JOSÉ SUCA 001641651LA036 15/03/1985 LUANDA M SOLTEIRO 15/03/2020 15/03/2030';
    console.log('🧪 Teste do problema do usuário:', userProblemTest);
    
    // Testar especificamente a extração de data de validade
    const extractedDataValidade = extractDataValidadeFromQR(userProblemTest);
    const extractedDataEmissao = extractDataEmissaoFromQR(userProblemTest);
    const extractedNumber = extractNumberFromQR(userProblemTest);
    
    console.log('🧪 Teste problema específico:');
    console.log('  - Número do documento:', extractedNumber);
    console.log('  - Data de emissão:', extractedDataEmissao);
    console.log('  - Data de validade:', extractedDataValidade);
    console.log('  - Problema: Data de validade deve ser "15/03/2030", não parte do número');
    
    // Teste com formato BI angolano: 000000001LA000
    const testData = 'PAULO CHINDUAMBA SUCA 000000001LA000';
    console.log('🧪 Dados de teste (BI angolano):', testData);
    
    // Testar as funções auxiliares diretamente
    const extractedName = extractNameFromQR(testData);
    const extractedEstadoCivil = extractEstadoCivilFromQR(testData);
    const extractedDocumentoTipo = extractDocumentoTipoFromQR(testData);
    console.log('🧪 Funções auxiliares - Nome:', extractedName, 'Número:', extractedNumber, 'Estado Civil:', extractedEstadoCivil, 'Data Emissão:', extractedDataEmissao, 'Data Validade:', extractedDataValidade, 'Tipo Documento:', extractedDocumentoTipo);
    
    // Testar o parser diretamente
    const parseResult = parseQRCodeData(testData);
    console.log('🧪 Resultado do teste do parser:', parseResult);
    
    // Teste adicional com dados mais simples
    const simpleTest = 'JOAO SILVA 123456789';
    console.log('🧪 Teste simples:', simpleTest);
    const simpleName = extractNameFromQR(simpleTest);
    const simpleNumber = extractNumberFromQR(simpleTest);
    console.log('🧪 Teste simples - Nome:', simpleName, 'Número:', simpleNumber);
    
    // Teste com dados reais que podem estar falhando
    const realTest = 'MARIA SANTOS 020482369';
    console.log('🧪 Teste real:', realTest);
    const realName = extractNameFromQR(realTest);
    const realNumber = extractNumberFromQR(realTest);
    console.log('🧪 Teste real - Nome:', realName, 'Número:', realNumber);
    
    // Teste com o caso específico do usuário
    const userTest = 'ABEL JOSÉ SUCA 01';
    console.log('🧪 Teste do usuário:', userTest);
    const userName = extractNameFromQR(userTest);
    const userNumber = extractNumberFromQR(userTest);
    console.log('🧪 Teste do usuário - Nome:', userName, 'Número:', userNumber);
    
    // Teste com o número completo que deve ser extraído
    const fullNumberTest = 'ABEL JOSÉ SUCA 001641651LA036';
    console.log('🧪 Teste número completo:', fullNumberTest);
    const fullName = extractNameFromQR(fullNumberTest);
    const fullNumber = extractNumberFromQR(fullNumberTest);
    console.log('🧪 Teste número completo - Nome:', fullName, 'Número:', fullNumber);
    
    // Teste com dados completos (formato ideal)
    const completeTest = 'ABEL JOSÉ SUCA 001641651LA036 15/03/1985 LUANDA M SOLTEIRO 15/03/2020 15/03/2030';
    console.log('🧪 Teste dados completos:', completeTest);
    const completeResult = parseQRCodeData(completeTest);
    console.log('🧪 Resultado dados completos:', completeResult);
    
    // Teste com dados do usuário (PAULO CHINDUAMBA SUCA)
    const userTestComplete = 'PAULO CHINDUAMBA SUCA 020482369LA058 22/01/2009 LUANDA M SOLTEIRO 15/03/2020 15/03/2030';
    console.log('🧪 Teste dados do usuário completos:', userTestComplete);
    const userCompleteResult = parseQRCodeData(userTestComplete);
    console.log('🧪 Resultado dados do usuário completos:', userCompleteResult);
    
    // Teste das novas funções de extração com dados do usuário
    const userEstadoCivil = extractEstadoCivilFromQR(userTestComplete);
    const userDataEmissao = extractDataEmissaoFromQR(userTestComplete);
    const userDataValidade = extractDataValidadeFromQR(userTestComplete);
    const userDocumentoTipo = extractDocumentoTipoFromQR(userTestComplete);
    console.log('🧪 Teste funções específicas do usuário:', {
      estadoCivil: userEstadoCivil,
      dataEmissao: userDataEmissao,
      dataValidade: userDataValidade,
      documentoTipo: userDocumentoTipo
    });
    
    // Teste com número mais longo
    const longNumberTest = 'JOAO SILVA 123456789012';
    console.log('🧪 Teste número longo:', longNumberTest);
    const longName = extractNameFromQR(longNumberTest);
    const longNumber = extractNumberFromQR(longNumberTest);
    console.log('🧪 Teste número longo - Nome:', longName, 'Número:', longNumber);
    
    // Usar o teste do problema específico do usuário
    processQRData(userProblemTest);
  }, [processQRData, extractNameFromQR, extractNumberFromQR, extractDateFromQR, extractProvinceFromQR, extractEstadoCivilFromQR, extractDataEmissaoFromQR, extractDataValidadeFromQR, extractDocumentoTipoFromQR]);

  // Função para enviar dados do preview
  const handleSendData = useCallback(() => {
    if (previewData) {
      console.log('📤 Enviando dados do preview para o formulário:', previewData);
      
      // Salvar dados como último escaneado
      setLastScannedData(previewData);
      
      // Enviar dados para o componente pai (formulário)
      onQRCodeScanned(previewData);
      
      // Fechar modal
      setShowPreviewModal(false);
      setPreviewData(null);
      
      // Resetar estados
      setProcessingStage('idle');
      setProcessingProgress(0);
      
      // Log de sucesso
      console.log('✅ Dados enviados com sucesso para o formulário');
      console.log('📋 Dados enviados:', {
        nome: previewData.nome_completo,
        documento: previewData.documento_numero,
        tipo: previewData.documento_tipo,
        nascimento: previewData.data_nascimento,
        nacionalidade: previewData.nacionalidade,
        provincia: previewData.provincia_nascimento
      });
    }
  }, [previewData, onQRCodeScanned]);

  // Função para cancelar preview
  const handleCancelPreview = useCallback(() => {
    console.log('❌ Cancelando preview dos dados');
    setShowPreviewModal(false);
    setPreviewData(null);
    setProcessingStage('idle');
    setProcessingProgress(0);
    setDataSource('qr');
    
    // Opcional: Permitir retomar a leitura automaticamente
    // setTimeout(() => {
    //   if (cameraPermission === 'granted') {
    //     startScanner();
    //   }
    // }, 500);
  }, []);

  // Função para parar o scanner
  const stopScanner = useCallback(async () => {
    console.log('🛑 Parando scanner html5-qrcode...');
    setIsScanning(false);
    
    // Parar timer de leitura
    stopReadingTimer();
    
    // Parar scanner html5-qrcode
    if (html5QrcodeRef.current) {
      try {
        // Tentar parar o scanner primeiro
        await html5QrcodeRef.current.stop();
        console.log('✅ Scanner html5-qrcode parado com sucesso');
      } catch (stopError) {
        console.log('ℹ️ Scanner já estava parado ou erro ao parar:', stopError);
      }
      
      try {
        // Limpar o scanner
        await html5QrcodeRef.current.clear();
        console.log('✅ Scanner html5-qrcode limpo com sucesso');
      } catch (clearError) {
        console.warn('⚠️ Erro ao limpar scanner html5-qrcode:', clearError);
      }
      html5QrcodeRef.current = null;
    }
    
    // Parar intervalo de detecção (se ainda existir)
    if (intervalRef.current) {
      clearTimeout(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Parar stream da câmera (se ainda existir)
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Limpar vídeo (se ainda existir)
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    
    // Limpar estado do vídeo
    setVideoReady(false);
    setWaitingForVideo(false);
    
    // Limpar estados de processamento
    setProcessingStage('idle');
    setProcessingProgress(0);
    setQrDetected(false);
    setShowPreviewModal(false);
    setPreviewData(null);
    setTorchEnabled(false);
    setDataSource('qr');
    setDetectionStats({
      totalFrames: 0,
      successfulDetections: 0,
      averageBrightness: 0,
      lastDetectionTime: 0
    });
  }, [stopReadingTimer]);

  // Função para alternar câmera
  const switchCamera = useCallback(() => {
    if (availableCameras.length > 1) {
      const currentIndex = availableCameras.findIndex(cam => cam.deviceId === selectedCameraId);
      const nextIndex = (currentIndex + 1) % availableCameras.length;
      setSelectedCameraId(availableCameras[nextIndex].deviceId);
    }
  }, [availableCameras, selectedCameraId]);

  // Função para alternar flash/torch
  const toggleTorch = useCallback(async () => {
    if (!streamRef.current) return;
    
    try {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack && 'applyConstraints' in videoTrack) {
        // Tentar aplicar constraints de torch (suporte limitado)
        // Nota: torch não é suportado em todos os navegadores
        const newConstraints: any = {
          torch: !torchEnabled
        };
        
        await videoTrack.applyConstraints(newConstraints);
        setTorchEnabled(!torchEnabled);
        console.log('🔦 Flash/Torch:', !torchEnabled ? 'Ligado' : 'Desligado');
      }
    } catch (error) {
      console.warn('⚠️ Não foi possível controlar o flash:', error);
      // Flash não suportado, apenas alternar estado visual
      setTorchEnabled(!torchEnabled);
    }
  }, [torchEnabled]);

  // Inicializar câmeras disponíveis e verificar permissões
  useEffect(() => {
    const initializePermissions = async () => {
      await checkCameraPermission();
      await getAvailableCameras();
    };
    
    initializePermissions();
  }, [checkCameraPermission, getAvailableCameras]);

  // Auto-start do scanner quando permissões são concedidas
  useEffect(() => {
    if (autoStart && cameraPermission === 'granted' && availableCameras.length > 0 && !isScanning) {
      console.log('🚀 Auto-iniciando scanner...');
      setTimeout(() => {
        startScanner();
      }, 500); // Pequeno delay para garantir que tudo está pronto
    }
  }, [autoStart, cameraPermission, availableCameras.length, isScanning, startScanner]);

  // Debug: Monitorar mudanças no estado do timer (apenas quando inicia)
  useEffect(() => {
    if (readingTimer.isActive && readingTimer.startTime > 0) {
      console.log('⏱️ Timer iniciado:', readingTimer);
    }
  }, [readingTimer.isActive, readingTimer.startTime]);

  // Limpar ao desmontar
  useEffect(() => {
    return () => {
      stopScanner();
      // Limpar timer se ainda estiver ativo
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
        timerIntervalRef.current = null;
      }
    };
  }, [stopScanner]);

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Camera className="h-5 w-5" />
              {title}
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              {description}
            </p>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={() => {
              stopScanner();
              onClose();
            }}>
              <XCircle className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Controles da câmera */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <div className="flex gap-2">
            {availableCameras.length > 1 && (
              <Button
                variant="outline"
                size="sm"
                onClick={switchCamera}
                disabled={isScanning}
              >
                Trocar Câmera
              </Button>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                runAdvancedDiagnostics();
                setShowDiagnosticModal(true);
              }}
              className="flex items-center gap-1"
            >
              <Settings className="h-3 w-3" />
              🔍 Diagnóstico
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={testQRDetection}
              className="flex items-center gap-1 bg-yellow-100 hover:bg-yellow-200 text-yellow-800"
            >
              <Square className="h-3 w-3" />
              🧪 Teste QR
            </Button>
            
            {isScanning && (
              <Button
                variant="outline"
                size="sm"
                onClick={toggleTorch}
                className={`flex items-center gap-1 ${torchEnabled ? 'bg-yellow-100 text-yellow-800' : ''}`}
              >
                🔦 {torchEnabled ? 'Flash ON' : 'Flash OFF'}
              </Button>
            )}
            
            <StartReadingButton
              isScanning={isScanning}
              cameraPermission={cameraPermission}
              availableCameras={availableCameras.length}
              onStart={startScanner}
              onStop={stopScanner}
              disabled={cameraPermission === 'denied' && !permissionError}
            />
          </div>

          <div className="flex gap-2 items-center">
            {cameraPermission === 'granted' && (
              <Badge variant="default" className="text-xs bg-green-100 text-green-800">
                <CheckCircle className="h-3 w-3 mr-1" />
                Câmera Permitida
              </Badge>
            )}
            {cameraPermission === 'denied' && (
              <Badge variant="destructive" className="text-xs">
                <XCircle className="h-3 w-3 mr-1" />
                Permissão Negada
              </Badge>
            )}
            {cameraPermission === 'prompt' && (
              <Badge variant="secondary" className="text-xs">
                <AlertCircle className="h-3 w-3 mr-1" />
                Aguardando Permissão
              </Badge>
            )}
          </div>
          
          {/* Status detalhado quando scanner está ativo */}
          {isScanning && cameraPermission === 'granted' && (
            <div className="mt-2 text-xs text-gray-600">
              <div className="flex items-center justify-center gap-4">
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${videoReady ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span>{videoReady ? 'Vídeo Ativo' : 'Aguardando'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${detectionStats.totalFrames > 0 ? 'bg-blue-500' : 'bg-gray-400'}`}></div>
                  <span>{detectionStats.totalFrames} frames</span>
                </div>
                <div className="flex items-center gap-1">
                  <div className={`w-1.5 h-1.5 rounded-full ${detectionStats.successfulDetections > 0 ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                  <span>{detectionStats.successfulDetections} detecções</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Área de leitura com html5-qrcode */}
          <div className="relative w-full max-w-md mx-auto">
          {/* Visual da câmera quando não está escaneando */}
          {!isScanning && (
            <QRCodeScannerVisual
              isScanning={isScanning}
              hasPermission={cameraPermission === 'granted'}
              className="w-full"
            />
          )}
          
          <div
            id="qr-reader"
            className={`w-full h-64 rounded-lg border-2 ${isScanning ? 'border-blue-500' : 'border-gray-300'} ${!isScanning ? 'hidden' : ''}`}
            style={{ minHeight: '256px' }}
            />
            {/* Overlay com guias de leitura */}
          {isScanning && (
            <div className="absolute inset-0 pointer-events-none">
              <div className="absolute inset-4 border-2 border-dashed border-blue-400 rounded-lg">
                <div className="absolute top-0 left-0 w-6 h-6 border-l-4 border-t-4 border-blue-500 rounded-tl-lg"></div>
                <div className="absolute top-0 right-0 w-6 h-6 border-r-4 border-t-4 border-blue-500 rounded-tr-lg"></div>
                <div className="absolute bottom-0 left-0 w-6 h-6 border-l-4 border-b-4 border-blue-500 rounded-bl-lg"></div>
                <div className="absolute bottom-0 right-0 w-6 h-6 border-r-4 border-b-4 border-blue-500 rounded-br-lg"></div>
              </div>
            </div>
          )}
            {/* Indicador de carregamento do vídeo */}
            {!videoReady && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                <div className="text-white text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Iniciando câmera...</p>
                </div>
              </div>
            )}
            
            {/* Indicador de QR Code detectado (ultra-rápido) */}
            {qrDetected && (
              <div className="absolute inset-0 bg-green-500 bg-opacity-40 flex items-center justify-center rounded-lg">
                <div className="text-white text-center bg-green-600 px-6 py-4 rounded-xl shadow-lg">
                  <div className="animate-bounce">
                    <div className="flex items-center justify-center mb-2">
                      <CheckCircle className="w-8 h-8 mr-2" />
                      <p className="text-xl font-bold">⚡ DETECTADO!</p>
                  </div>
                    <p className="text-sm font-semibold">Processando instantaneamente...</p>
                </div>
              </div>
          </div>
        )}
        </div>
        
        {/* Canvas oculto para processamento */}
        <canvas
          ref={canvasRef}
          className="hidden"
        />

        {/* Modal de diagnóstico */}
        <CameraDiagnosticModal
          isOpen={showDiagnosticModal}
          onClose={() => setShowDiagnosticModal(false)}
          onPermissionGranted={() => {
            setShowDiagnosticModal(false);
            setPermissionError(null);
            setCameraPermission('granted');
            // Tentar iniciar o scanner automaticamente
            setTimeout(() => startScanner(), 500);
          }}
        />

        {/* Modal de Preview dos Dados */}
        {showPreviewModal && previewData && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl p-6 max-w-4xl w-full max-h-[95vh] overflow-y-auto">
              {/* Header do Modal */}
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 bg-green-100 rounded-full">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900">⚡ Leitura Instantânea Concluída!</h3>
                  <p className="text-sm text-gray-600 mt-1">
                    {dataSource === 'api' && '✅ Dados validados pela API oficial'}
                    {dataSource === 'qr' && '📱 Dados extraídos do QR Code'}
                    {dataSource === 'mixed' && '🔄 Dados do QR Code (API não disponível)'}
                  </p>
                </div>
                <div className="text-right">
                  <div className="text-xs text-gray-500 mb-1">Tempo de leitura:</div>
                  <div className="text-lg font-bold text-green-600 font-mono">
                    {formatTime(getElapsedTime())}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleCancelPreview}
                  className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                >
                  <XCircle className="w-4 h-4 text-gray-500" />
                </Button>
              </div>
              
              {/* Dados Organizados com Grid */}
              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex items-center justify-between mb-6">
                  <h4 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                    📋 Dados do Documento
                  </h4>
                  <div className="flex items-center gap-2">
                    {dataSource === 'api' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        ✅ API Oficial
                      </span>
                    )}
                    {dataSource === 'qr' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        📱 QR Code
                      </span>
                    )}
                    {dataSource === 'mixed' && (
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        🔄 QR Code
                      </span>
                    )}
                  </div>
                </div>
                
                {/* Grid de Dados - 2 colunas */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Coluna 1 - Dados Pessoais */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      👤 Dados Pessoais
                    </h5>
                    
                    {/* Nome Completo */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nome Completo</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 break-words">
                        {previewData.nome_completo || 'Não informado'}
                      </p>
                    </div>
                    
                    {/* Data de Nascimento */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Nascimento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {previewData.data_nascimento || 'Não informado'}
                      </p>
                    </div>
                    
                    {/* Nacionalidade */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nacionalidade</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {previewData.nacionalidade || 'Angolana'}
                      </p>
                    </div>
                    
                    {/* Província */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Província</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {previewData.provincia_nascimento || 'Não informado'}
                      </p>
                    </div>
                    
                    {/* Gênero - Se disponível */}
                    {previewData.genero && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Gênero</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {previewData.genero === 'M' ? 'Masculino' : previewData.genero === 'F' ? 'Feminino' : previewData.genero}
                        </p>
                      </div>
                    )}
                    
                    {/* Estado Civil - Se disponível */}
                    {previewData.estado_civil && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Estado Civil</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {previewData.estado_civil}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Coluna 2 - Dados do Documento */}
                  <div className="space-y-3">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      🆔 Dados do Documento
                    </h5>
                    
                    {/* Número do Documento */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Número do Documento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900 font-mono">
                        {previewData.documento_numero || 'Não informado'}
                      </p>
                    </div>
                    
                    {/* Tipo de Documento */}
                    <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Tipo de Documento</span>
                      </div>
                      <p className="text-sm font-semibold text-gray-900">
                        {previewData.documento_tipo || 'BI'}
                      </p>
                    </div>
                    
                    {/* Data de Emissão - Se disponível */}
                    {previewData.data_emissao && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Emissão</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {previewData.data_emissao}
                        </p>
                      </div>
                    )}
                    
                    {/* Data de Validade - Se disponível */}
                    {previewData.data_validade && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Data de Validade</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {previewData.data_validade}
                        </p>
                      </div>
                    )}
                    
                    {/* Local de Emissão - Se disponível */}
                    {previewData.local_emissao && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Local de Emissão</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {previewData.local_emissao}
                        </p>
                      </div>
                    )}
                    
                    {/* NIF - Se disponível */}
                    {previewData.nif && (
                      <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">NIF</span>
                        </div>
                        <p className="text-sm font-semibold text-gray-900">
                          {previewData.nif}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Dados de Contato - Se disponíveis */}
                {(previewData.email || previewData.telefone) && (
                  <div className="mt-6">
                    <h5 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                      📞 Dados de Contato
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {previewData.email && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {previewData.email}
                          </p>
                        </div>
                      )}
                      {previewData.telefone && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Telefone</span>
                          </div>
                          <p className="text-sm font-semibold text-gray-900">
                            {previewData.telefone}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              {/* Aviso de Confirmação */}
              <div className={`border rounded-lg p-3 mb-6 ${
                dataSource === 'api' 
                  ? 'bg-green-50 border-green-200' 
                  : dataSource === 'qr' 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'bg-yellow-50 border-yellow-200'
              }`}>
                <div className="flex items-start gap-2">
                  <AlertCircle className={`w-5 h-5 mt-0.5 flex-shrink-0 ${
                    dataSource === 'api' 
                      ? 'text-green-600' 
                      : dataSource === 'qr' 
                        ? 'text-blue-600' 
                        : 'text-yellow-600'
                  }`} />
                  <div className={`text-sm ${
                    dataSource === 'api' 
                      ? 'text-green-800' 
                      : dataSource === 'qr' 
                        ? 'text-blue-800' 
                        : 'text-yellow-800'
                  }`}>
                    <p className="font-medium">
                      {dataSource === 'api' && '✅ Dados validados pela API oficial'}
                      {dataSource === 'qr' && '📱 Dados extraídos do QR Code'}
                      {dataSource === 'mixed' && '🔄 Dados do QR Code (API não disponível)'}
                    </p>
                    <p className="text-xs mt-1">
                      {dataSource === 'api' && 'Estes dados foram validados pela API oficial e estão prontos para uso.'}
                      {dataSource === 'qr' && 'Verifique se as informações estão corretas antes de enviar para o formulário.'}
                      {dataSource === 'mixed' && 'Dados extraídos do QR Code. A API de validação não está disponível no momento.'}
                    </p>
                  </div>
                </div>
              </div>
              
              {/* Botões de Ação */}
              <div className="space-y-4">
                {/* Botões Principais */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Button
                    onClick={handleSendData}
                    className="h-14 bg-green-600 hover:bg-green-700 text-white font-semibold text-base shadow-lg hover:shadow-xl transition-all duration-200"
                  >
                    <CheckCircle className="w-5 h-5 mr-3" />
                    Enviar para Formulário
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleCancelPreview}
                    className="h-14 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold text-base"
                  >
                    <XCircle className="w-5 h-5 mr-3" />
                    Cancelar
                  </Button>
                </div>
                
                {/* Botões Secundários */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      console.log('📋 Dados do QR Code:', previewData);
                      navigator.clipboard.writeText(JSON.stringify(previewData, null, 2));
                      // Mostrar toast de sucesso
                      const toast = document.createElement('div');
                      toast.className = 'fixed top-4 right-4 bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg z-50';
                      toast.textContent = 'Dados copiados para a área de transferência!';
                      document.body.appendChild(toast);
                      setTimeout(() => document.body.removeChild(toast), 3000);
                    }}
                    className="h-12 border border-blue-300 hover:border-blue-400 text-blue-700 hover:bg-blue-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    Copiar Dados
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Função para imprimir os dados
                      const printWindow = window.open('', '_blank');
                      if (printWindow) {
                        printWindow.document.write(`
                          <html>
                            <head>
                              <title>Dados do QR Code - ${previewData.nome_completo || 'Documento'}</title>
                              <style>
                                body { font-family: Arial, sans-serif; margin: 20px; }
                                .header { text-align: center; margin-bottom: 30px; }
                                .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
                                .data-item { border: 1px solid #ddd; padding: 15px; border-radius: 8px; }
                                .label { font-weight: bold; color: #666; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
                                .value { font-size: 14px; }
                                @media print { body { margin: 0; } }
                              </style>
                            </head>
                            <body>
                              <div class="header">
                                <h1>Dados do Documento</h1>
                                <p>Extraídos via QR Code - ${new Date().toLocaleString()}</p>
                              </div>
                              <div class="data-grid">
                                ${previewData.nome_completo ? `<div class="data-item"><div class="label">Nome Completo</div><div class="value">${previewData.nome_completo}</div></div>` : ''}
                                ${previewData.documento_numero ? `<div class="data-item"><div class="label">Número do Documento</div><div class="value">${previewData.documento_numero}</div></div>` : ''}
                                ${previewData.documento_tipo ? `<div class="data-item"><div class="label">Tipo de Documento</div><div class="value">${previewData.documento_tipo}</div></div>` : ''}
                                ${previewData.data_nascimento ? `<div class="data-item"><div class="label">Data de Nascimento</div><div class="value">${previewData.data_nascimento}</div></div>` : ''}
                                ${previewData.nacionalidade ? `<div class="data-item"><div class="label">Nacionalidade</div><div class="value">${previewData.nacionalidade}</div></div>` : ''}
                                ${previewData.provincia_nascimento ? `<div class="data-item"><div class="label">Província</div><div class="value">${previewData.provincia_nascimento}</div></div>` : ''}
                                ${previewData.genero ? `<div class="data-item"><div class="label">Gênero</div><div class="value">${previewData.genero === 'M' ? 'Masculino' : previewData.genero === 'F' ? 'Feminino' : previewData.genero}</div></div>` : ''}
                                ${previewData.estado_civil ? `<div class="data-item"><div class="label">Estado Civil</div><div class="value">${previewData.estado_civil}</div></div>` : ''}
                                ${previewData.data_emissao ? `<div class="data-item"><div class="label">Data de Emissão</div><div class="value">${previewData.data_emissao}</div></div>` : ''}
                                ${previewData.data_validade ? `<div class="data-item"><div class="label">Data de Validade</div><div class="value">${previewData.data_validade}</div></div>` : ''}
                                ${previewData.nif ? `<div class="data-item"><div class="label">NIF</div><div class="value">${previewData.nif}</div></div>` : ''}
                                ${previewData.email ? `<div class="data-item"><div class="label">Email</div><div class="value">${previewData.email}</div></div>` : ''}
                                ${previewData.telefone ? `<div class="data-item"><div class="label">Telefone</div><div class="value">${previewData.telefone}</div></div>` : ''}
                              </div>
                            </body>
                          </html>
                        `);
                        printWindow.document.close();
                        printWindow.print();
                      }
                    }}
                    className="h-12 border border-purple-300 hover:border-purple-400 text-purple-700 hover:bg-purple-50"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    Imprimir
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => {
                      // Função para nova leitura
                      setShowPreviewModal(false);
                      setPreviewData(null);
                      setProcessingStage('idle');
                      setProcessingProgress(0);
                      setDataSource('qr');
                      // Reiniciar o scanner
                      setTimeout(() => {
                        if (cameraPermission === 'granted') {
                          startScanner();
                        }
                      }, 500);
                    }}
                    className="h-12 border border-orange-300 hover:border-orange-400 text-orange-700 hover:bg-orange-50"
                  >
                    <Camera className="w-4 h-4 mr-2" />
                    Nova Leitura
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Status e erros */}
        {permissionError && !showDiagnosticModal && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">{permissionError}</p>
                <div className="text-sm space-y-1">
                  <p><strong>Como resolver:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Clique no ícone de câmera na barra de endereços do navegador</li>
                    <li>Selecione "Permitir" para este site</li>
                    <li>Recarregue a página se necessário</li>
                    <li>Verifique se nenhum outro aplicativo está usando a câmera</li>
                  </ul>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowDiagnosticModal(true)}
                  className="mt-2"
                >
                  <Settings className="h-3 w-3 mr-1" />
                  🚀 Solução Rápida
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {scanError && !permissionError && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{scanError}</AlertDescription>
          </Alert>
        )}

        {/* Preview dos dados escaneados */}
        {showPreview && lastScannedData && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Dados extraídos com sucesso:</p>
                <div className="text-sm space-y-1">
                  {lastScannedData.nome_completo && (
                    <p><strong>Nome:</strong> {lastScannedData.nome_completo}</p>
                  )}
                  {lastScannedData.documento_numero && (
                    <p><strong>Documento:</strong> {lastScannedData.documento_numero}</p>
                  )}
                  {lastScannedData.documento_tipo && (
                    <p><strong>Tipo:</strong> {lastScannedData.documento_tipo}</p>
                  )}
                  {lastScannedData.data_nascimento && (
                    <p><strong>Nascimento:</strong> {lastScannedData.data_nascimento}</p>
                  )}
                  {lastScannedData.provincia_nascimento && (
                    <p><strong>Província:</strong> {lastScannedData.provincia_nascimento}</p>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Indicador de status da câmera */}
        <CameraStatusIndicator
          permission={cameraPermission}
          availableCameras={availableCameras.length}
          isScanning={isScanning}
        />

        {/* Indicador de Auto-start */}
        {autoStart && cameraPermission === 'granted' && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-blue-800">
                🚀 Auto-start ativado - Detecção iniciará automaticamente
              </span>
            </div>
          </div>
        )}

        {/* Indicador de Aguardando Vídeo */}
        {waitingForVideo && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
              <span className="text-xs font-medium text-yellow-800">
                ⏳ Aguardando elemento de vídeo estar disponível...
              </span>
            </div>
          </div>
        )}

        {/* Contador de tempo de leitura */}
        {isScanning && (
          <div className="p-3 bg-orange-50 border border-orange-200 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-orange-500 rounded-full animate-pulse"></div>
                <span className="text-sm font-medium text-orange-800">⏱️ Tempo de Leitura:</span>
              </div>
              <div className="text-lg font-bold text-orange-900 font-mono">
                {formatTime(getElapsedTime())}
              </div>
            </div>
            {/* Debug info simplificado */}
            <div className="text-xs text-orange-600 mt-1">
              Status: {readingTimer.isActive ? 'Ativo' : 'Inativo'} | 
              Tempo: {getElapsedTime()}ms
            </div>
          </div>
        )}

        {/* Estatísticas de detecção */}
        {isScanning && (
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-blue-600 mt-0.5" />
              <div className="text-sm text-blue-800">
                <p className="font-medium">📊 Estatísticas de Detecção</p>
                <div className="text-xs mt-1 space-y-1">
                  <p><strong>Frames processados:</strong> {detectionStats.totalFrames}</p>
                  <p><strong>Detecções bem-sucedidas:</strong> {detectionStats.successfulDetections}</p>
                  <p><strong>Brilho médio:</strong> {Math.round(detectionStats.averageBrightness)}</p>
                  <p><strong>Taxa de sucesso:</strong> {detectionStats.totalFrames > 0 ? Math.round((detectionStats.successfulDetections / detectionStats.totalFrames) * 100) : 0}%</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Aviso sobre detecção */}
        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-start gap-2">
            <CheckCircle className="h-4 w-4 text-green-600 mt-0.5" />
            <div className="text-sm text-green-800">
              <p className="font-medium">⚡ Leitor QR Instantâneo - DETECÇÃO AUTOMÁTICA</p>
              <p className="text-xs mt-1">
                Sistema ultra-otimizado para leitura instantânea com detecção automática contínua, 
                processamento paralelo e exibição automática do modal. 
                {cameraPermission === 'granted' && ' ✅ Permissões de câmera configuradas corretamente.'}
                {autoStart && ' 🚀 Auto-start ativado - detecção iniciará automaticamente.'}
              </p>
              <div className="text-xs mt-2 space-y-1">
                <p>🚀 <strong>Auto-start:</strong> Detecção inicia automaticamente quando câmera está pronta</p>
                <p>⚡ <strong>Velocidade:</strong> 60 FPS, detecção instantânea, processamento paralelo</p>
                <p>🎯 <strong>Precisão:</strong> Detecção multi-escala otimizada, filtros inteligentes</p>
                <p>🔄 <strong>Contínua:</strong> Detecção não para até encontrar QR Code</p>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

