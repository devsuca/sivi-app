import { Visitante } from './pessoa';
import { Efetivo } from './efetivo';
import { Orgao } from './orgao';
import { Pertence } from '@/types/pertence';

export interface Acompanhante {
  id?: string;
  nome: string;
  documento_tipo: string;
  documento_numero: string;
  nacionalidade: string;
}

export interface Viatura {
  id?: string;
  tipo: string;
  marca: string;
  cor: string;
  matricula: string;
}

export interface Visita {
  id: string; // UUID
  numero: number;
  visitante: Visitante | string;
  efetivo_visitar: Efetivo | string;
  orgao: Orgao | string;
  motivo: string;
  estado: 'agendada' | 'em_curso' | 'concluida' | 'cancelada';
  data_hora_entrada: string; // DateTime
  data_hora_saida?: string; // DateTime
  observacoes?: string;
  acompanhantes: Acompanhante[];
  viaturas: Viatura[];
  pertences: Pertence[];
  registado_por: number; // User ID
  // Campo opcional retornado pelo backend indicando confirmação de presença pela recepção
  confirmada_recepcao?: boolean;
  // Campos expandidos opcionais (quando o backend inclui objetos ao invés de IDs)
  visitante_obj?: {
    id?: string | number;
    nome?: string;
    designacao_social?: string;
  };
  efetivo_visitar_obj?: {
    id?: string | number;
    nome?: string;
  };
  orgao_obj?: {
    id: string | number;
    nome?: string;
    sigla?: string;
  };
  cracha?: {
    numero?: string;
  };
  crachas?: Array<{
    numero?: string;
  }>;
}

// Type for the form state, which will use IDs for relations
export interface VisitaFormState {
  visitante: string;
  efetivo_visitar: string;
  orgao: string;
  motivo: string;
  estado: 'agendada' | 'em_curso' | 'concluida' | 'cancelada';
  data_hora_entrada: string;
  observacoes: string;
  acompanhantes: Acompanhante[];
  viaturas: Viatura[];
  pertences: Pertence[];
  // Campos auxiliares de UI (não existem no backend)
  is_interveniente_processo?: boolean;
  numero_processo?: string;
}