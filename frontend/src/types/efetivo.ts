export interface Efetivo {
  id: string;
  nome_completo: string;
  numero_funcional?: string;
  tipo?: 'interno' | 'externo';
  orgao?: string | number;
  orgao_nome?: string;
  email?: string;
  telefone?: string;
  usuario?: string | number;
  usuario_nome?: string;
  ativo?: boolean;
}

export type EfetivoFormData = Partial<Efetivo> & {
  password?: string;
};