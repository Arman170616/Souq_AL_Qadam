import uuid
from datetime import date
from decimal import Decimal
from django.db import models
from django.db.models import Sum, Count, Avg, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone

from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from django_filters.rest_framework import DjangoFilterBackend
from config.throttles import OrderCreateThrottle

from apps.products.models import Product, ProductVariant
from apps.vendors.models import Vendor
from .models import Order, OrderItem
from .serializers import (
    OrderCreateSerializer, OrderListSerializer,
    OrderDetailSerializer, OrderStatusSerializer,
)

FREE_SHIPPING_THRESHOLD = Decimal('2000')
SHIPPING_COST = Decimal('60')
COUPON_CODES = {'BDSHOE10': Decimal('0.10')}


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsVendorUser(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        return request.user.role == 'vendor' and hasattr(request.user, 'vendor_profile')


class OrderListCreateView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    filter_backends = [filters.OrderingFilter]
    ordering_fields = ['created_at', 'total', 'status']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).prefetch_related('items')


class OrderCreateView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    throttle_classes = [OrderCreateThrottle]

    def post(self, request):
        serializer = OrderCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        subtotal = Decimal('0')
        order_items = []

        for item_data in data['items']:
            try:
                product = Product.objects.get(pk=item_data['product_id'], is_active=True)
            except Product.DoesNotExist:
                return Response({'detail': f"Product {item_data['product_id']} not found."}, status=status.HTTP_400_BAD_REQUEST)

            variant = None
            if item_data.get('variant_id'):
                try:
                    variant = ProductVariant.objects.get(pk=item_data['variant_id'], product=product)
                except ProductVariant.DoesNotExist:
                    return Response({'detail': f"Variant {item_data['variant_id']} not found."}, status=status.HTTP_400_BAD_REQUEST)

            unit_price = product.effective_price + (variant.price_adjustment if variant else Decimal('0'))
            qty = item_data['quantity']

            # Stock check
            available = variant.stock if variant else product.stock
            if available < qty:
                return Response(
                    {'detail': f'"{product.name}" only has {available} unit(s) in stock.'},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            subtotal += unit_price * qty
            order_items.append({
                'product': product,
                'variant': variant,
                'product_name': product.name,
                'quantity': qty,
                'unit_price': unit_price,
                'vendor': product.vendor,
            })

        shipping_cost = Decimal('0') if subtotal >= FREE_SHIPPING_THRESHOLD else SHIPPING_COST

        discount = Decimal('0')
        coupon = data.get('coupon_code', '').upper()
        if coupon in COUPON_CODES:
            discount = subtotal * COUPON_CODES[coupon]

        total = subtotal + shipping_cost - discount
        order_number = f'BD{uuid.uuid4().hex[:8].upper()}'

        order = Order.objects.create(
            customer=request.user,
            order_number=order_number,
            subtotal=subtotal,
            shipping_cost=shipping_cost,
            discount=discount,
            total=total,
            shipping_address=data['shipping_address'],
            notes=data.get('notes', ''),
        )

        vendor_sales: dict = {}
        for item in order_items:
            commission = item['unit_price'] * item['quantity'] * (item['vendor'].commission_rate / 100)
            OrderItem.objects.create(
                order=order,
                vendor=item['vendor'],
                product=item['product'],
                variant=item['variant'],
                product_name=item['product_name'],
                quantity=item['quantity'],
                unit_price=item['unit_price'],
                vendor_commission=commission,
            )
            vid = item['vendor'].id
            vendor_sales[vid] = vendor_sales.get(vid, 0) + item['quantity']

            # Decrement stock
            qty = item['quantity']
            Product.objects.filter(pk=item['product'].pk).update(
                stock=models.F('stock') - qty
            )
            if item['variant']:
                ProductVariant.objects.filter(pk=item['variant'].pk).update(
                    stock=models.F('stock') - qty
                )

        # Increment total_sales for each vendor
        for vendor_id, qty in vendor_sales.items():
            Vendor.objects.filter(id=vendor_id).update(total_sales=models.F('total_sales') + qty)

        return Response(OrderDetailSerializer(order).data, status=status.HTTP_201_CREATED)


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = OrderDetailSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(customer=self.request.user).prefetch_related('items__product', 'items__vendor')

    def get_object(self):
        order_number = self.kwargs.get('order_number')
        try:
            return self.get_queryset().get(order_number=order_number)
        except Order.DoesNotExist:
            from rest_framework.exceptions import NotFound
            raise NotFound('Order not found.')


# Vendor orders
class VendorOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsVendorUser]
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    ordering = ['-created_at']

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Order.objects.all().prefetch_related('items')
        if not hasattr(user, 'vendor_profile'):
            return Order.objects.none()
        order_ids = OrderItem.objects.filter(vendor=user.vendor_profile).values_list('order_id', flat=True).distinct()
        return Order.objects.filter(id__in=order_ids).prefetch_related('items')


