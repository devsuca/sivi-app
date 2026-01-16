import { ColumnDef } from '@tanstack/react-table';
import { Visita } from '@/types/visita';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Eye, Clock, CheckCircle, PlayCircle, Trash2 } from 'lucide-react';
import AssignCrachaButton from '@/components/visitas/AssignCrachaButton';
import FinalizeVisitaButton from '@/components/visitas/FinalizeVisitaButton';
import { VisitaActionsCell } from '@/components/visitas/VisitaActionsCell';

// Colunas específicas para usuários de recepção (sem ações de edição/finalização)
export const getRecepcaoColumns = (): ColumnDef<Visita>[] => [
  {
    accessorKey: 'numero',
    header: 'Nº',
    cell: info => (
      <div className="text-center font-mono font-semibold text-gray-700">
        {String(info.getValue() ?? '-')}
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: 'visitante_obj',
    header: 'Visitante',
    cell: info => {
      const nome = (info.row.original as any).visitante_obj?.nome || '-';
      return (
        <div className="max-w-[150px] truncate font-medium" title={nome}>{nome}</div>
      );
    },
    size: 150,
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: info => {
      const estado = info.getValue() as string;
      
      const estadoConfig = {
        agendada: {
          label: 'Agendada',
          className: 'bg-blue-100 text-blue-800 border-blue-200',
          icon: Clock,
        },
        em_curso: {
          label: 'Em Curso',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200',
          icon: PlayCircle,
        },
        concluida: {
          label: 'Concluída',
          className: 'bg-green-100 text-green-800 border-green-200',
          icon: CheckCircle,
        },
        default: {
          label: estado,
          className: 'bg-gray-100 text-gray-800 border-gray-200',
          icon: Clock,
        }
      };

      const config = estadoConfig[estado as keyof typeof estadoConfig] || estadoConfig.default;
      const IconComponent = config.icon;

      return (
        <Badge 
          variant="outline" 
          className={`px-3 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 ${config.className}`}
        >
          <IconComponent className="w-3 h-3" />
          {config.label || '-'}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'data_hora_entrada',
    header: 'Entrada',
    cell: info => {
      const row = info.row.original as any;
      const value = (info.getValue() as string) || row?.data_entrada || row?.data_registo;
      return value ? (
        <div className="text-sm whitespace-nowrap" title={new Date(value).toLocaleString()}>
          {new Date(value).toLocaleDateString()}
          <br />
          <span className="text-xs text-gray-500">
            {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">Não registrada</span>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'data_hora_saida',
    header: 'Saída',
    cell: info => {
      const value = info.getValue() as string;
      return value ? (
        <div className="text-sm whitespace-nowrap" title={new Date(value).toLocaleString()}>
          {new Date(value).toLocaleDateString()}
          <br />
          <span className="text-xs text-gray-500">
            {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
    size: 120,
  },
  {
    id: 'acoes',
    header: 'Ações',
    cell: info => {
      const id = info.row.original.id;
      return (
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => { window.location.href = `/dashboard/visitas/${id}`; }}
            className="flex items-center gap-1"
          >
            <Eye className="w-4 h-4" />
            Ver
          </Button>
        </div>
      );
    },
    size: 100,
  },
];

export const columns: ColumnDef<Visita>[] = [
  {
    accessorKey: 'numero',
    header: 'Nº',
    cell: info => (
      <div className="text-center font-mono font-semibold text-gray-700">
        {String(info.getValue() ?? '-')}
      </div>
    ),
    size: 80,
  },
  {
    accessorKey: 'visitante_obj',
    header: 'Visitante',
    cell: info => {
      const nome = (info.row.original as any).visitante_obj?.nome || '-';
      return (
        <div className="max-w-[150px] truncate font-medium" title={nome}>{nome}</div>
      );
    },
    size: 150,
  },
  {
    accessorKey: 'orgao_obj',
    header: 'Órgão',
    cell: info => {
      const orgao = (info.row.original as any).orgao_obj;
      const sigla = orgao?.sigla || '-';
      const nome = orgao?.nome || '-';
      return (
        <div className="max-w-[120px] truncate" title={`${sigla} - ${nome}`}>
          <div className="font-semibold text-blue-600">{sigla}</div>
        </div>
      );
    },
    size: 100,
  },
  {
    accessorKey: 'estado',
    header: 'Estado',
    cell: info => {
      const estado = info.getValue() as string;
      
      const estadoConfig = {
        agendada: {
          label: 'Agendada',
          className: 'bg-blue-100 text-blue-800 border-blue-200 hover:bg-blue-200 transition-colors',
          icon: Clock,
        },
        em_curso: {
          label: 'Em Curso',
          className: 'bg-yellow-100 text-yellow-800 border-yellow-200 hover:bg-yellow-200 transition-colors',
          icon: PlayCircle,
        },
        concluida: {
          label: 'Concluída',
          className: 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200 transition-colors',
          icon: CheckCircle,
        },
        default: {
          label: estado,
          className: 'bg-gray-100 text-gray-800 border-gray-200 hover:bg-gray-200 transition-colors',
          icon: Clock,
        }
      };

      const config = estadoConfig[estado as keyof typeof estadoConfig] || estadoConfig.default;
      const IconComponent = config.icon;

      return (
        <Badge 
          variant="outline" 
          className={`px-3 py-1 rounded-full text-xs font-semibold border-2 flex items-center gap-1 ${config.className}`}
        >
          <IconComponent className="w-3 h-3" />
          {config.label || '-'}
        </Badge>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'data_hora_entrada',
    header: 'Entrada',
    cell: info => {
      const row = info.row.original as any;
      const value = (info.getValue() as string) || row?.data_entrada || row?.data_registo;
      return value ? (
        <div className="text-sm whitespace-nowrap" title={new Date(value).toLocaleString()}>
          {new Date(value).toLocaleDateString()}
          <br />
          <span className="text-xs text-gray-500">
            {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">Não registrada</span>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'data_hora_saida',
    header: 'Saída',
    cell: info => {
      const value = info.getValue() as string;
      return value ? (
        <div className="text-sm whitespace-nowrap" title={new Date(value).toLocaleString()}>
          {new Date(value).toLocaleDateString()}
          <br />
          <span className="text-xs text-gray-500">
            {new Date(value).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
        </div>
      ) : (
        <span className="text-gray-400">-</span>
      );
    },
    size: 120,
  },
  {
    accessorKey: 'confirmada_recepcao',
    header: 'Confirmação Órgão',
    cell: info => {
      const confirmada = info.getValue() as boolean;
      return confirmada ? (
        <span className="inline-flex items-center gap-1 bg-green-100 text-green-800 px-2 py-1 rounded font-semibold text-xs border border-green-300">
          <CheckCircle className="inline w-4 h-4 text-green-500" /> Confirmada
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-400 px-2 py-1 rounded font-semibold text-xs border border-gray-200">
          <Clock className="inline w-4 h-4 text-gray-400" /> Não confirmada
        </span>
      );
    },
    enableSorting: false,
    size: 120,
  },
  {
    id: 'crachas_status',
    header: 'Crachás',
    cell: info => {
      const visita = info.row.original;
      // Este campo será preenchido dinamicamente pelo componente
      return (
        <div className="text-xs text-gray-500">
          <span className="inline-flex items-center px-2 py-1 rounded-full bg-gray-100 text-gray-600">
            <span className="w-2 h-2 bg-gray-400 rounded-full mr-1"></span>
            Verificando...
          </span>
        </div>
      );
    },
    size: 100,
  },
  {
    id: 'acoes_rapidas',
    header: 'Ações Rápidas',
    cell: info => {
      const visita = info.row.original;
      const estado = visita.estado;
      
      return (
        <div className="flex items-center gap-2">
          <FinalizeVisitaButton 
            visitaId={visita.id}
            visitaNumero={String(visita.numero || '')}
            estado={estado}
            onSuccess={() => {
              // Recarregar a página para atualizar os dados
              window.location.reload();
            }}
          />
        </div>
      );
    },
    size: 150,
  },
  {
    id: 'acoes',
    header: 'Mais Ações',
    cell: info => {
      const visita = info.row.original;
      return (
        <VisitaActionsCell 
          visita={visita}
          onDelete={() => {
            // Recarregar a página para atualizar os dados
            window.location.reload();
          }}
        />
      );
    },
    size: 120,
  },
];