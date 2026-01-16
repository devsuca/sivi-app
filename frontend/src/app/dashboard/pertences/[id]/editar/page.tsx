
"use client";
import { useEffect, useState, use } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { getPertenceById, updatePertence } from '@/services/pertenceService';
import { getEfetivos } from '@/services/efetivoService';
import { useRouter } from 'next/navigation';
import { Pertence } from '@/types/pertence';
import { Efetivo } from '@/types/efetivo';
import { Button } from '@/components/ui/button';

export default function EditarPertencePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [form, setForm] = useState<Partial<Pertence>>({});
  const [efetivos, setEfetivos] = useState<Efetivo[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    if (id) {
      getPertenceById(Number(id)).then(pertence => {
        setForm(pertence);
        setLoading(false);
      }).catch(err => {
        console.error("Erro ao buscar pertence:", err);
        alert("Pertence não encontrado.");
        setLoading(false);
        router.back();
      });
      getEfetivos().then(setEfetivos);
    }
  }, [id, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = { ...form };
      if (payload.estado === 'levantado' && !payload.data_levantamento) {
        payload.data_levantamento = new Date().toISOString();
      }
      await updatePertence(Number(id), payload);
      router.push('/dashboard/pertences');
    } catch (error) {
      console.error("Erro ao atualizar pertence:", error);
      alert('Erro ao atualizar pertence.');
      setLoading(false);
    }
  }

  if (loading) return <DashboardLayout><p>A carregar...</p></DashboardLayout>;

  return (
    <DashboardLayout>
      <h1 className="text-2xl font-bold mb-6">Levantamento de Pertence</h1>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-xl p-8 space-y-6">
            <div className="space-y-1">
                <p className="block text-sm font-semibold text-muted-foreground">Descrição</p>
                <p className="text-lg">{form.descricao}</p>
            </div>
            <div className="space-y-1">
                <p className="block text-sm font-semibold text-muted-foreground">Quantidade</p>
                <p className="text-lg">{form.quantidade}</p>
            </div>
            <div className="space-y-2">
              <label className="block text-base font-semibold text-primary">Estado</label>
              <select className="input w-full rounded-lg border border-gray-300 p-2" value={form.estado} onChange={e => setForm(f => ({ ...f, estado: e.target.value as 'em_posse' | 'levantado' }))}>
                <option value="em_posse">Em Posse</option>
                <option value="levantado">Levantado</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="block text-base font-semibold text-primary">Agente que efetuou o levantamento</label>
              <select className="input w-full rounded-lg border border-gray-300 p-2" value={typeof form.levantado_por === 'object' ? form.levantado_por?.id : form.levantado_por || ''} onChange={e => setForm(f => ({ ...f, levantado_por: e.target.value }))}>
                <option value="">Selecione o agente</option>
                {efetivos.map(e => <option key={e.id} value={e.id}>{e.nome_completo}</option>)}
              </select>
            </div>
            <div className="flex justify-end gap-4 mt-8">
              <Button type="button" variant="outline" onClick={() => router.back()} disabled={loading}>Cancelar</Button>
              <Button type="submit" disabled={loading}>{loading ? 'A guardar...' : 'Guardar'}</Button>
            </div>
        </form>
      </div>
    </DashboardLayout>
  );
}
