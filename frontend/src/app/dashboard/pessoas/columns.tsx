import { ColumnDef } from '@tanstack/react-table';
import { Visitante } from '@/types/pessoa';
import { ActionsCell } from '@/components/pessoas/ActionsCell';

export type Pessoa = Visitante;

const getTipoPessoaColor = (tipo: string) => {
  switch (tipo) {
    case 'singular':
      return 'bg-blue-100 text-blue-800';
    case 'coletiva':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

const getTipoPessoaLabel = (tipo: string) => {
  switch (tipo) {
    case 'singular':
      return 'Singular';
    case 'coletiva':
      return 'Coletiva';
    default:
      return tipo;
  }
};

export const columns: ColumnDef<Pessoa>[] = [
  {
    accessorKey: 'nome',
    header: 'Nome',
    cell: ({ row }) => {
      const pessoa = row.original;
      const nomeExibido = pessoa.tipo_pessoa === 'coletiva' && pessoa.designacao_social 
        ? pessoa.designacao_social 
        : pessoa.nome;
      
      return (
        <div className="font-medium">
          {nomeExibido || 'Nome não informado'}
        </div>
      );
    },
  },
  {
    accessorKey: 'email',
    header: 'Email',
    cell: ({ row }) => {
      const email = row.getValue('email') as string;
      return email || '-';
    },
  },
  {
    accessorKey: 'telefone',
    header: 'Telefone',
    cell: ({ row }) => {
      const telefone = row.getValue('telefone') as string;
      return telefone || '-';
    },
  },
  {
    accessorKey: 'documento_numero',
    header: 'Documento',
    cell: ({ row }) => {
      const pessoa = row.original;
      return (
        <div>
          <div className="font-medium">{pessoa.documento_numero || '-'}</div>
          <div className="text-sm text-muted-foreground">{pessoa.documento_tipo || ''}</div>
        </div>
      );
    },
  },
  {
    accessorKey: 'tipo_pessoa',
    header: 'Tipo',
    cell: ({ row }) => {
      const tipo = row.getValue('tipo_pessoa') as string;
      const color = getTipoPessoaColor(tipo);
      const label = getTipoPessoaLabel(tipo);
      return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{label}</span>
      );
    },
  },
  {
    accessorKey: 'data_registo',
    header: 'Data de Registro',
    cell: ({ row }) => {
      const dataRegisto = row.getValue('data_registo') as string;
      if (!dataRegisto) return '-';
      const date = new Date(dataRegisto);
      return (
        <div className="text-sm">
          {date.toLocaleDateString('pt-PT')}
          <div className="text-xs text-muted-foreground">
            {date.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
          </div>
        </div>
      );
    },
  },
  {
    accessorKey: 'ativo',
    header: 'Status',
    cell: ({ row }) => {
      const ativo = row.getValue('ativo') as boolean;
      const color = ativo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
      const label = ativo ? 'Ativo' : 'Inativo';
      return (
        <span className={`px-2 py-1 rounded text-xs font-semibold ${color}`}>{label}</span>
      );
    },
  },
  {
    id: 'actions',
    cell: ({ row }) => {
      const pessoa = row.original;
      return <ActionsCell pessoa={pessoa} />;
    },
  },
];