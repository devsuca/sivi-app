'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Visitante } from '@/types/pessoa';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

interface ActionsCellProps {
  pessoa: Visitante;
}

export function ActionsCell({ pessoa }: ActionsCellProps) {
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await import('@/services/pessoaService').then(({ deleteVisitante }) => deleteVisitante(pessoa.id));
      toast.success('Visitante removido com sucesso!');
      setShowDeleteDialog(false);
      window.location.reload();
    } catch (error: any) {
      console.error('Erro ao deletar visitante:', error);
      toast.error('Erro ao remover visitante. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getNomeExibido = () => {
    return pessoa.tipo_pessoa === 'coletiva' && pessoa.designacao_social 
      ? pessoa.designacao_social 
      : pessoa.nome || 'Visitante sem nome';
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Abrir menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Ações</DropdownMenuLabel>
          <DropdownMenuItem
            onClick={() => {navigator.clipboard.writeText(pessoa.id); toast.success('ID copiado!');}}
          >
            Copiar ID
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => window.location.href = `/dashboard/pessoas/${pessoa.id}`}
          >
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={() => window.location.href = `/dashboard/pessoas/${pessoa.id}/editar`}
          >
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-500"
            onClick={() => setShowDeleteDialog(true)}
          >
            Apagar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Remover Visitante"
        description={`Tem certeza que deseja remover o visitante "${getNomeExibido()}"? Esta ação não pode ser desfeita.`}
        confirmText="Remover"
        cancelText="Cancelar"
        variant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
        loading={isDeleting}
      />
    </>
  );
}
