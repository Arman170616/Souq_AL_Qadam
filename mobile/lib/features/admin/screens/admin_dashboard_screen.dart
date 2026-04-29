import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/glass_card.dart';
import '../../auth/providers/auth_provider.dart';

// ── Providers ─────────────────────────────────────────────────────────────

class _Vendor {
  final int id;
  final String shopName;
  final String email;
  final String status;
  final String createdAt;
  const _Vendor({required this.id, required this.shopName, required this.email, required this.status, required this.createdAt});

  factory _Vendor.fromJson(Map<String, dynamic> j) => _Vendor(
    id:        j['id'],
    shopName:  j['shop_name'] ?? '',
    email:     (j['user'] as Map<String, dynamic>?)?['email'] ?? '',
    status:    j['status'] ?? '',
    createdAt: j['created_at'] ?? '',
  );
}

class _Order {
  final String orderNumber;
  final String total;
  final String status;
  final String createdAt;
  const _Order({required this.orderNumber, required this.total, required this.status, required this.createdAt});

  factory _Order.fromJson(Map<String, dynamic> j) => _Order(
    orderNumber: j['order_number'] ?? '',
    total:       j['total']?.toString() ?? '0',
    status:      j['status'] ?? '',
    createdAt:   j['created_at'] ?? '',
  );
}

class _AdminData {
  final List<_Vendor> pendingVendors;
  final List<_Vendor> allVendors;
  final List<_Order>  recentOrders;
  final int           totalOrders;
  const _AdminData({
    required this.pendingVendors,
    required this.allVendors,
    required this.recentOrders,
    required this.totalOrders,
  });
}

final adminDataProvider = FutureProvider<_AdminData>((ref) async {
  final results = await Future.wait([
    ApiClient().dio.get('/vendors/admin/list/', queryParameters: {'status': 'pending'}),
    ApiClient().dio.get('/vendors/admin/list/'),
    ApiClient().dio.get('/orders/admin/orders/', queryParameters: {'ordering': '-created_at'}),
  ]);

  final pendingVendors = ((results[0].data['results'] ?? results[0].data) as List)
      .map((e) => _Vendor.fromJson(e)).toList();
  final allVendors = ((results[1].data['results'] ?? results[1].data) as List)
      .map((e) => _Vendor.fromJson(e)).toList();
  final orders = ((results[2].data['results'] ?? results[2].data) as List)
      .map((e) => _Order.fromJson(e)).toList();
  final totalOrders = results[2].data['count'] as int? ?? orders.length;

  return _AdminData(
    pendingVendors: pendingVendors,
    allVendors:     allVendors,
    recentOrders:   orders.take(5).toList(),
    totalOrders:    totalOrders,
  );
});

// ── Screen ─────────────────────────────────────────────────────────────────

