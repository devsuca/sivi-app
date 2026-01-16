"use client";
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { assignCrachasToVisita } from '@/services/visitaService';
import { getCrachas } from '@/services/crachaService';
import { Cracha } from '@/types/cracha';

type Props = {
  visitaId: string;
  trigger?: React.ReactNode;
};

export default function AssignCrachaButton({ visitaId, trigger }: Props) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [crachas, setCrachas] = useState<Cracha[]>([]);
  const [selectedCrachaId, setSelectedCrachaId] = useState<string>('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const all = await getCrachas();
        setCrachas(all.results);
      } catch (e: any) {
        setError('Falha ao carregar crachás.');
      }
    })();
  }, [open]);

  const crachasLivres = useMemo(() => crachas.filter(c => c.estado === 'livre'), [crachas]);

  async function handleAssign() {
    setLoading(true);
    setError(null);
    setFeedback(null);
    try {
      if (!selectedCrachaId) {
        setError('Selecione um crachá.');
        setLoading(false);
        return;
      }
      const result = await assignCrachasToVisita(visitaId, [selectedCrachaId]);
      if ((result as any).erros && (result as any).erros.length) {
        setError((result as any).erros.join('\n'));
      } else {
        setFeedback('Crachá associado com sucesso.');
        setTimeout(() => setOpen(false), 1000);
      }
    } catch (e: any) {
      setError(e?.response?.data?.detail || 'Não foi possível associar o crachá.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button variant="ghost" size="sm" title="Associar crachá">
            <span className="material-icons text-indigo-600">assignment_ind</span>
          </Button>
        )}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Associar crachá à visita</DialogTitle>
          <DialogDescription>Escolha um crachá livre para vincular a esta visita.</DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <label className="text-sm">Crachá</label>
          <Select value={selectedCrachaId} onValueChange={setSelectedCrachaId}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder={crachasLivres.length ? 'Selecione' : 'Sem crachás livres'} />
            </SelectTrigger>
            <SelectContent>
              {crachasLivres.map(c => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.numero}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error && <p className="text-sm text-red-600">{error}</p>}
          {feedback && <p className="text-sm text-green-700">{feedback}</p>}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <DialogClose asChild>
            <Button variant="outline">Cancelar</Button>
          </DialogClose>
          <Button onClick={handleAssign} disabled={loading || !selectedCrachaId}>
            {loading ? 'Associando...' : 'Associar'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}


