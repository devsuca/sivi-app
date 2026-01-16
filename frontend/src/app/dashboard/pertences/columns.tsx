
"use client";
import { ColumnDef } from '@tanstack/react-table';
import { Pertence } from '@/types/pertence';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useState } from 'react';
import { Toast } from '@/components/ui/toast';

function LevantarButton({ id, estado }: { id: string; estado: string }) {
  const [showToast, setShowToast] = useState(false);
  const [loading, setLoading] = useState(false);
  const levantar = async () => {
    setLoading(true);
    await import('@/services/pertenceService').then(async mod => {
      await mod.levantarPertence(Number(id));
    });
    setShowToast(true);
    setTimeout(() => {
      setShowToast(false);
      window.location.reload();
    }, 1500);
    setLoading(false);
  };
  return (
    <>
      <Button
        variant="ghost"
        size="sm"
        title="Levantar"
        onClick={levantar}
        disabled={estado === 'levantado' || loading}
      >
        <span className="material-icons text-green-600">check_circle</span>
      </Button>
      {showToast && (
        <Toast message="Pertence levantado com sucesso!" type="success" />
      )}
    </>
  );
}

export const columns: ColumnDef<Pertence>[] = [
  {
    accessorKey: 'descricao',
    header: 'Descrição',
  },
  {
    accessorKey: 'visita_obj.numero',
    header: 'Nº Visita',
    cell: info => info.row.original.visita_obj?.numero || '-',
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: info => {
      const estado = info.getValue() as string;
      const color = estado === 'em_posse' ? 'bg-yellow-100 text-yellow-800' : 'bg-green-100 text-green-800';
      const label = estado === 'em_posse' ? 'Em Posse' : 'Levantado';
      return <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{label}</span>;
    },
  },
  {
    accessorKey: 'data_entrega',
    header: 'Data de Entrega',
    cell: info => new Date(info.getValue() as string).toLocaleString(),
  },
  {
    accessorKey: 'data_levantamento',
    header: 'Data de Levantamento',
    cell: info => info.getValue() ? new Date(info.getValue() as string).toLocaleString() : '-',
  },
  {
    id: 'acoes',
    header: 'Ações',
    cell: ({ row }) => (
      <div className="flex gap-2 justify-center">
        <Link href={`/dashboard/pertences/${row.original.id}/editar`}>
          <Button variant="ghost" size="sm" title="Editar">
            <span className="material-icons text-yellow-600">edit</span>
          </Button>
        </Link>
        <LevantarButton id={row.original.id} estado={row.original.estado} />
      </div>
    ),
  },
];
