import api from './api';
import { Atendimento } from '@/types/atendimento';

export async function getAtendimentos(): Promise<Atendimento[]> {
  const res = await api.get('/atendimentos/');
  return res.data;
}

export async function createAtendimento(data: Partial<Atendimento>): Promise<Atendimento> {
  const res = await api.post('/atendimentos/', data);
  return res.data;
}

export async function updateAtendimento(id: string, data: Partial<Atendimento>): Promise<Atendimento> {
  const res = await api.put(`/atendimentos/${id}/`, data);
  return res.data;
}

export async function deleteAtendimento(id: string): Promise<void> {
  await api.delete(`/atendimentos/${id}/`);
}

export async function getAtendimentoById(id: string): Promise<Atendimento> {
  const res = await api.get(`/atendimentos/${id}/`);
  return res.data;
}
