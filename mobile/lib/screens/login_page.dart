import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;

// No simulador iOS, localhost funciona. No emulador Android, use 10.0.2.2
const apiBase = 'http://localhost:3000';

class LoginPage extends StatefulWidget {
  const LoginPage({super.key});

  @override
  State<LoginPage> createState() => _LoginPageState();
}

class _LoginPageState extends State<LoginPage> {
  final _formKey = GlobalKey<FormState>();
  final _emailCtrl = TextEditingController();
  final _senhaCtrl = TextEditingController();
  bool _carregando = false;
  bool _ocultar = true;

  @override
  void dispose() {
    _emailCtrl.dispose();
    _senhaCtrl.dispose();
    super.dispose();
  }

  Future<void> _entrar() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _carregando = true);

    try {
      final res = await http.post(
        Uri.parse('$apiBase/auth/login'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({
          'email': _emailCtrl.text.trim(),
          'senha': _senhaCtrl.text,
        }),
      );
      if (!mounted) return;

      // NestJS retorna 201 por padrão em POST
      if (res.statusCode == 200 || res.statusCode == 201) {
        final token = jsonDecode(res.body)['access_token'];
        debugPrint('JWT: $token'); // depois: salvar no flutter_secure_storage
        Navigator.of(context).pushReplacement(
          MaterialPageRoute(builder: (_) => const _HomeLogada()),
        );
      } else {
        final msg = _extrairMensagem(res.body) ??
            (res.statusCode == 423 || res.statusCode == 429
                ? 'Conta bloqueada por 15 minutos'
                : 'E-mail ou senha inválidos');
        _snack(msg, erro: true);
      }
    } catch (_) {
      _snack('Falha de conexão com o servidor', erro: true);
    } finally {
      if (mounted) setState(() => _carregando = false);
    }
  }

  String? _extrairMensagem(String body) {
    try {
      final m = jsonDecode(body)['message'];
      return m is List ? m.join('\n') : m?.toString();
    } catch (_) {
      return null;
    }
  }

  Future<void> _esqueciSenha() async {
    final ctrl = TextEditingController(text: _emailCtrl.text);
    final email = await showDialog<String>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Recuperar senha'),
        content: TextField(
          controller: ctrl,
          keyboardType: TextInputType.emailAddress,
          decoration: const InputDecoration(labelText: 'E-mail'),
        ),
        actions: [
          TextButton(
              onPressed: () => Navigator.pop(ctx), child: const Text('Cancelar')),
          FilledButton(
              onPressed: () => Navigator.pop(ctx, ctrl.text.trim()),
              child: const Text('Enviar')),
        ],
      ),
    );
    if (email == null || email.isEmpty) return;

    try {
      await http.post(
        Uri.parse('$apiBase/auth/esqueci-senha'),
        headers: {'Content-Type': 'application/json'},
        body: jsonEncode({'email': email}),
      );
      // Mensagem neutra: não revela se o e-mail existe
      _snack('Se o e-mail estiver cadastrado, você receberá um link.');
    } catch (_) {
      _snack('Falha de conexão com o servidor', erro: true);
    }
  }

  void _snack(String msg, {bool erro = false}) {
    if (!mounted) return;
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(msg), backgroundColor: erro ? Colors.red : null),
    );
  }

  @override
  Widget build(BuildContext context) {
    final cs = Theme.of(context).colorScheme;

    return Scaffold(
      body: SafeArea(
        child: Center(
          child: SingleChildScrollView(
            padding: const EdgeInsets.all(24),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  Icon(Icons.account_balance_wallet_rounded,
                      size: 72, color: cs.primary),
                  const SizedBox(height: 16),
                  Text('Finanças App',
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.headlineMedium
                          ?.copyWith(fontWeight: FontWeight.bold)),
                  const SizedBox(height: 8),
                  Text('Entre para ver suas contas',
                      textAlign: TextAlign.center,
                      style: TextStyle(color: cs.onSurfaceVariant)),
                  const SizedBox(height: 40),
                  TextFormField(
                    controller: _emailCtrl,
                    keyboardType: TextInputType.emailAddress,
                    textInputAction: TextInputAction.next,
                    autofillHints: const [AutofillHints.email],
                    decoration: const InputDecoration(
                      labelText: 'E-mail',
                      prefixIcon: Icon(Icons.email_outlined),
                      border: OutlineInputBorder(),
                    ),
                    validator: (v) {
                      if (v == null || v.trim().isEmpty) return 'Informe o e-mail';
                      if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v.trim())) {
                        return 'E-mail inválido';
                      }
                      return null;
                    },
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _senhaCtrl,
                    obscureText: _ocultar,
                    textInputAction: TextInputAction.done,
                    autofillHints: const [AutofillHints.password],
                    onFieldSubmitted: (_) => _carregando ? null : _entrar(),
                    decoration: InputDecoration(
                      labelText: 'Senha',
                      prefixIcon: const Icon(Icons.lock_outline),
                      border: const OutlineInputBorder(),
                      suffixIcon: IconButton(
                        icon: Icon(_ocultar
                            ? Icons.visibility
                            : Icons.visibility_off),
                        onPressed: () => setState(() => _ocultar = !_ocultar),
                      ),
                    ),
                    validator: (v) =>
                        (v == null || v.isEmpty) ? 'Informe a senha' : null,
                  ),
                  Align(
                    alignment: Alignment.centerRight,
                    child: TextButton(
                      onPressed: _esqueciSenha,
                      child: const Text('Esqueci minha senha'),
                    ),
                  ),
                  const SizedBox(height: 16),
                  SizedBox(
                    height: 50,
                    child: FilledButton(
                      onPressed: _carregando ? null : _entrar,
                      child: _carregando
                          ? const SizedBox(
                              height: 22,
                              width: 22,
                              child: CircularProgressIndicator(
                                  strokeWidth: 2, color: Colors.white))
                          : const Text('Entrar', style: TextStyle(fontSize: 16)),
                    ),
                  ),
                  const SizedBox(height: 24),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('Não tem conta?'),
                      TextButton(
                        onPressed: () {/* TODO: tela de cadastro */},
                        child: const Text('Cadastre-se'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }
}

// Provisória: será substituída pelo dashboard
class _HomeLogada extends StatelessWidget {
  const _HomeLogada();

  @override
  Widget build(BuildContext context) => Scaffold(
        appBar: AppBar(title: const Text('Início')),
        body: const Center(child: Text('Login realizado!')),
      );
}
