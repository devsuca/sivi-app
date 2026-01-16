'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, Package } from 'lucide-react';
import { Pertence } from '@/types/pertence';

interface PertencesManagerProps {
  initialData: Pertence[];
  onPertencesChange: (pertences: Pertence[]) => void;
}

const tiposAgrupados: Array<{ titulo: string; itens: Array<{ value: string; label: string }> }> = [
  {
    titulo: 'Segurança',
    itens: [
      { value: 'arma_de_fogo', label: 'Arma de Fogo' },
      { value: 'municao', label: 'Munição' },
      { value: 'faca_objeto_cortante', label: 'Faca / Objeto Cortante' },
    ],
  },
  {
    titulo: 'Eletrónicos',
    itens: [
      { value: 'telemovel', label: 'Telemóvel' },
      { value: 'portatil', label: 'Computador Portátil' },
      { value: 'tablet', label: 'Tablet' },
      { value: 'camera', label: 'Câmara' },
      { value: 'equipamento', label: 'Outro Equipamento' },
    ],
  },
  {
    titulo: 'Documentos',
    itens: [
      { value: 'documento_identificacao', label: 'Documento de Identificação' },
      { value: 'pasta_documentos', label: 'Pasta de Documentos' },
      { value: 'documento', label: 'Outro Documento' },
    ],
  },
  {
    titulo: 'Pessoais',
    itens: [
      { value: 'chaves', label: 'Chaves' },
      { value: 'carteira', label: 'Carteira' },
      { value: 'mochila_mala', label: 'Mochila / Mala' },
      { value: 'acessorios', label: 'Acessórios' },
    ],
  },
  {
    titulo: 'Outros',
    itens: [
      { value: 'veiculo', label: 'Veículo' },
      { value: 'outro', label: 'Outro' },
    ],
  },
];

export default function PertencesManager({ initialData, onPertencesChange }: PertencesManagerProps) {
  const [pertences, setPertences] = useState<Pertence[]>(initialData || []);

  const addPertence = () => {
    const newPertence: Pertence = {
      id: `temp-${Date.now()}`, // ID temporário único
      descricao: '',
      tipo: '',
      quantidade: 1,
      estado: 'em_posse',
      entregue_por: '',
      data_entrega: new Date().toISOString()
    };
    const updatedPertences = [...pertences, newPertence];
    setPertences(updatedPertences);
    onPertencesChange(updatedPertences);
  };

  const removePertence = (index: number) => {
    const updatedPertences = pertences.filter((_, i) => i !== index);
    setPertences(updatedPertences);
    onPertencesChange(updatedPertences);
  };

  const updatePertence = (index: number, field: keyof Pertence, value: any) => {
    const updatedPertences = pertences.map((pertence, i) => 
      i === index ? { ...pertence, [field]: value } : pertence
    );
    setPertences(updatedPertences);
    onPertencesChange(updatedPertences);
  };

  return (
    <Card className="border border-gray-200 shadow-sm">
      <CardHeader className="bg-gradient-to-r from-purple-50 to-pink-50 border-b">
        <CardTitle className="flex items-center gap-3 text-gray-900">
          <Package className="w-6 h-6 text-purple-600" />
          <div>
            <h2 className="text-xl font-bold">Pertences</h2>
            <p className="text-sm font-normal text-gray-600 mt-1">
              Gerencie os pertences que serão entregues durante a visita
            </p>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6 space-y-4">
        {pertences.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Nenhum pertence adicionado</p>
            <p className="text-sm">Clique em "Adicionar Pertence" para começar</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pertences.map((pertence, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="outline" className="bg-purple-100 text-purple-800">
                    Pertence {index + 1}
                  </Badge>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => removePertence(index)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {/* Descrição */}
                  <div className="md:col-span-2 lg:col-span-2 space-y-2">
                    <Label htmlFor={`descricao-${index}`} className="text-sm font-medium">
                      Descrição *
                    </Label>
                    <Input
                      id={`descricao-${index}`}
                      placeholder="Ex: Laptop, Documentos, Equipamento..."
                      value={pertence.descricao}
                      onChange={(e) => updatePertence(index, 'descricao', e.target.value)}
                      required
                    />
                  </div>

                  {/* Tipo */}
                  <div className="space-y-2">
                    <Label htmlFor={`tipo-${index}`} className="text-sm font-medium">
                      Tipo
                    </Label>
                    <Select 
                      value={pertence.tipo || ''} 
                      onValueChange={(value) => updatePertence(index, 'tipo', value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o tipo" />
                      </SelectTrigger>
                      <SelectContent>
                        {tiposAgrupados.map((grupo) => (
                          <div key={grupo.titulo}>
                            <div className="px-2 py-1 text-xs text-gray-500 font-medium">
                              {grupo.titulo}
                            </div>
                            {grupo.itens.map((tipo) => (
                              <SelectItem key={tipo.value} value={tipo.value}>
                                {tipo.label}
                              </SelectItem>
                            ))}
                          </div>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Quantidade */}
                  <div className="space-y-2">
                    <Label htmlFor={`quantidade-${index}`} className="text-sm font-medium">
                      Quantidade *
                    </Label>
                    <Input
                      id={`quantidade-${index}`}
                      type="number"
                      min="1"
                      value={pertence.quantidade}
                      onChange={(e) => updatePertence(index, 'quantidade', parseInt(e.target.value) || 1)}
                      required
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="flex justify-center pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={addPertence}
            className="flex items-center gap-2 border-purple-200 text-purple-700 hover:bg-purple-50"
          >
            <Plus className="w-4 h-4" />
            Adicionar Pertence
          </Button>
        </div>

        {pertences.length > 0 && (
          <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
            <p className="text-sm text-purple-800">
              <strong>Total de pertences:</strong> {pertences.length} item(s)
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
