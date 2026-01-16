import { ColumnDef } from '@tanstack/react-table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Building2, Phone, MapPin, User, Edit, Trash2, Eye } from 'lucide-react';
import { Orgao } from '@/types/orgao';

export type OrgaoTable = Orgao;

const getStatusColor = (orgao: Orgao) => {
  // Se tem responsável, está ativo
  if (orgao.responsavel_nome) {
    return 'bg-green-100 text-green-800 border-green-200';
  }
  return 'bg-yellow-100 text-yellow-800 border-yellow-200';
};

const getStatusLabel = (orgao: Orgao) => {
  if (orgao.responsavel_nome) {
    return 'Ativo';
  }
  return 'Sem Responsável';
};

export const columns: ColumnDef<OrgaoTable>[] = [
  {
    accessorKey: 'nome',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          <Building2 className="mr-2 h-4 w-4" />
          Nome do Órgão
          <span className="ml-2">↕</span>
        </Button>
      );
    },
    cell: ({ row }) => {
      const orgao = row.original;
      return (
        <div className="flex flex-col">
          <div className="font-semibold text-primary">{orgao.nome}</div>
          {orgao.sigla && (
            <div className="text-xs text-muted-foreground">{orgao.sigla}</div>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'bloco',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          <MapPin className="mr-2 h-4 w-4" />
          Localização
          <span className="ml-2">↕</span>
        </Button>
      );
    },
    cell: ({ row }) => {
      const orgao = row.original;
      return (
        <div className="flex flex-col gap-1">
          {orgao.bloco && (
            <Badge variant="outline" className="w-fit text-xs">
              <MapPin className="mr-1 h-3 w-3" />
              Bloco {orgao.bloco}
            </Badge>
          )}
          {orgao.numero_porta && (
            <Badge variant="outline" className="w-fit text-xs">
              Porta {orgao.numero_porta}
            </Badge>
          )}
          {!orgao.bloco && !orgao.numero_porta && (
            <span className="text-muted-foreground text-xs">Não informado</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'telefone_interno',
    header: 'Contato',
    cell: ({ row }) => {
      const telefone = row.getValue('telefone_interno') as string;
      return (
        <div className="flex items-center gap-2">
          {telefone ? (
            <>
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-mono">{telefone}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Não informado</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'responsavel_nome',
    header: ({ column }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          className="h-8 px-2 lg:px-3"
        >
          <User className="mr-2 h-4 w-4" />
          Responsável
          <span className="ml-2">↕</span>
        </Button>
      );
    },
    cell: ({ row }) => {
      const responsavel = row.getValue('responsavel_nome') as string;
      return (
        <div className="flex items-center gap-2">
          {responsavel ? (
            <>
              <User className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm">{responsavel}</span>
            </>
          ) : (
            <span className="text-muted-foreground text-sm">Não atribuído</span>
          )}
        </div>
      );
    },
  },
  {
    accessorKey: 'status',
    header: 'Status',
    cell: ({ row }) => {
      const orgao = row.original;
      const color = getStatusColor(orgao);
      const label = getStatusLabel(orgao);
      return (
        <Badge className={`${color} border`}>
          {label}
        </Badge>
      );
    },
  },
  {
    id: 'actions',
    header: 'Ações',
    cell: ({ row }) => {
      const orgao = row.original;

      return (
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
              onClick={() => {
                // Abrir modal de detalhes
                const event = new CustomEvent('orgao-details', { detail: orgao });
                window.dispatchEvent(event);
              }}
            >
              <Eye className="mr-2 h-4 w-4" />
              Ver Detalhes
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => {
                // Abrir modal de edição
                const event = new CustomEvent('orgao-edit', { detail: orgao });
                window.dispatchEvent(event);
              }}
            >
              <Edit className="mr-2 h-4 w-4" />
              Editar
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={() => {
                // Copiar ID
                navigator.clipboard.writeText(orgao.id);
                const event = new CustomEvent('sonner', { 
                  detail: { message: 'ID copiado!', type: 'success' } 
                });
                window.dispatchEvent(event);
              }}
            >
              Copiar ID
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-red-500"
              onClick={() => {
                // Abrir modal de exclusão
                const event = new CustomEvent('orgao-delete', { detail: orgao });
                window.dispatchEvent(event);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
  },
];
