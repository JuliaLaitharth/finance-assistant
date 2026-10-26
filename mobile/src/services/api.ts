import axios from 'axios';
import * as SecureStore from 'expo-secure-store';
import { router } from 'expo-router';

export const BASE_URL = "http://192.168.0.112:3000";
export const api = axios.create({ baseURL: BASE_URL });

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('accessToken');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let renovando: Promise<string | null> | null = null;

export async function renovarToken(): Promise<string | null> {
  const refreshToken = await SecureStore.getItemAsync('refreshToken');
  if (!refreshToken) return null;
  try {
    const { data } = await axios.post(`${BASE_URL}/auth/refresh`, { refreshToken });
    await SecureStore.setItemAsync('accessToken', data.accessToken);
    await SecureStore.setItemAsync('refreshToken', data.refreshToken);
    return data.accessToken;
  } catch {
    await SecureStore.deleteItemAsync('accessToken');
    await SecureStore.deleteItemAsync('refreshToken');
    return null;
  }
}

api.interceptors.response.use(undefined, async (error) => {
  const req = error.config;
  if (error.response?.status === 401 && !req._retry && !req.url?.startsWith('/auth/')) {
    req._retry = true;
    renovando ??= renovarToken().finally(() => (renovando = null));
    const novo = await renovando;
    if (novo) {
      req.headers.Authorization = `Bearer ${novo}`;
      return api(req);
    }
    router.replace('/login');
  }
  return Promise.reject(error);
});

export function msgErro(e: any) {
  const m = e?.response?.data?.message;
  return Array.isArray(m) ? m.join('\n') : m ?? 'Falha de conexão com o servidor';
}
