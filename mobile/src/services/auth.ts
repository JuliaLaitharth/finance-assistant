import * as SecureStore from 'expo-secure-store';
import { api } from './api';

export async function login(email: string, senha: string) {
  const { data } = await api.post('/auth/login', { email: email.trim().toLowerCase(), senha });
  await SecureStore.setItemAsync('accessToken', data.accessToken);
  await SecureStore.setItemAsync('refreshToken', data.refreshToken);
  await SecureStore.setItemAsync('savedEmail', data.usuario.email);
  return data;
}

export async function cadastro(nome: string, email: string, senha: string) {
  const { data } = await api.post('/auth/cadastro', { nome, email, senha });
  return data;
}

export async function logout() {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  try { await api.post('/auth/logout', { refreshToken }); } catch {}
  await SecureStore.deleteItemAsync('accessToken');
  await SecureStore.deleteItemAsync('refreshToken');
}
