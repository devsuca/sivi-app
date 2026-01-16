export interface Atendimento {
  id: string;
  visitante: string;
  assunto: string;
  data_atendimento: string;
  atendido_por: string;
  observacoes?: string;
}
