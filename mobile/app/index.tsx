import { useEffect, useState } from 'react';
import { Redirect } from 'expo-router';
import * as SecureStore from 'expo-secure-store';

export default function Index() {
  const [logado, setLogado] = useState<boolean | null>(null);
  useEffect(() => {
    SecureStore.getItemAsync('accessToken').then((t) => setLogado(!!t));
  }, []);
  if (logado === null) return null;
  return <Redirect href={logado ? '/(tabs)' : '/login'} />;
}
