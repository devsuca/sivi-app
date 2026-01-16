import api from './api';
import { Pertence } from '@/types/pertence';

export const getPertences = async (): Promise<Pertence[]> => {
  const response = await api.get('/pertences/');
  return response.data;
};

export const getPertenceById = async (id: number): Promise<Pertence> => {
  const response = await api.get(`/pertences/${id}/`);
  return response.data;
};

export const createPertence = async (data: Partial<Pertence>): Promise<Pertence> => {
  const response = await api.post('/pertences/', data);
  return response.data;
};

export const updatePertence = async (id: number, data: Partial<Pertence>): Promise<Pertence> => {
  const response = await api.put(`/pertences/${id}/`, data);
  return response.data;
};

export const deletePertence = async (id: number): Promise<void> => {
  await api.delete(`/pertences/${id}/`);
};

export const levantarPertence = async (id: number): Promise<Pertence> => {
  const response = await api.post(`/pertences/${id}/levantar/`);
  return response.data;
};

export const getPertencesEmPosse = async (): Promise<Pertence[]> => {
  const response = await api.get('/pertences/em_posse/');
  return response.data;
};