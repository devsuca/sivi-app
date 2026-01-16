import { Efetivo } from './efetivo';

export interface Visitante {
  id: string; // UUID
  tipo_pessoa: 'singular' | 'coletiva';
  nome?: string;
  genero?: 'M' | 'F';
  data_nascimento?: string; // Date
  designacao_social?: string;
  representante?: string; // UUID of another Visitante
  representante_details?: {
    id: string;
    nome: string;
    documento_numero?: string;
    documento_tipo?: string;
    email?: string;
    telefone?: string;
    cargo?: string;
  };
  documento_tipo?: 'BI' | 'PASSAPORTE' | 'CARTA' | 'CARTAO_RESIDENTE' | 'OUTRO';
  documento_numero?: string;
  documento_validade?: string; // Date
  documento_emissao?: string; // Date
  nacionalidade?: string;
  provincia_nascimento?: string;
  estado_civil?: string;
  nif?: string;
  email?: string;
  telefone?: string;
  website?: string;
  tipo_empresa?: string;
  setor_atividade?: string;
  data_constituicao?: string; // Date
  cargo?: string; // Para representante
  endereco?: string;
  foto?: string; // URL
  observacoes?: string;
  registado_por: number; // User ID
  data_registo: string; // DateTime
  ativo: boolean;
}
