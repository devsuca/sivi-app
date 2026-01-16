export interface Cracha {
  id: string;
  numero: string;
  estado: 'livre' | 'ocupado' | 'inativo';
  visita?: string | null;
  visita_numero?: string | null;
  visita_estado?: string | null;
}
