import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class TokenStorage {
  static const _storage = FlutterSecureStorage();

  static Future<void> salvar(String jwt) =>
      _storage.write(key: 'jwt', value: jwt);

  static Future<String?> ler() => _storage.read(key: 'jwt');

  static Future<void> apagar() => _storage.delete(key: 'jwt');
}
