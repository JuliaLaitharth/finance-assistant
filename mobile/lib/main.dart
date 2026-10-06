import 'dart:async';

import 'package:app_links/app_links.dart';
import 'package:flutter/material.dart';

import 'screens/login_page.dart';

final navKey = GlobalKey<NavigatorState>();

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  runApp(const MyApp());
}

class MyApp extends StatefulWidget {
  const MyApp({super.key});

  @override
  State<MyApp> createState() => _MyAppState();
}

class _MyAppState extends State<MyApp> {
  final _appLinks = AppLinks();
  StreamSubscription<Uri>? _sub;

  @override
  void initState() {
    super.initState();
    // Recebe o link inicial (app fechado) e os seguintes (app aberto)
    _sub = _appLinks.uriLinkStream.listen((uri) {
      debugPrint('DEEP LINK: $uri');
      _tratarLink(uri);
    });
  }

  void _tratarLink(Uri uri) {
    if (uri.host == 'redefinir-senha') {
      final token = uri.queryParameters['token'];
      if (token == null || token.isEmpty) return;
      navKey.currentState?.push(
        MaterialPageRoute(builder: (_) => RedefinirSenhaPage(token: token)),
      );
    }
  }

  @override
  void dispose() {
    _sub?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      navigatorKey: navKey,
      debugShowCheckedModeBanner: false,
      title: 'Finanças App',
      theme: ThemeData(
        colorScheme: .fromSeed(seedColor: Colors.deepPurple),
      ),
      home: const LoginPage(),
    );
  }
}

// Provisória: será substituída pela tela real de redefinição
class RedefinirSenhaPage extends StatelessWidget {
  const RedefinirSenhaPage({super.key, required this.token});

  final String token;

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Redefinir senha')),
      body: Center(child: Text('Token recebido: $token')),
    );
  }
}