class AdminDashboardScreen extends ConsumerWidget {
  const AdminDashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user = ref.watch(authProvider).user;
    final data = ref.watch(adminDataProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: data.when(
          loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
          error: (e, _) => Center(
            child: Padding(
              padding: const EdgeInsets.all(24),
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.error_outline, color: AppColors.red, size: 48),
                const SizedBox(height: 12),
                Text('$e', style: const TextStyle(color: AppColors.textMuted), textAlign: TextAlign.center),
                const SizedBox(height: 16),
                GestureDetector(
                  onTap: () => ref.invalidate(adminDataProvider),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 10),
                    decoration: BoxDecoration(
                      color: AppColors.indigo.withValues(alpha: 0.15),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: const Text('Retry', style: TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w700)),
                  ),
                ),
              ]),
            ),
          ),
          data: (d) {
            final activeVendors = d.allVendors.where((v) => v.status == 'approved').length;
            final revenue = d.recentOrders.fold(0.0, (s, o) => s + (double.tryParse(o.total) ?? 0));

            return RefreshIndicator(
              color: AppColors.indigo,
              onRefresh: () async => ref.invalidate(adminDataProvider),
              child: ListView(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 40),
                children: [
                  // Header
                  Row(children: [
                    Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                      const Text('Admin Dashboard', style: TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                      Text('Welcome, ${user?.firstName ?? 'Admin'}',
                          style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                    ])),
                    Container(
                      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                      decoration: BoxDecoration(
                        color: AppColors.red.withValues(alpha: 0.15),
                        borderRadius: BorderRadius.circular(8),
                      ),
                      child: const Text('ADMIN', style: TextStyle(color: AppColors.red, fontSize: 10, fontWeight: FontWeight.w800)),
                    ),
                  ]),
                  const SizedBox(height: 20),

                  // Stats grid (2×2 matching website)
                  Row(children: [
                    Expanded(child: _StatCard(
                      label: 'TOTAL ORDERS',
                      value: '${d.totalOrders}',
                      icon: Icons.shopping_bag_outlined,
                      gradientColors: [const Color(0x33EC4899), const Color(0x33F43F5E)],
                      iconColor: AppColors.pink,
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: _StatCard(
                      label: 'ACTIVE VENDORS',
                      value: '$activeVendors',
                      icon: Icons.store_outlined,
                      gradientColors: [const Color(0x33F59E0B), const Color(0x33F97316)],
                      iconColor: AppColors.amber,
                    )),
                  ]),
                  const SizedBox(height: 12),
                  Row(children: [
                    Expanded(child: _StatCard(
                      label: 'PENDING VENDORS',
                      value: '${d.pendingVendors.length}',
                      icon: Icons.pending_outlined,
                      gradientColors: [const Color(0x336366F1), const Color(0x338B5CF6)],
                      iconColor: AppColors.indigo,
                    )),
                    const SizedBox(width: 12),
                    Expanded(child: _StatCard(
                      label: 'REVENUE',
                      value: 'BDT ${_fmt(revenue)}',
                      icon: Icons.monetization_on_outlined,
                      gradientColors: [const Color(0x3310B981), const Color(0x3334D399)],
                      iconColor: AppColors.green,
                    )),
                  ]),
                  const SizedBox(height: 20),

                  // Pending Vendor Approvals
                  _SectionHeader(
                    icon: Icons.store_outlined,
                    iconColor: AppColors.amber,
                    title: 'Pending Vendor Approvals',
                    badge: d.pendingVendors.isNotEmpty ? '${d.pendingVendors.length}' : null,
                  ),
                  const SizedBox(height: 10),
                  GlassCard(
                    child: d.pendingVendors.isEmpty
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 20),
                              child: Text('No pending approvals', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                            ),
                          )
                        : Column(
                            children: d.pendingVendors.map((v) => _VendorApprovalTile(
                              vendor: v,
                              onApprove: () => _updateVendorStatus(ref, v.id, 'approved'),
                              onReject:  () => _updateVendorStatus(ref, v.id, 'rejected'),
                            )).toList(),
                          ),
                  ),
                  const SizedBox(height: 20),

                  // Recent Orders
                  const _SectionHeader(
                    icon: Icons.shopping_bag_outlined,
                    iconColor: AppColors.indigo,
                    title: 'Recent Orders',
                  ),
                  const SizedBox(height: 10),
                  GlassCard(
                    child: d.recentOrders.isEmpty
                        ? const Center(
                            child: Padding(
                              padding: EdgeInsets.symmetric(vertical: 20),
                              child: Text('No orders yet', style: TextStyle(color: AppColors.textMuted, fontSize: 13)),
                            ),
                          )
                        : Column(
                            children: d.recentOrders.map((o) => _OrderTile(order: o)).toList(),
                          ),
                  ),
                  const SizedBox(height: 20),

                  // Quick nav
                  const _SectionHeader(icon: Icons.apps_outlined, iconColor: AppColors.purple, title: 'Management'),
                  const SizedBox(height: 10),
                  _NavTile(Icons.store_outlined,          'Vendors',  AppColors.amber,  () => context.push('/admin/vendors')),
                  const SizedBox(height: 8),
                  _NavTile(Icons.inventory_2_outlined,    'Products', AppColors.pink,   () => context.push('/admin/products')),
                  const SizedBox(height: 8),
                  _NavTile(Icons.receipt_long_outlined,   'Orders',   AppColors.green,  () => context.push('/admin/orders')),
                  const SizedBox(height: 8),
                  _NavTile(Icons.people_outline,          'Customers', AppColors.indigo, () => context.push('/admin/customers')),
                ],
              ),
            );
          },
        ),
      ),
    );
  }

  Future<void> _updateVendorStatus(WidgetRef ref, int vendorId, String status) async {
    try {
      await ApiClient().dio.patch('/vendors/admin/$vendorId/status/', data: {'status': status});
      ref.invalidate(adminDataProvider);
    } catch (_) {}
  }

  static String _fmt(double v) {
    if (v >= 1000) return '${(v / 1000).toStringAsFixed(1)}K';
    return v.toStringAsFixed(0);
  }
}

// ── Sub-widgets ────────────────────────────────────────────────────────────

class _StatCard extends StatelessWidget {
  final String label, value;
  final IconData icon;
  final List<Color> gradientColors;
  final Color iconColor;

  const _StatCard({
    required this.label, required this.value, required this.icon,
    required this.gradientColors, required this.iconColor,
  });