class VendorOrderStatusView(APIView):
    permission_classes = [IsVendorUser]

    def patch(self, request, order_number):
        try:
            order = Order.objects.get(order_number=order_number)
        except Order.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        # Verify vendor has items in this order
        if request.user.role != 'admin':
            if not hasattr(request.user, 'vendor_profile') or not order.items.filter(vendor=request.user.vendor_profile).exists():
                return Response({'detail': 'Not authorized.'}, status=status.HTTP_403_FORBIDDEN)

        serializer = OrderStatusSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        order.status = serializer.validated_data['status']
        order.save(update_fields=['status'])
        return Response(OrderDetailSerializer(order).data)


# Admin orders
class AdminOrderListView(generics.ListAPIView):
    serializer_class = OrderListSerializer
    permission_classes = [IsAdminUser]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['status']
    search_fields = ['order_number', 'customer__email']
    ordering = ['-created_at']

    def get_queryset(self):
        return Order.objects.all().select_related('customer').prefetch_related('items')


# Admin analytics
class AdminAnalyticsView(APIView):
    permission_classes = [IsAdminUser]

    def get(self, request):
        from apps.users.models import User

        # Monthly revenue & orders (last 12 months)
        monthly = (
            Order.objects
            .annotate(month=TruncMonth('created_at'))
            .values('month')
            .annotate(revenue=Sum('total'), commission=Sum('total') * Decimal('0.10'), orders=Count('id'))
            .order_by('month')
        )
        monthly_data = [
            {
                'month': m['month'].strftime('%b %Y'),
                'revenue': float(m['revenue'] or 0),
                'commission': float((m['revenue'] or 0) * Decimal('0.10')),
                'orders': m['orders'],
            }
            for m in monthly
        ]

        # Summary stats
        total_revenue = Order.objects.aggregate(t=Sum('total'))['t'] or Decimal('0')
        total_orders = Order.objects.count()
        delivered_revenue = Order.objects.filter(status='delivered').aggregate(t=Sum('total'))['t'] or Decimal('0')

        # Top vendors by revenue
        top_vendors = (
            OrderItem.objects
            .values('vendor__id', 'vendor__shop_name')
            .annotate(
                revenue=Sum('total_price'),
                orders=Count('order', distinct=True),
            )
            .order_by('-revenue')[:5]
        )
        top_vendors_data = [
            {
                'name': v['vendor__shop_name'],
                'revenue': float(v['revenue'] or 0),
                'orders': v['orders'],
                'commission': float((v['revenue'] or 0) * Decimal('0.10')),
            }
            for v in top_vendors
        ]

        # Category breakdown
        from apps.products.models import Category
        category_totals = (
            OrderItem.objects
            .values('product__category__name')
            .annotate(orders=Count('id'))
            .order_by('-orders')
        )
        total_items = sum(c['orders'] for c in category_totals) or 1
        category_data = [
            {
                'name': c['product__category__name'] or 'Uncategorised',
                'value': round(c['orders'] / total_items * 100, 1),
                'orders': c['orders'],
            }
            for c in category_totals
        ]

        # Counts
        active_vendors = Vendor.objects.filter(status='approved').count()
        pending_vendors = Vendor.objects.filter(status='pending').count()
        total_customers = User.objects.filter(role='customer').count()
        total_products = Product.objects.filter(is_active=True).count()

        # Monthly breakdown per vendor/shop
        vendor_monthly_qs = (
            OrderItem.objects
            .annotate(month=TruncMonth('order__created_at'))
            .values('month', 'vendor__id', 'vendor__shop_name')
            .annotate(revenue=Sum('total_price'), orders=Count('order', distinct=True))
            .order_by('month', '-revenue')
        )
        # Build a list of {month, vendors:[{name, revenue, orders}]}
        vm_by_month: dict = {}
        for row in vendor_monthly_qs:
            key = row['month'].strftime('%b %Y')
            if key not in vm_by_month:
                vm_by_month[key] = {'month': key, 'vendors': []}
            vm_by_month[key]['vendors'].append({
                'id':      row['vendor__id'],
                'name':    row['vendor__shop_name'],
                'revenue': float(row['revenue'] or 0),
                'orders':  row['orders'],
            })
        vendor_monthly_data = list(vm_by_month.values())

        return Response({
            'summary': {
                'total_revenue': float(total_revenue),
                'total_commission': float(total_revenue * Decimal('0.10')),
                'total_orders': total_orders,
                'delivered_revenue': float(delivered_revenue),
                'active_vendors': active_vendors,
                'pending_vendors': pending_vendors,
                'total_customers': total_customers,
                'total_products': total_products,
            },
            'monthly': monthly_data,
            'vendor_monthly': vendor_monthly_data,
            'top_vendors': top_vendors_data,
            'categories': category_data,
        })


