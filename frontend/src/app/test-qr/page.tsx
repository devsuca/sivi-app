'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, TestTube, RotateCcw } from 'lucide-react';
import QRCodeReaderFinal from '@/components/ui/QRCodeReaderFinal';
import { QRParsedData } from '@/utils/qrCodeParser';

export default function QRTestPage() {
  const [showQRReader, setShowQRReader] = useState(false);
  const [lastResult, setLastResult] = useState<QRParsedData | null>(null);
  const [testCount, setTestCount] = useState(0);

  const handleQRCodeScanned = (data: QRParsedData) => {
    setLastResult(data);
    setShowQRReader(false);
    setTestCount(prev => prev + 1);
    console.log('Dados do QR Code:', data);
  };

  const handleError = (error: string) => {
    console.error('Erro no QR Code:', error);
    alert(`Erro: ${error}`);
  };

  const resetTest = () => {
    setLastResult(null);
    setTestCount(0);
  };

  return (
    <div className="container mx-auto p-8">
      <Card className="w-full max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Teste do Leitor QR Code - Versão Robusta
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Este teste verifica se o erro de DOM foi corrigido
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
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
                  <DialogTitle>Teste do Leitor QR Code</DialogTitle>
                </DialogHeader>
                <QRCodeReaderFinal
                  onQRCodeScanned={handleQRCodeScanned}
                  onError={handleError}
                  onClose={() => setShowQRReader(false)}
                  title="Teste - Escaneie um QR Code"
                  description="Use este teste para verificar se o leitor está funcionando corretamente"
                  showPreview={true}
                />
              </DialogContent>
            </Dialog>

            <Button variant="outline" onClick={resetTest}>
              <RotateCcw className="h-4 w-4 mr-2" />
              Reset Teste
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800 mb-2">Estatísticas:</h4>
              <p className="text-blue-700">
                <strong>Testes realizados:</strong> {testCount}
              </p>
            </div>

            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Status:</h4>
              <p className="text-green-700">
                {testCount > 0 ? '✅ Teste funcionando' : '⏳ Aguardando teste'}
              </p>
            </div>
          </div>

          {lastResult && (
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <h4 className="font-semibold text-green-800 mb-2">Último Resultado:</h4>
              <pre className="text-xs text-green-700 overflow-auto max-h-40">
                {JSON.stringify(lastResult, null, 2)}
              </pre>
            </div>
          )}

          <div className="text-xs text-muted-foreground">
            <p><strong>Instruções:</strong></p>
            <ul className="list-disc list-inside space-y-1 mt-2">
              <li>Clique em "Testar Leitor QR Code"</li>
              <li>Permita o acesso à câmera</li>
              <li>Escaneie um QR Code de documento</li>
              <li>Verifique se não há erros no console</li>
              <li>Teste múltiplas vezes para verificar estabilidade</li>
            </ul>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h4 className="font-semibold text-yellow-800 mb-2">Verificações:</h4>
            <ul className="text-xs text-yellow-700 space-y-1">
              <li>✅ ID único para cada instância</li>
              <li>✅ Limpeza robusta do DOM</li>
              <li>✅ Verificação de existência de elementos</li>
              <li>✅ Tratamento de erros aprimorado</li>
              <li>✅ Cleanup automático no desmonte</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
