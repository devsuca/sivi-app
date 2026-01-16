'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { QrCode, TestTube } from 'lucide-react';
import { parseQRCodeData, QRParsedData, validateQRData } from '@/utils/qrCodeParser';

export default function QRTestComponent() {
  const [testData, setTestData] = useState('');
  const [parseResult, setParseResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<any>(null);

  const testQRData = [
    "BI123456789|JOÃO SILVA SANTOS|15/03/1990|LUANDA|M|ANGOLANA",
    "PASSAPORTE987654321|MARIA FERNANDES|22/07/1985|BENGUELA|F|ANGOLANA",
    "BI111222333|CARLOS MENDES|10/12/1992|HUAMBO|M|ANGOLANA"
  ];

  const testParsing = (data: string) => {
    console.log('🧪 Testando parsing com dados:', data);
    const result = parseQRCodeData(data);
    console.log('🧪 Resultado do parsing:', result);
    setParseResult(result);
    
    if (result.success && result.data) {
      const validation = validateQRData(result.data);
      console.log('🧪 Resultado da validação:', validation);
      setValidationResult(validation);
    } else {
      setValidationResult(null);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TestTube className="h-5 w-5" />
          Teste de Parser QR Code
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Input manual */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dados QR Code para teste:</label>
          <textarea
            value={testData}
            onChange={(e) => setTestData(e.target.value)}
            placeholder="Cole aqui os dados do QR Code..."
            className="w-full p-2 border rounded-md h-20"
          />
          <Button 
            onClick={() => testParsing(testData)}
            disabled={!testData.trim()}
            className="w-full"
          >
            <QrCode className="h-4 w-4 mr-2" />
            Testar Parsing
          </Button>
        </div>

        {/* Dados de teste pré-definidos */}
        <div className="space-y-2">
          <label className="text-sm font-medium">Dados de teste:</label>
          <div className="space-y-2">
            {testQRData.map((data, index) => (
              <Button
                key={index}
                onClick={() => testParsing(data)}
                variant="outline"
                className="w-full text-left justify-start"
              >
                <QrCode className="h-4 w-4 mr-2" />
                Teste {index + 1}: {data.substring(0, 30)}...
              </Button>
            ))}
          </div>
        </div>

        {/* Resultado do parsing */}
        {parseResult && (
          <div className="space-y-2">
            <h4 className="font-semibold">Resultado do Parsing:</h4>
            <Alert variant={parseResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Sucesso:</strong> {parseResult.success ? 'Sim' : 'Não'}</p>
                  {parseResult.error && <p><strong>Erro:</strong> {parseResult.error}</p>}
                  {parseResult.data && (
                    <div>
                      <p><strong>Dados extraídos:</strong></p>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(parseResult.data, null, 2)}
                      </pre>
                    </div>
                  )}
                  {parseResult.rawData && (
                    <p><strong>Dados brutos:</strong> {parseResult.rawData}</p>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Resultado da validação */}
        {validationResult && (
          <div className="space-y-2">
            <h4 className="font-semibold">Resultado da Validação:</h4>
            <Alert variant={validationResult.isValid ? "default" : "destructive"}>
              <AlertDescription>
                <div className="space-y-2">
                  <p><strong>Válido:</strong> {validationResult.isValid ? 'Sim' : 'Não'}</p>
                  {validationResult.errors && validationResult.errors.length > 0 && (
                    <div>
                      <p><strong>Erros:</strong></p>
                      <ul className="list-disc list-inside">
                        {validationResult.errors.map((error: string, index: number) => (
                          <li key={index}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Instruções */}
        <div className="text-sm text-muted-foreground">
          <p><strong>Instruções:</strong></p>
          <ul className="list-disc list-inside space-y-1 mt-2">
            <li>Use os dados de teste ou cole dados reais de QR Code</li>
            <li>Verifique se o parsing está funcionando corretamente</li>
            <li>Verifique se a validação está funcionando</li>
            <li>Verifique os logs no console (F12)</li>
          </ul>
        </div>
      </CardContent>
    </Card>
  );
}












