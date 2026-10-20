import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:http/http.dart' as http;
import 'package:seu_app/pages/pluggy_connect_page.dart';

const api = 'http://localhost:3000'; // Android emulador: http://10.0.2.2:3000

Future<void> conectarBanco(BuildContext context, String jwt) async {
  final res = await http.post(
    Uri.parse('$api/pluggy/connect-token'),
    headers: {'Authorization': 'Bearer $jwt'},
  );
  final connectToken = jsonDecode(res.body)['accessToken'];

  if (!context.mounted) return;

  final itemId = await Navigator.push<String>(
    context,
    MaterialPageRoute(
        builder: (_) => PluggyConnectPage(connectToken: connectToken)),
  );

  if (itemId != null) {
    await http.post(
      Uri.parse('$api/pluggy/items'),
      headers: {
        'Authorization': 'Bearer $jwt',
        'Content-Type': 'application/json',
      },
      body: jsonEncode({'itemId': itemId}),
    );
  }
}
