import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../../core/api/api_client.dart';
import '../../../core/theme/app_colors.dart';
import '../../../shared/models/product.dart';
import '../../../shared/widgets/product_card.dart';
import '../../auth/providers/auth_provider.dart';

final featuredProductsProvider = FutureProvider<List<Product>>((ref) async {
  final res = await ApiClient().dio.get('/products/', queryParameters: {
    'is_featured': true,
    'page_size': 10,
  });
  final list = res.data['results'] as List? ?? [];
  return list.map((e) => Product.fromJson(e)).toList();
});

final newArrivalsProvider = FutureProvider<List<Product>>((ref) async {
  final res = await ApiClient().dio.get('/products/', queryParameters: {
    'ordering': '-created_at',
    'page_size': 10,
  });
  final list = res.data['results'] as List? ?? [];
  return list.map((e) => Product.fromJson(e)).toList();
});

class CustomerHomeScreen extends ConsumerWidget {
  const CustomerHomeScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final user     = ref.watch(authProvider).user;
    final featured = ref.watch(featuredProductsProvider);
    final newArrs  = ref.watch(newArrivalsProvider);

    return Scaffold(
      backgroundColor: AppColors.bg,
      body: SafeArea(
        child: CustomScrollView(
          slivers: [
            // App bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 16, 20, 0),
                child: Row(
                  children: [
                    // Logo
                    Image.asset('assets/images/logo.png', width: 36, height: 36, fit: BoxFit.contain),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(crossAxisAlignment: CrossAxisAlignment.start, children: [
                        Text(user != null ? 'Hello, ${user.firstName.isNotEmpty ? user.firstName : 'there'} 👋' : 'Welcome to BDShoe',
                            style: const TextStyle(color: AppColors.textMuted, fontSize: 12)),
                        const Text('Find your perfect pair',
                            style: TextStyle(color: Colors.white, fontSize: 17, fontWeight: FontWeight.w800)),
                      ]),
                    ),
                    if (user != null)
                      GestureDetector(
                        onTap: () => context.push('/cart'),
                        child: Container(
                          width: 44, height: 44,
                          decoration: BoxDecoration(
                            color: AppColors.bgCard,
                            borderRadius: BorderRadius.circular(12),
                            border: Border.all(color: AppColors.glassBorder),
                          ),
                          child: const Icon(Icons.shopping_cart_outlined, color: Colors.white, size: 22),
                        ),
                      )
                    else
                      GestureDetector(
                        onTap: () => context.push('/login'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                          decoration: BoxDecoration(
                            gradient: const LinearGradient(colors: AppColors.gradientPrimary),
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text('Sign In', style: TextStyle(color: Colors.white, fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      ),
                  ],
                ),
              ),
            ),
            // Search bar
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: GestureDetector(
                  onTap: () => context.push('/products'),
                  child: Container(
                    height: 48,
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    decoration: BoxDecoration(
                      color: AppColors.bgCard,
                      borderRadius: BorderRadius.circular(14),
                      border: Border.all(color: AppColors.glassBorder),
                    ),
                    child: const Row(children: [
                      Icon(Icons.search, color: AppColors.textMuted, size: 20),
                      SizedBox(width: 10),
                      Text('Search shoes...', style: TextStyle(color: AppColors.textMuted, fontSize: 14)),
                    ]),
                  ),
                ),
              ),
            ),
            // Hero banner
            SliverToBoxAdapter(
              child: Padding(
                padding: const EdgeInsets.fromLTRB(20, 20, 20, 0),
                child: Container(
                  height: 160,
                  decoration: BoxDecoration(
                    gradient: const LinearGradient(
                      colors: AppColors.gradientHero,
                      begin: Alignment.topLeft,
                      end: Alignment.bottomRight,
                    ),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  padding: const EdgeInsets.all(20),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      const Text('New Collection', style: TextStyle(color: Colors.white70, fontSize: 12)),
                      const SizedBox(height: 4),
                      const Text('Step into Style', style: TextStyle(color: Colors.white, fontSize: 22, fontWeight: FontWeight.w900)),
                      const SizedBox(height: 12),
                      GestureDetector(
                        onTap: () => context.push('/products'),
                        child: Container(
                          padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
                          decoration: BoxDecoration(
                            color: Colors.white,
                            borderRadius: BorderRadius.circular(10),
                          ),
                          child: const Text('Shop Now',
                              style: TextStyle(color: AppColors.indigo, fontSize: 12, fontWeight: FontWeight.w700)),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
            // Featured
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: Row(
                  mainAxisAlignment: MainAxisAlignment.spaceBetween,
                  children: [
                    Text('Featured', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
                  ],
                ),
              ),
            ),
            SliverToBoxAdapter(
              child: SizedBox(
                height: 240,
                child: featured.when(
                  loading: () => const Center(child: CircularProgressIndicator(color: AppColors.indigo)),
                  error: (_, _) => const Center(child: Text('Failed to load', style: TextStyle(color: AppColors.textMuted))),
                  data: (products) => ListView.builder(
                    scrollDirection: Axis.horizontal,
                    padding: const EdgeInsets.symmetric(horizontal: 20),
                    itemCount: products.length,
                    itemBuilder: (ctx, i) => SizedBox(
                      width: 160,
                      child: Padding(
                        padding: const EdgeInsets.only(right: 12),
                        child: ProductCard(
                          product: products[i],
                          onTap: () => context.push('/product/${products[i].slug}'),
                        ),
                      ),
                    ),
                  ),
                ),
              ),
            ),
            // New Arrivals
            const SliverToBoxAdapter(
              child: Padding(
                padding: EdgeInsets.fromLTRB(20, 28, 20, 12),
                child: Text('New Arrivals', style: TextStyle(color: Colors.white, fontSize: 18, fontWeight: FontWeight.w700)),
              ),
            ),
            newArrs.when(
              loading: () => const SliverToBoxAdapter(
                child: Center(child: CircularProgressIndicator(color: AppColors.indigo)),
              ),
              error: (_, _) => const SliverToBoxAdapter(
                child: Center(child: Text('Failed to load', style: TextStyle(color: AppColors.textMuted))),
              ),
              data: (products) => SliverPadding(
                padding: const EdgeInsets.symmetric(horizontal: 20),
                sliver: SliverGrid(
                  delegate: SliverChildBuilderDelegate(
                    (ctx, i) => ProductCard(
                      product: products[i],
                      onTap: () => context.push('/product/${products[i].slug}'),
                    ),
                    childCount: products.length,
                  ),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 2,
                    crossAxisSpacing: 12,
                    mainAxisSpacing: 12,
                    childAspectRatio: 0.65,
                  ),
                ),
              ),
            ),
            const SliverToBoxAdapter(child: SizedBox(height: 100)),
          ],
        ),
      ),
    );
  }
}
