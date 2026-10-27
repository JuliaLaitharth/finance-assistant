import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, KeyboardAvoidingView, Platform,
} from "react-native";
import { api } from "../services/api";

export default function CadastroScreen({ navigation }: any) {
  const [nome, setNome] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [confirmar, setConfirmar] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleCadastro() {
    if (!nome || !email || !senha) return Alert.alert("Atenção", "Preencha todos os campos.");
    if (senha.length < 6) return Alert.alert("Atenção", "A senha deve ter ao menos 6 caracteres.");
    if (senha !== confirmar) return Alert.alert("Atenção", "As senhas não coincidem.");

    setLoading(true);
    try {
      await api.post("/auth/cadastro", {
        nome: nome.trim(),
        email: email.trim().toLowerCase(),
        senha,
      });
      Alert.alert("Sucesso", "Conta criada! Faça login.", [
        { text: "OK", onPress: () => navigation.navigate("Login") },
      ]);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      Alert.alert("Erro", Array.isArray(msg) ? msg.join("\n") : msg || "Falha de conexão com o servidor");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <Text style={s.title}>Criar conta</Text>

      <TextInput style={s.input} placeholder="Nome completo" value={nome} onChangeText={setNome} />
      <TextInput style={s.input} placeholder="E-mail" value={email} onChangeText={setEmail}
        keyboardType="email-address" autoCapitalize="none" />
      <TextInput style={s.input} placeholder="Senha" value={senha} onChangeText={setSenha} secureTextEntry />
      <TextInput style={s.input} placeholder="Confirmar senha" value={confirmar}
        onChangeText={setConfirmar} secureTextEntry />

      <TouchableOpacity style={s.button} onPress={handleCadastro} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.buttonText}>Cadastrar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={s.link}>Já tem conta? Entrar</Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 24, backgroundColor: "#fff" },
  title: { fontSize: 28, fontWeight: "bold", marginBottom: 24, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ddd", borderRadius: 10, padding: 14, marginBottom: 12, fontSize: 16 },
  button: { backgroundColor: "#4f46e5", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  link: { color: "#4f46e5", textAlign: "center", marginTop: 16 },
});