# ── Vendor analytics ──────────────────────────────────────────────────────────
class VendorAnalyticsView(APIView):
    permission_classes = [IsVendorUser]

    def get(self, request):
        vendor = request.user.vendor_profile

        # ── Monthly breakdown (last 6 months) ──────────────────────────────
        monthly_qs = (
            OrderItem.objects
            .filter(vendor=vendor)
            .annotate(month=TruncMonth('order__created_at'))
            .values('month')
            .annotate(
                revenue=Sum('total_price'),
                orders=Count('order', distinct=True),
                refunds=Sum(
                    'total_price',
                    filter=Q(order__status='refunded')
                ),
            )
            .order_by('month')
        )
        monthly_data = [
            {
                'month': m['month'].strftime('%b'),
                'month_year': m['month'].strftime('%b %Y'),
                'revenue': float(m['revenue'] or 0),
                'orders': m['orders'],
                'refunds': float(m['refunds'] or 0),
            }
            for m in monthly_qs
        ]
        # Keep last 6 months only
        monthly_data = monthly_data[-6:]

        # ── Summary stats ──────────────────────────────────────────────────
        now = timezone.now()
        current_month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

        total_revenue = OrderItem.objects.filter(vendor=vendor).aggregate(
            t=Sum('total_price'))['t'] or Decimal('0')

        orders_this_month = OrderItem.objects.filter(
            vendor=vendor,
            order__created_at__gte=current_month_start
        ).values('order').distinct().count()

        revenue_this_month = OrderItem.objects.filter(
            vendor=vendor,
            order__created_at__gte=current_month_start
        ).aggregate(t=Sum('total_price'))['t'] or Decimal('0')

        total_order_count = OrderItem.objects.filter(vendor=vendor).values('order').distinct().count()
        avg_order_value = float(total_revenue) / total_order_count if total_order_count else 0

        refund_count = OrderItem.objects.filter(
            vendor=vendor, order__status='refunded'
        ).values('order').distinct().count()
        return_rate = (refund_count / total_order_count * 100) if total_order_count else 0

        # ── Category breakdown ─────────────────────────────────────────────
        category_qs = (
            OrderItem.objects
            .filter(vendor=vendor)
            .values('product__category__name')
            .annotate(count=Count('id'))
            .order_by('-count')
        )
        COLORS = ['#6366f1', '#ec4899', '#f59e0b', '#10b981', '#8b5cf6', '#ef4444', '#3b82f6']
        total_items = sum(c['count'] for c in category_qs) or 1
        category_data = [
            {
                'name': c['product__category__name'] or 'Other',
                'value': round(c['count'] / total_items * 100, 1),
                'count': c['count'],
                'color': COLORS[i % len(COLORS)],
            }
            for i, c in enumerate(category_qs)
        ]

        # ── Top selling sizes ──────────────────────────────────────────────
        size_qs = (
            OrderItem.objects
            .filter(vendor=vendor, variant__isnull=False)
            .values('variant__size')
            .annotate(count=Sum('quantity'))
            .order_by('-count')[:5]
        )
        top_sizes = [
            {'size': f"EU{s['variant__size']}" if s['variant__size'] else '—', 'count': s['count'] or 0}
            for s in size_qs
        ]

        return Response({
            'summary': {
                'total_revenue': float(total_revenue),
                'orders_this_month': orders_this_month,
                'revenue_this_month': float(revenue_this_month),
                'avg_order_value': round(avg_order_value, 2),
                'return_rate': round(return_rate, 1),
                'total_orders': total_order_count,
            },
            'monthly': monthly_data,
            'categories': category_data,
            'top_sizes': top_sizes,
        })
