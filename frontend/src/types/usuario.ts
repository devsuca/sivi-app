import { Perfil } from './perfil';

export interface PerfilUsuario {
  id: number;
  nome: string;
  nivel_acesso: string;
}

export interface Usuario {
    id: string;
    username: string;
    email: string;
    nome: string;
    perfil: Perfil | number;
    perfil_nome?: string | null;
    orgao: string | null;
    orgao_nome?: string | null;
    ativo: boolean;
    data_criacao: string;
}

export type UsuarioFormData = Partial<Usuario> & { password?: string };