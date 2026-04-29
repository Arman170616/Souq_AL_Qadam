import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/storage/secure_storage.dart';
import '../../../shared/models/user.dart';

class AuthState {
  final User? user;
  final bool loading;
  final String? error;

  const AuthState({this.user, this.loading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({User? user, bool? loading, String? error, bool clearUser = false}) {
    return AuthState(
      user: clearUser ? null : (user ?? this.user),
      loading: loading ?? this.loading,
      error: error,
    );
  }
}

class AuthNotifier extends StateNotifier<AuthState> {
  AuthNotifier() : super(const AuthState()) {
    _init();
  }

  Future<void> _init() async {
    state = state.copyWith(loading: true);
    final token = await SecureStorage.getAccessToken();
    if (token == null) {
      state = state.copyWith(loading: false);
      return;
    }
    try {
      final res = await ApiClient().dio.get('/auth/me/');
      state = AuthState(user: User.fromJson(res.data));
    } catch (_) {
      await SecureStorage.clear();
      state = const AuthState();
    }
  }

  Future<String?> login(String email, String password) async {
    state = state.copyWith(loading: true, error: null);
    try {
      final res = await ApiClient().dio.post('/auth/login/', data: {
        'email': email,
        'password': password,
      });
      await SecureStorage.saveTokens(
        res.data['access'],
        res.data['refresh'],
      );
      final profileRes = await ApiClient().dio.get('/auth/me/');
      state = AuthState(user: User.fromJson(profileRes.data));
      return null;
    } catch (e) {
      final msg = _parseError(e);
      state = state.copyWith(loading: false, error: msg);
      return msg;
    }
  }

  Future<String?> register({
    required String email,
    required String password,
    required String firstName,
    required String lastName,
    required String role,
  }) async {
    state = state.copyWith(loading: true, error: null);
    try {
      await ApiClient().dio.post('/auth/register/', data: {
        'email': email,
        'password': password,
        'first_name': firstName,
        'last_name': lastName,
        'role': role,
      });
      return await login(email, password);
    } catch (e) {
      final msg = _parseError(e);
      state = state.copyWith(loading: false, error: msg);
      return msg;
    }
  }

  Future<void> logout() async {
    try {
      final refresh = await SecureStorage.getRefreshToken();
      if (refresh != null) {
        await ApiClient().dio.post('/auth/logout/', data: {'refresh': refresh});
      }
    } catch (_) {}
    await SecureStorage.clear();
    state = const AuthState();
  }

  String _parseError(Object e) {
    try {
      final data = (e as dynamic).response?.data;
      if (data is Map) {
        final vals = data.values.first;
        if (vals is List) return vals.first.toString();
        return vals.toString();
      }
    } catch (_) {}
    return 'Something went wrong. Please try again.';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>(
  (_) => AuthNotifier(),
);
