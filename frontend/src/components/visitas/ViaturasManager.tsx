
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Viatura } from '@/types/visita';
import { useDynamicList } from '@/hooks/useDynamicList';
import { Car, Trash2 } from 'lucide-react';
import { useEffect } from 'react';

interface ViaturasManagerProps {
  initialData?: Viatura[];
  onViaturasChange: (viaturas: Viatura[]) => void;
}

const newViatura = {
  tipo: '',
  marca: '',
  cor: '',
  matricula: '',
};

export default function ViaturasManager({ initialData = [], onViaturasChange }: ViaturasManagerProps) {
  const { items: viaturas, addItem, removeItem, updateItem } = useDynamicList<Viatura>(initialData);

  useEffect(() => {
    onViaturasChange(viaturas);
  }, [viaturas, onViaturasChange]);

  return (
    <Card>
      <CardHeader className="bg-gradient-to-r from-green-50 to-emerald-50">
        <CardTitle className="flex items-center gap-2 text-emerald-900">
          <Car className="w-5 h-5" />
          Viaturas
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-gray-600">
            {viaturas.length} viatura(s) adicionada(s)
          </p>
          <Button type="button" variant="outline" size="sm" onClick={() => addItem(newViatura)}>
            <Car className="w-4 h-4 mr-2" />
            Adicionar Viatura
          </Button>
        </div>

        {viaturas.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Car className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>Nenhuma viatura adicionada</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {viaturas.map((viatura, idx) => (
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
                      <Label htmlFor={`tipo-${idx}`}>Tipo de Viatura</Label>
                      <Input
                        id={`tipo-${idx}`}
                        placeholder="Ex: Carro, Mota, Camião"
                        value={viatura.tipo}
                        onChange={e => updateItem(idx, 'tipo', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`marca-${idx}`}>Marca</Label>
                      <Input
                        id={`marca-${idx}`}
                        placeholder="Ex: Toyota, BMW, Honda"
                        value={viatura.marca}
                        onChange={e => updateItem(idx, 'marca', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`cor-${idx}`}>Cor</Label>
                      <Input
                        id={`cor-${idx}`}
                        placeholder="Ex: Azul, Branco, Preto"
                        value={viatura.cor}
                        onChange={e => updateItem(idx, 'cor', e.target.value)}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor={`matricula-${idx}`}>Matrícula *</Label>
                      <Input
                        id={`matricula-${idx}`}
                        placeholder="Ex: LU-12-34-AB"
                        value={viatura.matricula}
                        onChange={e => updateItem(idx, 'matricula', e.target.value.toUpperCase())}
                        required
                        className="uppercase"
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
