import 'package:cached_network_image/cached_network_image.dart';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/widgets/gradient_button.dart';
import '../../../shared/widgets/glass_card.dart';

class CartItem {
  final int id;
  final int productId;
  final String productName;
  final String? productImage;
  final int quantity;
  final double subtotal;

  const CartItem({
    required this.id,
    required this.productId,
    required this.productName,
    this.productImage,
    required this.quantity,
    required this.subtotal,
  });

  factory CartItem.fromJson(Map<String, dynamic> j) {
    final product = j['product'] as Map<String, dynamic>? ?? {};
    return CartItem(
      id:           j['id'],
      productId:    product['id'] ?? 0,
      productName:  product['name'] ?? '',
      productImage: product['primary_image'],
      quantity:     j['quantity'],
      subtotal:     double.tryParse(j['subtotal']?.toString() ?? '0') ?? 0,
    );
  }
}

final cartProvider = FutureProvider<List<CartItem>>((ref) async {
  final res = await ApiClient().dio.get('/cart/');
  final items = res.data['items'] as List? ?? [];
  return items.map((e) => CartItem.fromJson(e)).toList();
});

class CartScreen extends ConsumerStatefulWidget {
  const CartScreen({super.key});

  @override
  ConsumerState<CartScreen> createState() => _CartScreenState();
}

class _CartScreenState extends ConsumerState<CartScreen> {
  bool _checkingOut = false;

