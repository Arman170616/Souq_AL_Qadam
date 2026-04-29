import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';

class _Vendor {
  final int id;
  final String shopName, email, status;
  const _Vendor({required this.id, required this.shopName, required this.email, required this.status});

  factory _Vendor.fromJson(Map<String, dynamic> j) => _Vendor(
    id:       j['id'],
    shopName: j['shop_name'] ?? '',
    email:    (j['user'] as Map<String, dynamic>?)?['email'] ?? '',
    status:   j['status'] ?? '',
  );
}

final adminVendorsProvider = FutureProvider<List<_Vendor>>((ref) async {
  final res = await ApiClient().dio.get('/vendors/admin/list/');
  final list = res.data['results'] as List? ?? res.data as List? ?? [];
  return list.map((e) => _Vendor.fromJson(e)).toList();
});

class AdminVendorsScreen extends ConsumerStatefulWidget {
  const AdminVendorsScreen({super.key});

  @override
  ConsumerState<AdminVendorsScreen> createState() => _AdminVendorsScreenState();
}

class _AdminVendorsScreenState extends ConsumerState<AdminVendorsScreen> {
  Future<void> _updateStatus(int id, String status) async {
    try {
      await ApiClient().dio.patch('/vendors/admin/$id/status/', data: {'status': status});
      ref.invalidate(adminVendorsProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(
            content: Text('Vendor ${status == 'approved' ? 'approved' : 'rejected'}'),
            backgroundColor: status == 'approved' ? AppColors.green : AppColors.red,
          ),
        );
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Failed: $e'), backgroundColor: AppColors.red),
        );
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final vendors = ref.watch(adminVendorsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('Vendors', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh, color: AppColors.textMuted),
            onPressed: () => ref.invalidate(adminVendorsProvider),
          ),
        ],
      ),
      body: vendors.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (list) {
          if (list.isEmpty) {
            return const Center(child: Text('No vendors', style: TextStyle(color: AppColors.textMuted)));
          }
          return ListView.separated(
            padding: const EdgeInsets.all(16),
            itemCount: list.length,
            separatorBuilder: (_, _) => const SizedBox(height: 8),
            itemBuilder: (ctx, i) {
              final v = list[i];
              Color statusColor;
              switch (v.status) {
                case 'approved': statusColor = AppColors.green; break;
                case 'rejected': statusColor = AppColors.red; break;
                default:         statusColor = AppColors.amber;
              }
              return GlassCard(
                child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                  Row(children: [
                    Container(
                      width: 44, height: 44,
                      decoration: BoxDecoration(
                        color: AppColors.amber.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(12),
                      ),
                      child: const Icon(Icons.store_outlined, color: AppColors.amber, size: 22),
                    ),
                    const SizedBox(width: 12),
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      Text(v.shopName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
                      Text(v.email, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                      decoration: BoxDecoration(
                        color: statusColor.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(6),
                      ),
                      child: Text(v.status.toUpperCase(),
                          style: TextStyle(color: statusColor, fontSize: 9, fontWeight: FontWeight.w700)),
                    ),
                  ]),
                  if (v.status == 'pending') ...[
                    const SizedBox(height: 12),
                    Row(children: [
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _updateStatus(v.id, 'approved'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.green.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Icon(Icons.check_circle_outline, color: AppColors.green, size: 14),
                              SizedBox(width: 4),
                              Text('Approve', style: TextStyle(color: AppColors.green, fontSize: 12, fontWeight: FontWeight.w600)),
                            ]),
                          ),
                        ),
                      ),
                      const SizedBox(width: 8),
                      Expanded(
                        child: GestureDetector(
                          onTap: () => _updateStatus(v.id, 'rejected'),
                          child: Container(
                            padding: const EdgeInsets.symmetric(vertical: 8),
                            decoration: BoxDecoration(
                              color: AppColors.red.withValues(alpha: 0.15),
                              borderRadius: BorderRadius.circular(8),
                            ),
                            child: const Row(mainAxisAlignment: MainAxisAlignment.center, children: [
                              Icon(Icons.cancel_outlined, color: AppColors.red, size: 14),
                              SizedBox(width: 4),
                              Text('Reject', style: TextStyle(color: AppColors.red, fontSize: 12, fontWeight: FontWeight.w600)),
                            ]),
                          ),
                        ),
                      ),
                    ]),
                  ],
                ]),
              );
            },
          );
        },
      ),
    );
  }
}
