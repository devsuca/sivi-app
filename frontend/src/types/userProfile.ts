export interface UserProfile {
  id: number;
  username: string;
  email: string;
  nome: string;
  perfil: {
    id: number;
    nome: string;
    nivel_acesso: string;
  } | null;
  orgao: {
    id: number;
    nome: string;
  } | null;
  is_active: boolean;
  date_joined: string;
  last_login: string | null;
  responsavel: string;
}

