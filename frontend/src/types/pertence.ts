
import { Efetivo } from './efetivo';
import { Visita } from './visita';

export type Pertence = {
  id: string;
  descricao: string;
  tipo?: string;
  quantidade: number;
  estado: 'em_posse' | 'levantado';
  entregue_por: Efetivo | string;
  levantado_por?: Efetivo | string | null;
  visita?: Visita | string | null;
  efetivo?: Efetivo | string | null;
  data_entrega: string;
  data_levantamento?: string | null;

  // For display in tables
  entregue_por_obj?: Efetivo;
  visita_obj?: Visita;
};
