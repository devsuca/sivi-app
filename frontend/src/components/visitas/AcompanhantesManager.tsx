
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Acompanhante } from '@/types/visita';
import { useDynamicList } from '@/hooks/useDynamicList';
import { Users, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

interface AcompanhantesManagerProps {
  initialData?: Acompanhante[];
  onAcompanhantesChange: (acompanhantes: Acompanhante[]) => void;
}

const newAcompanhante = {
  nome: '',
  documento_tipo: 'BI',
  documento_numero: '',
  nacionalidade: 'Angola',
};

const documentoTypes = [
  { value: 'BI', label: 'Bilhete de Identidade' },
  { value: 'PASSAPORTE', label: 'Passaporte' },
  { value: 'CARTA', label: 'Carta de Condução' },
  { value: 'OUTRO', label: 'Outro' },
];

export default function AcompanhantesManager({ initialData = [], onAcompanhantesChange }: AcompanhantesManagerProps) {
  const { items: acompanhantes, addItem, removeItem, updateItem } = useDynamicList<Acompanhante>(initialData);

  useEffect(() => {
    onAcompanhantesChange(acompanhantes);
  }, [acompanhantes, onAcompanhantesChange]);

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-orange-50 to-amber-50">
        <CardTitle className="flex items-center gap-2 text-amber-900">
          <Users className="w-5 h-5" />
          Acompanhantes
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {acompanhantes.length} acompanhante(s) adicionado(s)
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => addItem(newAcompanhante)}>
            <Users className="w-4 h-4 mr-2" />
            Adicionar Acompanhante
          </Button>
        </div>

        {acompanhantes.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhum acompanhante adicionado</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {acompanhantes.map((acompanhante, idx) => (
              <Card key={idx} className="relative">
                <CardContent className="pt-6">
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-2 right-2"
                    onClick={() => removeItem(idx)}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor={`nome-${idx}`}>Nome Completo</Label>
                      <Input
                        id={`nome-${idx}`}
                        placeholder="Nome completo do acompanhante"
                        value={acompanhante.nome}
                        onChange={e => updateItem(idx, 'nome', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`documento_tipo-${idx}`}>Tipo de Documento</Label>
                      <Select
                        value={acompanhante.documento_tipo}
                        onValueChange={(value) => updateItem(idx, 'documento_tipo', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o tipo de documento" />
                        </SelectTrigger>
                        <SelectContent>
                          {documentoTypes.map((type) => (
                            <SelectItem key={type.value} value={type.value}>
                              {type.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`documento_numero-${idx}`}>Número do Documento</Label>
                      <Input
                        id={`documento_numero-${idx}`}
                        placeholder="Número do documento"
                        value={acompanhante.documento_numero}
                        onChange={e => updateItem(idx, 'documento_numero', e.target.value)}
                        required
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`nacionalidade-${idx}`}>Nacionalidade</Label>
                      <Input
                        id={`nacionalidade-${idx}`}
                        placeholder="Nacionalidade"
                        value={acompanhante.nacionalidade}
                        onChange={e => updateItem(idx, 'nacionalidade', e.target.value)}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
