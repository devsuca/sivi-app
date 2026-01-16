import api from './api';
import { ConfiguracaoSistema } from '@/types/configuracao';

export async function getConfiguracoes(): Promise<ConfiguracaoSistema[]> {
  const res = await api.get('/configuracoes/configuracoes/');
  return res.data;
}

export async function getConfiguracaoById(id: string): Promise<ConfiguracaoSistema> {
  const res = await api.get(`/configuracoes/configuracoes/${id}/`);
  return res.data;
}

export async function createConfiguracao(data: Partial<ConfiguracaoSistema>): Promise<ConfiguracaoSistema> {
  const res = await api.post('/configuracoes/configuracoes/', data);
  return res.data;
}

export async function updateConfiguracao(id: string, data: Partial<ConfiguracaoSistema>): Promise<ConfiguracaoSistema> {
  const res = await api.put(`/configuracoes/configuracoes/${id}/`, data);
  return res.data;
}

export async function deleteConfiguracao(id: string): Promise<void> {
  await api.delete(`/configuracoes/configuracoes/${id}/`);
}
