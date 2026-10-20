import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PluggyConnectPage extends StatefulWidget {
  final String connectToken;
  const PluggyConnectPage({super.key, required this.connectToken});

  @override
  State<PluggyConnectPage> createState() => _PluggyConnectPageState();
}

class _PluggyConnectPageState extends State<PluggyConnectPage> {
  late final WebViewController _controller;

  String _html(String token) => '''
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <script src="https://cdn.pluggy.ai/pluggy-connect/v2.8.2/pluggy-connect.js"></script>
</head>
<body>
<script>
  const send = (type, data) =>
    PluggyChannel.postMessage(JSON.stringify({ type, data }));

  new PluggyConnect({
    connectToken: "$token",
    includeSandbox: true,
    onSuccess: (data) => send("success", data),
    onError: (err) => send("error", err),
    onClose: () => send("close", null),
  }).init();
</script>
</body>
</html>
''';

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel('PluggyChannel', onMessageReceived: (msg) {
        final event = jsonDecode(msg.message);
        switch (event['type']) {
          case 'success':
            final itemId = event['data']['item']['id'] as String;
            Navigator.pop(context, itemId);
            break;
          case 'error':
            debugPrint('Pluggy erro: ${event['data']}');
            break;
          case 'close':
            Navigator.pop(context);
            break;
        }
      })
      ..loadHtmlString(_html(widget.connectToken),
          baseUrl: 'https://connect.pluggy.ai');
  }

  @override
  Widget build(BuildContext context) =>
      Scaffold(body: SafeArea(child: WebViewWidget(controller: _controller)));
}
