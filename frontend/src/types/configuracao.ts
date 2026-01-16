export type TipoConfiguracao =
  | 'role'
  | 'permissao'
  | 'instituicao'
  | 'api'
  | 'relatorio'
  | 'impressao'
  | 'tema'
  | 'outro';

export type TipoDado = 'texto' | 'numero' | 'booleano' | 'json';

export interface ConfiguracaoSistema {
  id: string;
  chave: string;
  valor: string;
  tipo: TipoConfiguracao;
  tipo_dado: TipoDado;
  descricao?: string;
  ativo: boolean;
}
