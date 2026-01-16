
import api from './api';
import { Perfil } from '@/types/perfil';
import { extractDataFromResponse } from '@/utils/apiUtils';

export async function getPerfis(): Promise<Perfil[]> {
    try {
        const res = await api.get('/auth/perfis/');
        return extractDataFromResponse(res.data);
    } catch (error) {
        console.error('❌ Erro ao buscar perfis:', error);
        return [];
    }
}
