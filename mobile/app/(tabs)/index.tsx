import { useCallback, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, RefreshControl } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { api } from '../../src/services/api';
import { logout } from '../../src/services/auth';

const brl = (v: number) => v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

export default function Dashboard() {
  const [nome, setNome] = useState('');
  const [contas, setContas] = useState<any[]>([]);
  const [trans, setTrans] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [me, c, t] = await Promise.all([
        api.get('/usuarios/me'), api.get('/pluggy/contas'), api.get('/pluggy/transacoes?limite=100'),
      ]);
      setNome(me.data.nome); setContas(c.data); setTrans(t.data);
    } finally { setCarregando(false); }
  }, []);

  useFocusEffect(useCallback(() => { carregar(); }, [carregar]));

  const saldo = contas.reduce((s, c) => s + Number(c.saldoAtual), 0);
  const inicioMes = new Date(); inicioMes.setDate(1); inicioMes.setHours(0, 0, 0, 0);
  const doMes = trans.filter((t) => new Date(t.data) >= inicioMes);
  const receitas = doMes.filter((t) => t.tipo === 'CREDIT').reduce((s, t) => s + Math.abs(Number(t.valor)), 0);
  const despesas = doMes.filter((t) => t.tipo === 'DEBIT').reduce((s, t) => s + Math.abs(Number(t.valor)), 0);

  async function sair() { await logout(); router.replace('/login'); }

  return (
    <FlatList
      style={s.container}
      data={trans.slice(0, 20)}
      keyExtractor={(t) => String(t.id)}
      refreshControl={<RefreshControl refreshing={carregando} onRefresh={carregar} />}
      ListHeaderComponent={
        <>
          <Text style={s.ola}>Olá, {nome.split(' ')[0]}</Text>
          <View style={s.card}>
            <Text style={[s.label, { color: '#dbeafe' }]}>Saldo atual</Text>
            <Text style={s.saldo}>{brl(saldo)}</Text>
          </View>
          <View style={s.row}>
            <View style={[s.mini, { backgroundColor: '#dcfce7' }]}>
              <Text style={s.label}>Receitas do mês</Text>
              <Text style={[s.valor, { color: '#16a34a' }]}>{brl(receitas)}</Text>
            </View>
            <View style={[s.mini, { backgroundColor: '#fee2e2' }]}>
              <Text style={s.label}>Despesas do mês</Text>
              <Text style={[s.valor, { color: '#dc2626' }]}>{brl(despesas)}</Text>
            </View>
          </View>
          {!contas.length && !carregando && (
            <TouchableOpacity style={s.vazio} onPress={() => router.push('/(tabs)/conectar')}>
              <Text style={{ color: '#2563eb', fontWeight: '600' }}>+ Conectar um banco</Text>
            </TouchableOpacity>
          )}
          <Text style={s.secao}>Últimas transações</Text>
        </>
      }
      renderItem={({ item }) => (
        <View style={s.item}>
          <View style={{ flex: 1 }}>
            <Text numberOfLines={1}>{item.descricao}</Text>
            <Text style={s.label}>{new Date(item.data).toLocaleDateString('pt-BR')}</Text>
          </View>
          <Text style={{ color: item.tipo === 'CREDIT' ? '#16a34a' : '#dc2626', fontWeight: '600' }}>
            {brl(Number(item.valor))}
          </Text>
        </View>
      )}
      ListFooterComponent={
        <TouchableOpacity style={s.sair} onPress={sair}>
          <Text style={{ color: '#dc2626', fontWeight: '600' }}>Sair</Text>
        </TouchableOpacity>
      }
    />
  );
}

const s = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#f8fafc' },
  ola: { fontSize: 22, fontWeight: 'bold', marginBottom: 12 },
  card: { backgroundColor: '#2563eb', borderRadius: 16, padding: 24, marginBottom: 16 },
  label: { color: '#64748b', fontSize: 13 },
  saldo: { color: '#fff', fontSize: 34, fontWeight: 'bold', marginTop: 4 },
  row: { flexDirection: 'row', gap: 12 },
  mini: { flex: 1, borderRadius: 12, padding: 16 },
  valor: { fontSize: 18, fontWeight: 'bold', marginTop: 4 },
  vazio: { marginTop: 16, padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#2563eb', borderStyle: 'dashed', alignItems: 'center' },
  secao: { fontSize: 16, fontWeight: '600', marginTop: 24, marginBottom: 8 },
  item: { flexDirection: 'row', backgroundColor: '#fff', padding: 14, borderRadius: 10, marginBottom: 8, gap: 8 },
  sair: { alignItems: 'center', padding: 24 },
});
