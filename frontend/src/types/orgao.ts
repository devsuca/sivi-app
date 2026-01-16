export interface Orgao {
  id: string;
  nome: string;
  sigla?: string;
  bloco?: string;
  numero_porta?: string;
  telefone_interno?: string;
  responsavel?: string | null; // user id
  responsavel_efetivo?: string | null; // write-only
  responsavel_nome?: string | null; // read-only helper
}