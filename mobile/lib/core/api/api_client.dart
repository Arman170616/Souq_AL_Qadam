import 'package:dio/dio.dart';
import '../storage/secure_storage.dart';

const String kBaseUrl = 'https://bdshoe.com/api/v1';

class ApiClient {
  static final ApiClient _instance = ApiClient._internal();
  factory ApiClient() => _instance;

  late final Dio dio;

  ApiClient._internal() {
    dio = Dio(BaseOptions(
      baseUrl: kBaseUrl,
      connectTimeout: const Duration(seconds: 15),
      receiveTimeout: const Duration(seconds: 15),
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await SecureStorage.getAccessToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          try {
            final refresh = await SecureStorage.getRefreshToken();
            if (refresh == null) return handler.next(error);
            final res = await Dio().post('$kBaseUrl/auth/token/refresh/',
                data: {'refresh': refresh});
            final newAccess = res.data['access'] as String;
            await SecureStorage.saveTokens(newAccess, refresh);
            // Retry original request
            error.requestOptions.headers['Authorization'] = 'Bearer $newAccess';
            final retry = await dio.fetch(error.requestOptions);
            return handler.resolve(retry);
          } catch (_) {
            await SecureStorage.clear();
          }
        }
        handler.next(error);
      },
    ));
  }
}

final api = ApiClient().dio;
