'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { QRParsedData } from '@/utils/qrCodeParser';
import { User, FileText, Calendar, MapPin, CheckCircle, AlertCircle } from 'lucide-react';

interface QRDataPreviewProps {
  data: QRParsedData;
  onConfirm: () => void;
  onCancel: () => void;
  title?: string;
  className?: string;
}

export default function QRDataPreview({
  data,
  onConfirm,
  onCancel,
  title = "Dados Extraídos do QR Code",
  className = ""
}: QRDataPreviewProps) {
  
  const formatDate = (dateStr?: string) => {
    if (!dateStr) return 'Não informado';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('pt-AO');
    } catch {
      return dateStr;
    }
  };

  const getGenderLabel = (genero?: string) => {
    switch (genero) {
      case 'M': return 'Masculino';
      case 'F': return 'Feminino';
      case 'O': return 'Outro';
      default: return 'Não informado';
    }
  };

  const getDocumentTypeLabel = (tipo?: string) => {
    switch (tipo) {
      case 'BI': return 'Bilhete de Identidade';
      case 'PASSAPORTE': return 'Passaporte';
      case 'CARTA': return 'Carta de Condução';
      case 'OUTRO': return 'Outro';
      default: return 'Não informado';
    }
  };

  return (
    <Card className={`w-full max-w-2xl mx-auto ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CheckCircle className="h-5 w-5 text-green-600" />
          {title}
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Verifique os dados extraídos antes de confirmar
        </p>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Informações Pessoais */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <User className="h-4 w-4" />
            Informações Pessoais
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nome Completo</label>
              <div className="p-2 bg-muted/50 rounded border">
                {data.nome_completo || <span className="text-muted-foreground italic">Não informado</span>}
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Gênero</label>
              <div className="p-2 bg-muted/50 rounded border">
                {getGenderLabel(data.genero)}
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data de Nascimento</label>
              <div className="p-2 bg-muted/50 rounded border">
                {formatDate(data.data_nascimento)}
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Nacionalidade</label>
              <div className="p-2 bg-muted/50 rounded border">
                {data.nacionalidade || <span className="text-muted-foreground italic">Não informado</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Documento */}
        <div className="space-y-3">
          <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Documento de Identidade
          </h4>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Tipo de Documento</label>
              <div className="p-2 bg-muted/50 rounded border">
                <Badge variant="secondary">
                  {getDocumentTypeLabel(data.documento_tipo)}
                </Badge>
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Número do Documento</label>
              <div className="p-2 bg-muted/50 rounded border font-mono">
                {data.documento_numero || <span className="text-muted-foreground italic">Não informado</span>}
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data de Emissão</label>
              <div className="p-2 bg-muted/50 rounded border">
                {formatDate(data.data_emissao)}
              </div>
            </div>
            
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Data de Validade</label>
              <div className="p-2 bg-muted/50 rounded border">
                {formatDate(data.data_validade)}
              </div>
            </div>
          </div>
        </div>

        {/* Localização */}
        {(data.provincia_nascimento || data.local_emissao) && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <MapPin className="h-4 w-4" />
              Localização
            </h4>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {data.provincia_nascimento && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Província de Nascimento</label>
                  <div className="p-2 bg-muted/50 rounded border">
                    {data.provincia_nascimento}
                  </div>
                </div>
              )}
              
              {data.local_emissao && (
                <div className="space-y-1">
                  <label className="text-xs font-medium text-muted-foreground">Local de Emissão</label>
                  <div className="p-2 bg-muted/50 rounded border">
                    {data.local_emissao}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Estado Civil */}
        {data.estado_civil && (
          <div className="space-y-3">
            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Estado Civil
            </h4>
            
            <div className="p-2 bg-muted/50 rounded border">
              {data.estado_civil}
            </div>
          </div>
        )}

        {/* Aviso sobre dados incompletos */}
        {(!data.nome_completo || !data.documento_numero) && (
          <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium">Dados incompletos detectados</p>
                <p className="text-xs mt-1">
                  Alguns campos obrigatórios não foram encontrados no QR Code. 
                  Você pode preenchê-los manualmente após confirmar.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Botões de ação */}
        <div className="flex gap-3 pt-4 border-t">
          <Button onClick={onConfirm} className="flex-1">
            <CheckCircle className="h-4 w-4 mr-2" />
            Confirmar e Usar Dados
          </Button>
          <Button variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}


