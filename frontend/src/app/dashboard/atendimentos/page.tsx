"use client";
import { Atendimento } from '@/types/atendimento';
import DashboardLayout from '@/components/layout/DashboardLayout';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useEffect, useState } from 'react';
import { getAtendimentos, createAtendimento, updateAtendimento, deleteAtendimento, getAtendimentoById } from '@/services/atendimentoService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Toast } from '@/components/ui/toast';
import * as Dialog from '@radix-ui/react-dialog';
import { useForm } from 'react-hook-form';
import { useAuth } from '@/lib/auth';
import DSINotificationForm from '@/components/atendimentos/DSINotificationForm';

export default function AtendimentosPage() {
  const { user } = useAuth();
  const [atendimentos, setAtendimentos] = useState<Atendimento[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [selectedAtendimento, setSelectedAtendimento] = useState<Atendimento | null>(null);
  const [openDetails, setOpenDetails] = useState(false);
  const [openEdit, setOpenEdit] = useState(false);
  const [openDelete, setOpenDelete] = useState(false);

  const { register, handleSubmit, reset, setValue, formState: { isSubmitting } } = useForm<Partial<Atendimento>>();

  // Estados para selects dinâmicos
  const [visitantes, setVisitantes] = useState<import('@/types/pessoa').Visitante[]>([]);
  const [usuarios, setUsuarios] = useState<import('@/types/usuario').Usuario[]>([]);

  useEffect(() => {
    // Carregar visitantes e usuários para os selects
    import('@/services/pessoaService').then(mod => mod.getVisitantes().then(setVisitantes));
    import('@/services/usuarioService').then(mod => mod.getUsuarios().then(setUsuarios));
  }, []);

  const onSubmit = async (data: Partial<Atendimento>) => {
    try {
      await createAtendimento(data);
      setOpen(false);
      reset();
      setLoading(true);
      const updated = await getAtendimentos();
      setAtendimentos(updated);
      setLoading(false);
      setToast({ message: 'Atendimento criado com sucesso!', type: 'success' });
    } catch {
      setToast({ message: 'Erro ao criar atendimento', type: 'error' });
    }
  };

  useEffect(() => {
    // Se for usuário de recepção, não carregar atendimentos
    if (user?.role === 'recepcao') {
      setLoading(false);
      return;
    }
    
    getAtendimentos().then(data => {
      setAtendimentos(data);
      setLoading(false);
    });
  }, [user]);

  // Handlers para modais
  const handleOpenDetails = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setOpenDetails(true);
  };
  const handleOpenEdit = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setOpenEdit(true);
  };
  const handleOpenDelete = (atendimento: Atendimento) => {
    setSelectedAtendimento(atendimento);
    setOpenDelete(true);
  };

  // Funções utilitárias para exibir nomes
  const getVisitanteNome = (id: string) => {
    const v = visitantes.find(v => v.id === id);
    return v ? (v.nome || v.designacao_social || v.id) : id;
  };
  const getUsuarioNome = (id: string) => {
    const u = usuarios.find(u => u.id === id);
    return u ? u.nome : id;
  };

  // Se for usuário de recepção, mostrar formulário de notificação DSI
  if (user?.role === 'recepcao') {
    return (
      <ProtectedRoute>
        <DashboardLayout>
          <div className="flex flex-col gap-4 mb-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-primary">Notificação ao DSI</h1>
                <p className="text-muted-foreground text-sm mt-1">Envie notificações ao Departamento de Segurança Institucional</p>
              </div>
            </div>
          </div>
          <DSINotificationForm />
        </DashboardLayout>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <DashboardLayout>
      {toast && <Toast message={toast.message} type={toast.type} />}
      <div className="flex flex-col gap-4 mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-primary">Gestão de Atendimentos</h1>
            <p className="text-muted-foreground text-sm mt-1">Lista dos atendimentos cadastrados no sistema</p>
          </div>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <Button variant="default">Novo Atendimento</Button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
              <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6">
                <Dialog.Title className="text-lg font-bold mb-2">Criar Atendimento</Dialog.Title>
                <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
                  <Input placeholder="Assunto" {...register('assunto', { required: true })} />
                  <select {...register('visitante', { required: true })} className="border rounded p-2">
                    <option value="">Selecione o visitante</option>
                    {visitantes.map((v: any) => (
                      <option key={v.id} value={v.id}>{v.nome || v.designacao_social}</option>
                    ))}
                  </select>
                  <select {...register('atendido_por', { required: true })} className="border rounded p-2">
                    <option value="">Selecione o usuário</option>
                    {usuarios.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.nome}</option>
                    ))}
                  </select>
                  <Input placeholder="Observações" {...register('observacoes')} />
                  <div className="flex gap-2 mt-2">
                    <Button type="submit" disabled={isSubmitting}>Criar</Button>
                    <Dialog.Close asChild>
                      <Button type="button" variant="outline">Cancelar</Button>
                    </Dialog.Close>
                  </div>
                </form>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow p-6">
        {loading ? (
          <div className="flex justify-center items-center h-32">
            <span className="animate-pulse text-lg text-muted-foreground">A carregar...</span>
          </div>
        ) : atendimentos.length === 0 ? (
          <div className="flex flex-col items-center py-12">
            <span className="text-muted-foreground">Nenhum atendimento cadastrado.</span>
          </div>
        ) : (
          <ul className="divide-y">
            {atendimentos.map(atendimento => (
              <li key={atendimento.id} className="py-3 flex flex-col md:flex-row md:justify-between md:items-center gap-2">
                <div className="flex flex-col md:flex-row md:items-center gap-2 flex-1">
                  <span className="font-semibold text-primary">{atendimento.assunto}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">Visitante: {getVisitanteNome(atendimento.visitante)}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">Atendido por: {getUsuarioNome(atendimento.atendido_por)}</span>
                  <span className="text-xs px-2 py-1 rounded bg-gray-100 text-gray-800">Data: {new Date(atendimento.data_atendimento).toLocaleString()}</span>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" onClick={() => handleOpenDetails(atendimento)}>Detalhes</Button>
                  <Button size="sm" variant="secondary" onClick={() => handleOpenEdit(atendimento)}>Editar</Button>
                  <Button size="sm" variant="destructive" onClick={() => handleOpenDelete(atendimento)}>Excluir</Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      {/* Modal de Detalhes */}
      <Dialog.Root open={openDetails} onOpenChange={setOpenDetails}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-bold mb-2">Detalhes do Atendimento</Dialog.Title>
            {selectedAtendimento && (
              <div className="flex flex-col gap-2">
                <span><b>Assunto:</b> {selectedAtendimento.assunto}</span>
                <span><b>Visitante:</b> {getVisitanteNome(selectedAtendimento.visitante)}</span>
                <span><b>Atendido por:</b> {getUsuarioNome(selectedAtendimento.atendido_por)}</span>
                <span><b>Data:</b> {new Date(selectedAtendimento.data_atendimento).toLocaleString()}</span>
                <span><b>Observações:</b> {selectedAtendimento.observacoes || '-'}</span>
              </div>
            )}
            <div className="flex justify-end mt-4">
              <Dialog.Close asChild>
                <Button variant="outline">Fechar</Button>
              </Dialog.Close>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {/* Modal de Edição */}
      <Dialog.Root open={openEdit} onOpenChange={setOpenEdit}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-bold mb-2">Editar Atendimento</Dialog.Title>
            {selectedAtendimento && (
              <EditAtendimentoForm atendimento={selectedAtendimento} onClose={() => setOpenEdit(false)} onUpdated={async () => {
                setOpenEdit(false);
                setLoading(true);
                const updated = await getAtendimentos();
                setAtendimentos(updated);
                setLoading(false);
              }} />
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      {/* Modal de Exclusão */}
      <Dialog.Root open={openDelete} onOpenChange={setOpenDelete}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/40 z-50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-lg p-6">
            <Dialog.Title className="text-lg font-bold mb-2">Excluir Atendimento</Dialog.Title>
            <p>Tem certeza que deseja excluir o atendimento <b>{selectedAtendimento?.assunto}</b>?</p>
            <div className="flex gap-2 justify-end mt-4">
              <Button variant="outline" onClick={() => setOpenDelete(false)}>Cancelar</Button>
              <Button variant="destructive" onClick={async () => {
                if (selectedAtendimento) {
                  try {
                    await deleteAtendimento(selectedAtendimento.id);
                    setOpenDelete(false);
                    setLoading(true);
                    const updated = await getAtendimentos();
                    setAtendimentos(updated);
                    setLoading(false);
                    setToast({ message: 'Atendimento excluído com sucesso!', type: 'success' });
                  } catch {
                    setToast({ message: 'Erro ao excluir atendimento', type: 'error' });
                  }
                }
              }}>Excluir</Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
      </DashboardLayout>
    </ProtectedRoute>
  );
}

// Componente de edição de atendimento
import { useForm as useEditForm } from 'react-hook-form';
function EditAtendimentoForm({ atendimento, onClose, onUpdated }: { atendimento: Atendimento; onClose: () => void; onUpdated: () => void }) {
  const { register, handleSubmit, setValue, formState: { isSubmitting } } = useEditForm<Partial<Atendimento>>({ defaultValues: atendimento });
  const [visitantes, setVisitantes] = useState<import('@/types/pessoa').Visitante[]>([]);
  const [usuarios, setUsuarios] = useState<import('@/types/usuario').Usuario[]>([]);

  useEffect(() => {
    import('@/services/pessoaService').then(mod => mod.getVisitantes().then(setVisitantes));
    import('@/services/usuarioService').then(mod => mod.getUsuarios().then(setUsuarios));
  }, []);

  const onSubmit = async (data: Partial<Atendimento>) => {
    try {
      await updateAtendimento(atendimento.id, data);
      onUpdated();
    } catch {}
  };

  return (
    <form className="flex flex-col gap-3" onSubmit={handleSubmit(onSubmit)}>
      <Input placeholder="Assunto" {...register('assunto', { required: true })} />
      <select {...register('visitante', { required: true })} className="border rounded p-2">
        <option value="">Selecione o visitante</option>
        {visitantes.map((v) => (
          <option key={v.id} value={v.id}>{v.nome || v.designacao_social}</option>
        ))}
      </select>
      <select {...register('atendido_por', { required: true })} className="border rounded p-2">
        <option value="">Selecione o usuário</option>
        {usuarios.map((u) => (
          <option key={u.id} value={u.id}>{u.nome}</option>
        ))}
      </select>
      <Input placeholder="Observações" {...register('observacoes')} />
      <div className="flex gap-2 mt-2">
        <Button type="submit" disabled={isSubmitting}>Salvar</Button>
        <Button type="button" variant="outline" onClick={onClose}>Cancelar</Button>
      </div>
    </form>
  );
}
