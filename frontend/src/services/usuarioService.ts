import api from './api';
import { Usuario, UsuarioFormData } from '@/types/usuario';
import { extractAndTransformData } from '@/utils/apiUtils';

export async function getUsuarios(): Promise<Usuario[]> {
    try {
        const res = await api.get('/usuarios/');
        
        // Usar função utilitária para extrair dados e transformar
        return extractAndTransformData(res.data, (u: any) => ({
            ...u,
            ativo: u.is_active,
        }));
    } catch (error) {
        console.error('❌ Erro ao buscar usuários:', error);
        return [];
    }
}

export async function getUsuariosNaoAssociados(): Promise<Usuario[]> {
    try {
        const res = await api.get('/usuarios/nao-associados/');
        
        // Usar função utilitária para extrair dados
        return extractAndTransformData(res.data, (u: any) => u);
    } catch (error) {
        console.error('❌ Erro ao buscar usuários não associados:', error);
        return [];
    }
}

export async function getUsuarioById(id: string): Promise<Usuario> {
    try {
        const res = await api.get(`/usuarios/${id}/`);
        return res.data;
    } catch (error) {
        console.error('❌ Erro ao buscar usuário por ID:', error);
        throw error;
    }
}

export async function updateUsuario(id: string, data: Partial<Usuario>): Promise<Usuario> {
    try {
        const res = await api.put(`/usuarios/${id}/`, data);
        return res.data;
    } catch (error) {
        console.error('❌ Erro ao atualizar usuário:', error);
        throw error;
    }
}

export async function createUsuario(data: UsuarioFormData): Promise<Usuario> {
    try {
        const payload = {
            ...data,
            // converter selects para números se vierem como string
            perfil: typeof data.perfil === 'string' ? Number(data.perfil) : data.perfil,
            orgao: typeof data.orgao === 'string' && data.orgao !== '' ? Number(data.orgao) : data.orgao,
        } as any;
        const res = await api.post('/usuarios/', payload);
        return res.data;
    } catch (error) {
        console.error('❌ Erro ao criar usuário:', error);
        throw error;
    }
}

export async function deleteUsuario(id: string): Promise<void> {
    try {
        await api.delete(`/usuarios/${id}/`);
    } catch (error) {
        console.error('❌ Erro ao excluir usuário:', error);
        throw error;
    }
}