  Future<void> _checkout(List<CartItem> items) async {
    // Show shipping address dialog first
    final address = await _showAddressDialog();
    if (address == null) return;

    setState(() => _checkingOut = true);
    try {
      await ApiClient().dio.post('/orders/create/', data: {
        'shipping_address': address,
        'items': items.map((i) => {
          'product_id': i.productId,
          'quantity': i.quantity,
        }).toList(),
      });
      ref.invalidate(cartProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Order placed successfully!'), backgroundColor: AppColors.green),
        );
        context.go('/orders');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Checkout failed: $e'), backgroundColor: AppColors.red),
        );
      }
    } finally {
      if (mounted) setState(() => _checkingOut = false);
    }
  }

  Future<Map<String, String>?> _showAddressDialog() async {
    final nameCtrl    = TextEditingController();
    final addressCtrl = TextEditingController();
    final cityCtrl    = TextEditingController();
    final phoneCtrl   = TextEditingController();
    final formKey     = GlobalKey<FormState>();

    final result = await showModalBottomSheet<Map<String, String>>(
      context: context,
      isScrollControlled: true,
      backgroundColor: AppColors.bgCard,
      shape: const RoundedRectangleBorder(
        borderRadius: BorderRadius.vertical(top: Radius.circular(20)),
      ),
      builder: (_) => Padding(
        padding: EdgeInsets.only(
          bottom: MediaQuery.of(context).viewInsets.bottom + 20,
          top: 24, left: 20, right: 20,
        ),
        child: Form(
          key: formKey,
          child: Column(mainAxisSize: MainAxisSize.min, children: [
            Container(width: 40, height: 4, decoration: BoxDecoration(color: AppColors.glassBorder, borderRadius: BorderRadius.circular(2))),
            const SizedBox(height: 20),
            const Text('Shipping Address', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
            const SizedBox(height: 20),
            _field(nameCtrl,    'Full Name', Icons.person_outline,    'Required'),
            const SizedBox(height: 12),
            _field(phoneCtrl,   'Phone',     Icons.phone_outlined,    'Required',  keyboard: TextInputType.phone),
            const SizedBox(height: 12),
            _field(addressCtrl, 'Address',   Icons.location_on_outlined, 'Required'),
            const SizedBox(height: 12),
            _field(cityCtrl,    'City',      Icons.location_city_outlined, 'Required'),
            const SizedBox(height: 24),
            SizedBox(
              width: double.infinity,
              height: 52,
              child: DecoratedBox(
                decoration: BoxDecoration(
                  gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                  borderRadius: BorderRadius.circular(14),
                ),
                child: ElevatedButton(
                  style: ElevatedButton.styleFrom(
                    backgroundColor: Colors.transparent,
                    shadowColor: Colors.transparent,
                    shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(14)),
                  ),
                  onPressed: () {
                    if (formKey.currentState!.validate()) {
                      Navigator.pop(context, {
                        'full_name': nameCtrl.text.trim(),
                        'phone':     phoneCtrl.text.trim(),
                        'address':   addressCtrl.text.trim(),
                        'city':      cityCtrl.text.trim(),
                      });
                    }
                  },
                  child: const Text('Confirm Order', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 15)),
                ),
              ),
            ),
            const SizedBox(height: 8),
          ]),
        ),
      ),
    );

    nameCtrl.dispose(); addressCtrl.dispose(); cityCtrl.dispose(); phoneCtrl.dispose();
    return result;
  }

  Widget _field(TextEditingController ctrl, String hint, IconData icon, String errMsg,
      {TextInputType? keyboard}) =>
      TextFormField(
        controller: ctrl,
        keyboardType: keyboard,
        style: const TextStyle(color: Colors.white),
        decoration: InputDecoration(
          hintText: hint,
          prefixIcon: Icon(icon, color: AppColors.textMuted, size: 20),
        ),
        validator: (v) => (v == null || v.trim().isEmpty) ? errMsg : null,
      );

  Future<void> _remove(int cartItemId) async {
    try {
      await ApiClient().dio.delete('/cart/items/$cartItemId/');
      ref.invalidate(cartProvider);
    } catch (_) {}
  }

  @override
  Widget build(BuildContext context) {
    final cart = ref.watch(cartProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      appBar: AppBar(
        backgroundColor: AppColors.bg,
        elevation: 0,
        title: const Text('My Cart', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
      ),
      body: cart.when(
        loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
        error: (e, _) => Center(child: Text('$e', style: const TextStyle(color: AppColors.red))),
        data: (items) {
          if (items.isEmpty) {
            return Center(
              child: Column(mainAxisSize: MainAxisSize.min, children: [
                const Icon(Icons.shopping_cart_outlined, color: AppColors.textMuted, size: 80),
                const SizedBox(height: 16),
                const Text('Your cart is empty', style: TextStyle(color: AppColors.textSecondary, fontSize: 18)),
                const SizedBox(height: 20),
                GestureDetector(
                  onTap: () => context.go('/'),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 24, vertical: 12),
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: const Text('Shop Now', style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700)),
                  ),
                ),
              ]),
            );
          }

          final total = items.fold(0.0, (sum, i) => sum + i.subtotal);

          return Column(
            children: [
              Expanded(
                child: ListView.separated(
                  padding: const EdgeInsets.all(16),
                  itemCount: items.length,
                  separatorBuilder: (_, _) => const SizedBox(height: 10),
                  itemBuilder: (ctx, i) {
                    final item = items[i];
                    return GlassCard(
                      padding: const EdgeInsets.all(12),
                      child: Row(children: [
                        ClipRRect(
                          borderRadius: BorderRadius.circular(10),
                          child: SizedBox(
                            width: 70, height: 70,
                            child: item.productImage != null
                                ? CachedNetworkImage(imageUrl: item.productImage!, fit: BoxFit.cover,
                                    errorWidget: (_, _, _) => Container(color: AppColors.bgSurface,
                                        child: const Center(child: Text('👟', style: TextStyle(fontSize: 28)))))
                                : Container(color: AppColors.bgSurface,
                                    child: const Center(child: Text('👟', style: TextStyle(fontSize: 28)))),
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                            Text(item.productName,
                                style: const TextStyle(color: Colors.white, fontWeight: FontWeight.w600),
                                maxLines: 2, overflow: TextOverflow.ellipsis),
                            const SizedBox(height: 4),
                            Text('qty: ${item.quantity}',
                                style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                            const SizedBox(height: 4),
                            Text('৳${item.subtotal.toStringAsFixed(0)}',
                                style: const TextStyle(color: AppColors.indigo, fontWeight: FontWeight.w700)),
                          ]),
                        ),
                        IconButton(
                          icon: const Icon(Icons.delete_outline, color: AppColors.red, size: 20),
                          onPressed: () => _remove(item.id),
                        ),
                      ]),
                    );
                  },
                ),
              ),
              Container(
                padding: const EdgeInsets.all(20),
                decoration: const BoxDecoration(
                  color: AppColors.bgCard,
                  border: Border(top: BorderSide(color: AppColors.glassBorder)),
                ),
                child: Column(children: [
                  Row(
                    mainAxisAlignment: MainAxisAlignment.spaceBetween,
                    children: [
                      const Text('Total', style: TextStyle(color: AppColors.textSecondary, fontSize: 16)),
                      Text('৳${total.toStringAsFixed(0)}',
                          style: const TextStyle(color: Colors.white, fontSize: 20, fontWeight: FontWeight.w900)),
                    ],
                  ),
                  const SizedBox(height: 16),
                  GradientButton(
                    label: 'Place Order',
                    loading: _checkingOut,
                    onPressed: () => _checkout(items),
                  ),
                ]),
              ),
            ],
          );
        },
      ),
    );
  }
}
