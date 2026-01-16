'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { finalizeVisita, getVisitaCrachas } from '@/services/visitaService';
import { toast } from 'sonner';
import { CheckCircle, Clock, AlertTriangle } from 'lucide-react';

interface FinalizeVisitaButtonProps {
  visitaId: string;
  visitaNumero: string;
  estado: string;
  onSuccess?: () => void;
  trigger?: React.ReactNode;
}

export default function FinalizeVisitaButton({ 
  visitaId, 
  visitaNumero, 
  estado, 
  onSuccess,
  trigger 
}: FinalizeVisitaButtonProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [devolverCracha, setDevolverCracha] = useState(false);
  const [crachas, setCrachas] = useState<any[]>([]);
  const [loadingCrachas, setLoadingCrachas] = useState(false);

  // Carregar crachás quando o modal abrir
  useEffect(() => {
    if (open) {
      setLoadingCrachas(true);
      getVisitaCrachas(visitaId)
        .then(crachasData => {
          setCrachas(crachasData);
          console.log('Crachás encontrados:', crachasData);
        })
        .catch(error => {
          console.error('Erro ao carregar crachás:', error);
          setCrachas([]);
        })
        .finally(() => {
          setLoadingCrachas(false);
        });
    }
  }, [open, visitaId]);

  // Só mostrar o botão se a visita estiver em curso
  if (estado !== 'em_curso') {
    return null;
  }

  const handleFinalize = async () => {
    // Validação adicional no frontend
    if (crachas.length > 0 && !devolverCracha) {
      toast.error('É obrigatório confirmar a devolução dos crachás antes de finalizar a visita.');
      return;
    }

    setLoading(true);
    try {
      const hasCrachas = crachas.length > 0;
      const options = hasCrachas ? { devolver_cracha: devolverCracha } : {};
      console.log('Finalizando visita:', visitaId, 'com opções:', options);
      console.log('Crachás detectados:', crachas.length);
      console.log('Devolução confirmada:', devolverCracha);
      
      await finalizeVisita(visitaId, options);
      
      toast.success(`Visita ${visitaNumero} finalizada com sucesso!`);
      setOpen(false);
      onSuccess?.();
    } catch (error: any) {
      console.error('Erro ao finalizar visita:', error);
      console.error('Detalhes do erro:', error.response?.data);
      
      if (error.response?.status === 400) {
        const errorData = error.response.data;
        if (errorData.detail?.includes('crachás associados')) {
          toast.error('É necessário devolver os crachás antes de finalizar a visita.');
          return;
        }
        if (errorData.detail?.includes('não está em curso')) {
          toast.error('Esta visita não está em curso e não pode ser finalizada.');
          return;
        }
        toast.error(errorData.detail || 'Erro ao finalizar visita.');
      } else if (error.response?.status === 403) {
        toast.error('Acesso negado: você não tem permissão para finalizar esta visita.');
      } else if (error.response?.status === 404) {
        toast.error('Visita não encontrada.');
      } else {
        toast.error('Erro ao finalizar visita. Tente novamente.');
      }
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button 
      size="sm" 
      variant="outline" 
      className="text-green-600 border-green-200 hover:bg-green-50"
    >
      <CheckCircle className="h-4 w-4 mr-1" />
      Finalizar
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            Finalizar Visita
          </DialogTitle>
          <DialogDescription>
            Você está prestes a finalizar a visita <strong>{visitaNumero}</strong>.
            Esta ação registrará a hora de saída e marcará a visita como concluída.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {loadingCrachas ? (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600"></div>
                <p className="text-sm text-gray-600">Verificando crachás associados...</p>
              </div>
            </div>
          ) : crachas.length > 0 ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="space-y-3">
                  <p className="text-sm font-medium text-yellow-800">
                    ⚠️ Crachás Associados ({crachas.length})
                  </p>
                  <div className="text-sm text-yellow-700">
                    <p className="mb-2">Esta visita possui os seguintes crachás associados:</p>
                    <div className="bg-yellow-100 rounded-md p-2 mb-3">
                      <ul className="space-y-1">
                        {crachas.map((cracha, index) => (
                          <li key={index} className="font-mono text-yellow-800 bg-white px-2 py-1 rounded border">
                            Crachá #{cracha.numero}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <p className="font-semibold text-yellow-800">
                      ⚠️ É OBRIGATÓRIO devolver todos os crachás antes de finalizar a visita!
                    </p>
                  </div>
                  <div className="flex items-center space-x-2 bg-white p-3 rounded border border-yellow-300">
                    <Checkbox 
                      id="devolver-cracha" 
                      checked={devolverCracha}
                      onCheckedChange={(checked) => setDevolverCracha(!!checked)}
                      className="border-yellow-500"
                    />
                    <Label 
                      htmlFor="devolver-cracha" 
                      className="text-sm font-medium text-yellow-800 cursor-pointer"
                    >
                      ✅ Confirmo que TODOS os crachás foram devolvidos
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-green-800">
                    ✅ Nenhum Crachá Associado
                  </p>
                  <p className="text-sm text-green-700 mt-1">
                    Esta visita não possui crachás associados. Pode ser finalizada normalmente.
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start gap-3">
              <Clock className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-blue-800">
                  Informação Importante
                </p>
                <p className="text-sm text-blue-700 mt-1">
                  A hora de saída será registrada automaticamente como o momento atual.
                </p>
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button 
            variant="outline" 
            onClick={() => setOpen(false)}
            disabled={loading}
          >
            Cancelar
          </Button>
          <Button 
            onClick={handleFinalize}
            disabled={loading || (crachas.length > 0 && !devolverCracha)}
            className={`${
              crachas.length > 0 && !devolverCracha 
                ? 'bg-gray-400 hover:bg-gray-400 cursor-not-allowed' 
                : 'bg-green-600 hover:bg-green-700'
            }`}
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Finalizando...
              </>
            ) : crachas.length > 0 && !devolverCracha ? (
              <>
                <AlertTriangle className="h-4 w-4 mr-2" />
                Devolver Crachás Primeiro
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4 mr-2" />
                Finalizar Visita
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
