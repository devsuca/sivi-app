'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { QrCode, TestTube } from 'lucide-react';
import QRCodeReaderFinal from './QRCodeReaderFinal';
import { QRParsedData } from '@/utils/qrCodeParser';

export default function QRCodeTest() {
  const [showQRReader, setShowQRReader] = useState(false);
  const [lastResult, setLastResult] = useState<QRParsedData | null>(null);

  const handleQRCodeScanned = (data: QRParsedData) => {
    setLastResult(data);
    setShowQRReader(false);
    console.log('Dados do QR Code:', data);
  };

  const handleError = (error: string) => {
    console.error('Erro no QR Code:', error);
    alert(`Erro: ${error}`);
  };

  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste do Leitor QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Dialog open={showQRReader} onOpenChange={setShowQRReader}>
          <DialogTrigger asChild>
            <Button className="w-full">
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

        {lastResult && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <h4 className="font-semibold text-green-800 mb-2">Último Resultado:</h4>
            <pre className="text-xs text-green-700 overflow-auto">
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
            <li>Verifique os dados extraídos</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}

