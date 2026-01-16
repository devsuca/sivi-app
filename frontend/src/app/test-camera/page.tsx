'use client';

import React from 'react';
import SimpleQRTest from '@/components/ui/SimpleQRTest';
import QRTestComponent from '@/components/ui/QRTestComponent';

export default function TestCameraPage() {
  return (
    <div className="container mx-auto p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Teste de Câmera - SIVIS</h1>
        
        <div className="grid gap-6">
          <SimpleQRTest />
          <QRTestComponent />
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold text-blue-800 mb-2">Informações do Sistema</h3>
            <div className="text-sm text-blue-700 space-y-1">
              <p><strong>Navegador:</strong> {typeof window !== 'undefined' ? navigator.userAgent : 'SSR'}</p>
              <p><strong>MediaDevices:</strong> {typeof window !== 'undefined' && navigator.mediaDevices ? 'Disponível' : 'Não disponível'}</p>
              <p><strong>getUserMedia:</strong> {typeof window !== 'undefined' && typeof navigator.mediaDevices?.getUserMedia === 'function' ? 'Disponível' : 'Não disponível'}</p>
              <p><strong>HTTPS:</strong> {typeof window !== 'undefined' ? (window.location.protocol === 'https:' ? 'Sim' : 'Não') : 'Desconhecido'}</p>
            </div>
          </div>
          
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h3 className="font-semibold text-yellow-800 mb-2">Troubleshooting</h3>
            <div className="text-sm text-yellow-700 space-y-2">
              <p><strong>Se a câmera não funcionar:</strong></p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Verifique se o navegador tem permissão para acessar a câmera</li>
                <li>Certifique-se de que está usando HTTPS (localhost é uma exceção)</li>
                <li>Verifique se a câmera não está sendo usada por outro aplicativo</li>
                <li>Teste em um navegador diferente</li>
                <li>Verifique os logs no console (F12)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
