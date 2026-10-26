import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { PluggyConnect } from 'react-native-pluggy-connect';
import { router } from 'expo-router';
import { api, msgErro } from '../../src/services/api';

export default function Conectar() {
  const [token, setToken] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function abrir() {
    setCarregando(true);
    try { setToken((await api.post('/pluggy/connect-token')).data.accessToken); }
    catch (e) { Alert.alert('Erro', msgErro(e)); }
    finally { setCarregando(false); }
  }

  async function sucesso({ item }: any) {
    setToken(null); setCarregando(true);
    try {
      await api.post('/pluggy/items', { itemId: item.id });
      Alert.alert('Pronto', 'Banco conectado e sincronizado.');
      router.replace('/(tabs)');
    } catch (e) { Alert.alert('Erro', msgErro(e)); }
    finally { setCarregando(false); }
  }

  if (token)
    return (
      <PluggyConnect
        connectToken={token}
        includeSandbox
        onSuccess={sucesso}
        onError={() => { setToken(null); Alert.alert('Erro', 'Falha na conexão com o banco.'); }}
        onClose={() => setToken(null)}
      />
    );

  return (
    <View style={s.container}>
      <Text style={s.title}>Conectar banco</Text>
      <Text style={s.desc}>Via Open Finance (Pluggy). Seus dados de acesso não passam pelo nosso servidor.</Text>
      <TouchableOpacity style={s.btn} onPress={abrir} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Conectar</Text>}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  desc: { color: '#64748b', marginBottom: 24 },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
