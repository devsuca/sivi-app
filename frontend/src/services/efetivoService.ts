
import api from './api';
import { Efetivo } from '@/types/efetivo';
import { extractDataFromResponse } from '@/utils/apiUtils';

export async function getEfetivos(): Promise<Efetivo[]> {
  try {
    const res = await api.get('/pessoas/efetivos/');
    return extractDataFromResponse(res.data);
  } catch (error: any) {
    console.error('❌ Erro ao buscar efetivos:', error);
    throw error;
  }
}

export async function getEfetivosByOrgao(orgaoId: string | number): Promise<Efetivo[]> {
  try {
    const res = await api.get(`/pessoas/efetivos/?orgao=${orgaoId}`);
    return extractDataFromResponse(res.data);
  } catch (error: any) {
    console.error('❌ Erro ao buscar efetivos por órgão:', error);
    throw error;
  }
}

export async function getEfetivoById(id: string): Promise<Efetivo> {
  try {
    const res = await api.get(`/pessoas/efetivos/${id}/`);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao buscar efetivo por ID:', error);
    throw error;
  }
}

export async function createEfetivo(data: Partial<Efetivo>): Promise<Efetivo> {
  try {
    const payload: any = {
      ...data,
    };
    // Converter orgao para número se vier como string
    if (payload.orgao && typeof payload.orgao === 'string') {
      const num = Number(payload.orgao);
      payload.orgao = isNaN(num) ? payload.orgao : num;
    }
    const res = await api.post('/pessoas/efetivos/', payload);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao criar efetivo:', error);
    throw error;
  }
}

export async function updateEfetivo(id: string, data: Partial<Efetivo>): Promise<Efetivo> {
  try {
    const res = await api.put(`/pessoas/efetivos/${id}/`, data);
    return res.data;
  } catch (error: any) {
    console.error('❌ Erro ao atualizar efetivo:', error);
    throw error;
  }
}

export async function deleteEfetivo(id: string): Promise<void> {
  try {
    await api.delete(`/pessoas/efetivos/${id}/`);
  } catch (error: any) {
    console.error('❌ Erro ao excluir efetivo:', error);
    throw error;
  }
}
