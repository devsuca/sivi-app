'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, TestTube, RotateCcw, CheckCircle, XCircle } from 'lucide-react';
import QRCodeReaderFinal from '@/components/ui/QRCodeReaderFinal';
import { QRParsedData } from '@/utils/qrCodeParser';

export default function QRTestV2Page() {
  const [showQRReader, setShowQRReader] = useState(false);
  const [lastResult, setLastResult] = useState<QRParsedData | null>(null);
  const [testCount, setTestCount] = useState(0);
  const [errorCount, setErrorCount] = useState(0);
  const [testHistory, setTestHistory] = useState<Array<{
    id: number;
    timestamp: string;
    success: boolean;
    error?: string;
    data?: QRParsedData;
  }>>([]);

  const handleQRCodeScanned = (data: QRParsedData) => {
    setLastResult(data);
    setShowQRReader(false);
    setTestCount(prev => prev + 1);
    
    // Adicionar ao histórico
    setTestHistory(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      success: true,
      data
    }]);
    
    console.log('✅ QR Code escaneado com sucesso:', data);
  };

  const handleError = (error: string) => {
    setErrorCount(prev => prev + 1);
    setShowQRReader(false);
    
    // Adicionar ao histórico
    setTestHistory(prev => [...prev, {
      id: Date.now(),
      timestamp: new Date().toLocaleTimeString(),
      success: false,
      error
    }]);
    
    console.error('❌ Erro no QR Code:', error);
  };

  const resetTest = () => {
    setLastResult(null);
    setTestCount(0);
    setErrorCount(0);
    setTestHistory([]);
  };

  const runStressTest = () => {
    // Simular múltiplas aberturas e fechamentos
    for (let i = 0; i < 5; i++) {
      setTimeout(() => {
        setShowQRReader(true);
        setTimeout(() => {
          setShowQRReader(false);
        }, 1000);
      }, i * 2000);
    }
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste Avançado do Leitor QR Code V2
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Teste de estabilidade e correção do erro de DOM
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Testes Realizados:</h4>
              <p className="text-blue-700 text-2xl font-bold">{testCount}</p>
            </div>

            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <h4 className="font-semibold text-red-800 mb-2">Erros:</h4>
              <p className="text-red-700 text-2xl font-bold">{errorCount}</p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Taxa de Sucesso:</h4>
              <p className="text-green-700 text-2xl font-bold">
                {testCount + errorCount > 0 ? Math.round((testCount / (testCount + errorCount)) * 100) : 0}%
              </p>
            </div>
          </div>

          <div className="flex gap-4">
            <Dialog open={showQRReader} onOpenChange={setShowQRReader}>
              <DialogTrigger asChild>
                <Button className="flex-1">
                  <QrCode className="h-4 w-4 mr-2" />
                  Testar Leitor QR Code
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Teste do Leitor QR Code V2</DialogTitle>
                </DialogHeader>
                <QRCodeReaderFinal
                  onQRCodeScanned={handleQRCodeScanned}
                  onError={handleError}
                  onClose={() => setShowQRReader(false)}
                  title="Teste Final - Escaneie um QR Code"
                  description="Versão nativa sem erros de DOM"
                  showPreview={true}
                />
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={resetTest}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset
            </Button>

            <Button variant="secondary" onClick={runStressTest}>
              <TestTube className="h-4 w-4 mr-2" />
              Teste de Estresse
            </Button>
          </div>

          {lastResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Último Resultado:
              </h4>
              <pre className="text-xs text-green-700 overflow-auto max-h-40">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}

          {testHistory.length > 0 && (
            <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-800 mb-2">Histórico de Testes:</h4>
              <div className="max-h-40 overflow-auto">
                {testHistory.slice(-10).reverse().map((test) => (
                  <div key={test.id} className="flex items-center gap-2 py-1 text-sm">
                    {test.success ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-600" />
                    )}
                    <span className="text-gray-600">{test.timestamp}</span>
                    <span className={test.success ? 'text-green-600' : 'text-red-600'}>
                      {test.success ? 'Sucesso' : `Erro: ${test.error}`}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
              <h4 className="font-semibold text-yellow-800 mb-2">Melhorias V2:</h4>
              <ul className="text-xs text-yellow-700 space-y-1">
                <li>✅ Destruição completa do scanner</li>
                <li>✅ Limpeza com innerHTML</li>
                <li>✅ Re-render forçado com key</li>
                <li>✅ Container ref para controle direto</li>
                <li>✅ Timeout para garantir limpeza</li>
                <li>✅ Clone e replace do elemento</li>
              </ul>
            </div>

            <div className="p-4 bg-purple-50 border border-purple-200 rounded-lg">
              <h4 className="font-semibold text-purple-800 mb-2">Instruções:</h4>
              <ul className="text-xs text-purple-700 space-y-1">
                <li>1. Clique em "Testar Leitor QR Code"</li>
                <li>2. Permita acesso à câmera</li>
                <li>3. Escaneie um QR Code</li>
                <li>4. Verifique console (F12)</li>
                <li>5. Teste múltiplas vezes</li>
                <li>6. Use "Teste de Estresse"</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
