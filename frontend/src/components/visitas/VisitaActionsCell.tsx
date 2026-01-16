'use client';
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Trash2 } from 'lucide-react';
import { useAuth } from '@/lib/auth';
import { deleteVisita } from '@/services/visitaService';
import { toast } from 'sonner';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { Visita } from '@/types/visita';

interface VisitaActionsCellProps {
  visita: Visita;
  onDelete?: () => void;
}

export function VisitaActionsCell({ visita, onDelete }: VisitaActionsCellProps) {
  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Verificar se o usuário tem permissão para deletar visitas
  const canDelete = user?.role && ['admin', 'portaria', 'secretaria'].includes(user.role);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteVisita(visita.id);
      toast.success('Visita excluída com sucesso!');
      setShowDeleteDialog(false);
      if (onDelete) {
        onDelete();
      } else {
        // Recarregar a página se não houver callback
        window.location.reload();
      }
    } catch (error: any) {
      console.error('Erro ao deletar visita:', error);
      toast.error('Erro ao excluir visita. Tente novamente.');
    } finally {
      setIsDeleting(false);
    }
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
          <DropdownMenuItem onClick={() => {
            const event = new CustomEvent('visita-details', { detail: visita });
            window.dispatchEvent(event);
          }}>
            <Eye className="mr-2 h-4 w-4" />
            Visualizar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => { 
            window.location.href = `/dashboard/visitas/${visita.id}/editar`; 
          }}>
            Editar
          </DropdownMenuItem>
          {canDelete && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-500"
                onClick={() => setShowDeleteDialog(true)}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Excluir
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <ConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDelete}
        title="Excluir Visita"
        description={`Tem certeza que deseja excluir a visita #${visita.numero}? Esta ação não pode ser desfeita.`}
        confirmText="Excluir"
        cancelText="Cancelar"
        variant="destructive"
        icon={<Trash2 className="h-5 w-5" />}
        loading={isDeleting}
      />
    </>
  );
}