  @override
  Widget build(BuildContext context) => Container(
    padding: const EdgeInsets.all(16),
    decoration: BoxDecoration(
      gradient: LinearGradient(colors: gradientColors, begin: Alignment.topLeft, end: Alignment.bottomRight),
      color: AppColors.bgCard,
      borderRadius: BorderRadius.circular(16),
      border: Border.all(color: AppColors.glassBorder),
    ),
    child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
      Row(mainAxisAlignment: MainAxisAlignment.spaceBetween, children: [
        Expanded(
          child: Text(label,
              style: TextStyle(color: AppColors.textMuted.withValues(alpha: 0.8), fontSize: 9, fontWeight: FontWeight.w700, letterSpacing: 0.5),
              maxLines: 1, overflow: TextOverflow.ellipsis),
        ),
        Icon(icon, color: iconColor, size: 16),
      ]),
      const SizedBox(height: 8),
      Text(value, style: const TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w900)),
    ]),
  );
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final Color iconColor;
  final String title;
  final String? badge;

  const _SectionHeader({required this.icon, required this.iconColor, required this.title, this.badge});

  @override
  Widget build(BuildContext context) => Row(children: [
    Icon(icon, color: iconColor, size: 16),
    const SizedBox(width: 6),
    Text(title, style: const TextStyle(color: Colors.white, fontSize: 15, fontWeight: FontWeight.w700)),
    if (badge != null) ...[
      const SizedBox(width: 8),
      Container(
        padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
        decoration: BoxDecoration(color: AppColors.amber.withValues(alpha: 0.2), borderRadius: BorderRadius.circular(10)),
        child: Text(badge!, style: const TextStyle(color: AppColors.amber, fontSize: 11, fontWeight: FontWeight.w700)),
      ),
    ],
  ]);
}

class _VendorApprovalTile extends StatelessWidget {
  final _Vendor vendor;
  final VoidCallback onApprove, onReject;

  const _VendorApprovalTile({required this.vendor, required this.onApprove, required this.onReject});

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 10),
    child: Container(
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
        Text(vendor.shopName, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13)),
        Text(vendor.email, style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        const SizedBox(height: 10),
        Row(children: [
          Expanded(
            child: GestureDetector(
              onTap: onApprove,
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
              onTap: onReject,
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
      ]),
    ),
  );
}

class _OrderTile extends StatelessWidget {
  final _Order order;
  const _OrderTile({required this.order});

  Color _statusColor(String s) {
    switch (s.toLowerCase()) {
      case 'delivered':  return AppColors.green;
      case 'cancelled':  return AppColors.red;
      case 'shipped':    return AppColors.green;
      case 'processing': return AppColors.purple;
      case 'confirmed':  return AppColors.purple;
      default:           return AppColors.amber;
    }
  }

  String _fmtDate(String iso) {
    try {
      final d = DateTime.parse(iso);
      return '${d.day}/${d.month}/${d.year}';
    } catch (_) { return iso; }
  }

  @override
  Widget build(BuildContext context) => Padding(
    padding: const EdgeInsets.only(bottom: 8),
    child: Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
      decoration: BoxDecoration(
        color: Colors.white.withValues(alpha: 0.04),
        borderRadius: BorderRadius.circular(12),
      ),
      child: Row(children: [
        Expanded(child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
          Text(order.orderNumber,
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600, fontSize: 13, fontFamily: 'monospace')),
          Text(_fmtDate(order.createdAt),
              style: const TextStyle(color: AppColors.textMuted, fontSize: 11)),
        ])),
        Column(crossAxisAlignment: CrossAxisAlignment.end, children: [
          Text('BDT ${double.tryParse(order.total)?.toStringAsFixed(0) ?? order.total}',
              style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 13)),
          const SizedBox(height: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
            decoration: BoxDecoration(
              color: _statusColor(order.status).withValues(alpha: 0.15),
              borderRadius: BorderRadius.circular(6),
            ),
            child: Text(order.status,
                style: TextStyle(color: _statusColor(order.status), fontSize: 9, fontWeight: FontWeight.w700)),
          ),
        ]),
      ]),
    ),
  );
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final Color color;
  final VoidCallback onTap;

  const _NavTile(this.icon, this.title, this.color, this.onTap);

  @override
  Widget build(BuildContext context) => GlassCard(
    onTap: onTap,
    padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
    child: Row(children: [
      Container(
        width: 36, height: 36,
        decoration: BoxDecoration(color: color.withValues(alpha: 0.15), borderRadius: BorderRadius.circular(10)),
        child: Icon(icon, color: color, size: 18),
      ),
      const SizedBox(width: 12),
      Text(title, style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600)),
      const Spacer(),
      const Icon(Icons.arrow_forward_ios, color: AppColors.textMuted, size: 13),
    ]),
  );
}
