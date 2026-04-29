import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';

class _Customer {
  final int id;
  final String email, firstName, lastName;
  final String createdAt;

  const _Customer({required this.id, required this.email, required this.firstName, required this.lastName, required this.createdAt});

  factory _Customer.fromJson(Map<String, dynamic> j) => _Customer(
    id:        j['id'],
    email:     j['email'] ?? '',
    firstName: j['first_name'] ?? '',
    lastName:  j['last_name'] ?? '',
    createdAt: j['date_joined'] ?? j['created_at'] ?? '',
  );

  String get displayName {
    final name = '$firstName $lastName'.trim();
    return name.isEmpty ? email : name;
  }
}

final adminCustomersProvider = FutureProvider<List<_Customer>>((ref) async {
  final res = await ApiClient().dio.get('/auth/admin/customers/');
  final list = res.data['results'] as List? ?? res.data as List? ?? [];
  return list.map((e) => _Customer.fromJson(e)).toList();
});

class AdminUsersScreen extends ConsumerWidget {
  const AdminUsersScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final customers = ref.watch(adminCustomersProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('Customers', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textMuted),
            onPressed: () => ref.invalidate(adminCustomersProvider),
          ),
        ],
      ),
      body: customers.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            const Icon(Icons.error_outline, color: AppColors.red, size: 48),
            const SizedBox(height: 12),
            Text('$e', style: const TextStyle(color: AppColors.textMuted), textAlign: TextAlign.center),
            const SizedBox(height: 16),
            GestureDetector(
              onTap: () => ref.invalidate(adminCustomersProvider),
              child: Container(
                padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                decoration: BoxDecoration(color: AppColors.indigo.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
                child: const Text('Retry', style: TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w700)),
              ),
            ),
          ]),
        ),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('No customers yet', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) => _CustomerTile(customer: list[i]),
          );
        },
      ),
    );
  }
}

class _CustomerTile extends StatelessWidget {
  final _Customer customer;
  const _CustomerTile({required this.customer});

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) { return ''; }
  }

  @override
  Widget build(BuildContext context) => GlassCard(
    padding: const EdgeInsets.all(12),
    child: Row(children: [
      Container(
        width: 44, height: 44,
        decoration: BoxDecoration(
          color: AppColors.indigo.withValues(alpha: 0.15),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Center(
          child: Text(
            customer.displayName[0].toUpperCase(),
            style: const TextStyle(color: AppColors.indigo, fontSize: 18, fontWeight: FontWeight.w800),
          ),
        ),
      ),
      const SizedBox(width: 12),
      Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(customer.displayName,
            style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
            maxLines: 1, overflow: TextOverflow.ellipsis),
        Text(customer.email,
            style: const TextStyle(color: AppColors.textMuted, fontSize: 11),
            maxLines: 1, overflow: TextOverflow.ellipsis),
      ])),
      Text(_fmtDate(customer.createdAt),
          style: const TextStyle(color: AppColors.textMuted, fontSize: 10)),
    ]),
  );
}
