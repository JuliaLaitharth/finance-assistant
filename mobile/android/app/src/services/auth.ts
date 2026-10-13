import { api } from './api';
import * as SecureStore from 'expo-secure-store';

export async function login(email: string, senha: string) {
  const { data } = await api.post('/auth/login', { email, senha });
  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  return data;
}

export async function cadastro(nome: string, email: string, senha: string) {
  const { data } = await api.post('/auth/cadastro', { nome, email, senha });
  return data;
}

export async function logout() {
  await api.post('/auth/logout');
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}
