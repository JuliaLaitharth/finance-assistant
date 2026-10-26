import { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import * as SecureStore from 'expo-secure-store';
import * as LocalAuthentication from 'expo-local-authentication';
import { login } from '../src/services/auth';
import { msgErro, renovarToken } from '../src/services/api';

export default function Login() {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [bio, setBio] = useState(false);
  const [carregando, setCarregando] = useState(false);

  useEffect(() => {
    (async () => {
      const ok = (await LocalAuthentication.hasHardwareAsync()) && (await LocalAuthentication.isEnrolledAsync());
      const rt = await SecureStore.getItemAsync('refreshToken');
      setBio(ok && !!rt);
      setEmail((await SecureStore.getItemAsync('savedEmail')) ?? '');
    })();
  }, []);

  async function entrar() {
    const mail = email.trim().toLowerCase();
    if (!mail || !senha) return Alert.alert('Erro', 'Preencha e-mail e senha.');
    if (!/^\S+@\S+\.\S+$/.test(mail)) return Alert.alert('Erro', 'E-mail inválido.');
    setCarregando(true);
    try {
      await login(mail, senha);
      router.replace('/(tabs)');
    } catch (e) {
      Alert.alert('Erro', msgErro(e));
    } finally {
      setCarregando(false);
    }
  }

  async function entrarComBiometria() {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: 'Entrar no FinançasApp', cancelLabel: 'Cancelar' });
    if (!r.success) return;
    if (await renovarToken()) router.replace('/(tabs)');
    else { setBio(false); Alert.alert('Sessão expirada', 'Entre com e-mail e senha.'); }
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>FinançasApp</Text>
      <TextInput style={s.input} placeholder="E-mail" autoCapitalize="none"
        keyboardType="email-address" value={email} onChangeText={setEmail} />
      <TextInput style={s.input} placeholder="Senha" secureTextEntry value={senha} onChangeText={setSenha} />
      <TouchableOpacity style={s.btn} onPress={entrar} disabled={carregando}>
        {carregando ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Entrar</Text>}
      </TouchableOpacity>
      {bio && (
        <TouchableOpacity style={[s.btn, s.btnOutline]} onPress={entrarComBiometria}>
          <Text style={[s.btnText, { color: '#2563eb' }]}>Entrar com biometria</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24, backgroundColor: '#fff' },
  title: { fontSize: 32, fontWeight: 'bold', marginBottom: 32, textAlign: 'center' },
  input: { borderWidth: 1, borderColor: '#ddd', borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  btn: { backgroundColor: '#2563eb', padding: 16, borderRadius: 10, alignItems: 'center', marginTop: 8 },
  btnOutline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#2563eb' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});
