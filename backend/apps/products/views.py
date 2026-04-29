import csv
import io
import re
import uuid

from rest_framework import generics, status, permissions, filters
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.http import HttpResponse
from config.throttles import SearchRateThrottle
from django_filters.rest_framework import DjangoFilterBackend
import django_filters

from .models import Category, Product, ProductImage, ProductVariant
from .serializers import (
    CategorySerializer, ProductListSerializer, VendorProductListSerializer,
    ProductDetailSerializer, ProductWriteSerializer, ProductImageSerializer, ProductVariantSerializer,
)


class IsVendorOrAdmin(permissions.BasePermission):
    def has_permission(self, request, view):
        if not request.user.is_authenticated:
            return False
        if request.user.role == 'admin':
            return True
        # Vendor must have an actual vendor_profile record
        if request.user.role == 'vendor':
            return hasattr(request.user, 'vendor_profile')
        return False


class IsAdminUser(permissions.BasePermission):
    def has_permission(self, request, view):
        return request.user.is_authenticated and request.user.role == 'admin'


class IsProductOwnerOrAdmin(permissions.BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == 'admin':
            return True
        return hasattr(request.user, 'vendor_profile') and obj.vendor == request.user.vendor_profile


class ProductFilter(django_filters.FilterSet):
    min_price = django_filters.NumberFilter(field_name='price', lookup_expr='gte')
    max_price = django_filters.NumberFilter(field_name='price', lookup_expr='lte')
    size = django_filters.CharFilter(method='filter_by_size')
    in_stock = django_filters.BooleanFilter(method='filter_in_stock')

    class Meta:
        model = Product
        fields = ['category', 'vendor', 'is_featured', 'min_price', 'max_price']

    def filter_by_size(self, queryset, name, value):
        # Support comma-separated sizes: ?size=40,41,42
        sizes = [s.strip() for s in value.split(',') if s.strip()]
        return queryset.filter(variants__size__in=sizes).distinct()

    def filter_in_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock__gt=0)
        return queryset

    has_discount = django_filters.BooleanFilter(method='filter_has_discount')

    def filter_has_discount(self, queryset, name, value):
        if value:
            return queryset.filter(discount_price__isnull=False)
        return queryset


# --- Public Views ---

class CategoryListView(generics.ListAPIView):
    serializer_class = CategorySerializer
    permission_classes = [permissions.AllowAny]

    def get_queryset(self):
        return Category.objects.filter(is_active=True, parent__isnull=True)


class StoreStatsView(APIView):
    permission_classes = [permissions.AllowAny]

    def get(self, request):
        from apps.vendors.models import Vendor
        from apps.users.models import User
        from apps.orders.models import Order
        return Response({
            'total_products':  Product.objects.filter(is_active=True).count(),
            'total_vendors':   Vendor.objects.filter(status='approved').count(),
            'total_customers': User.objects.filter(role='customer').count(),
            'total_orders':    Order.objects.count(),
            'total_categories': Category.objects.filter(is_active=True).count(),
        })


# --- Admin Category Management ---

class AdminCategoryListCreateView(generics.ListCreateAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]

    def get_queryset(self):
        return Category.objects.all()

    def perform_create(self, serializer):
        import re
        name = serializer.validated_data.get('name', '')
        slug = serializer.validated_data.get('slug') or re.sub(r'[^\w]+', '-', name.lower()).strip('-')
        n = 1
        base = slug
        while Category.objects.filter(slug=slug).exists():
            slug = f'{base}-{n}'; n += 1
        serializer.save(slug=slug)


class AdminCategoryDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = CategorySerializer
    permission_classes = [IsAdminUser]
    queryset = Category.objects.all()


class ProductListView(generics.ListAPIView):
    serializer_class = ProductListSerializer
    permission_classes = [permissions.AllowAny]
    throttle_classes = [SearchRateThrottle]
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_class = ProductFilter
    search_fields = ['name', 'description', 'sku', 'vendor__shop_name']
    ordering_fields = ['price', 'rating', 'created_at', 'review_count']
    ordering = ['-created_at']

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('vendor', 'category').prefetch_related('images')


class ProductDetailView(generics.RetrieveAPIView):
    serializer_class = ProductDetailSerializer
    permission_classes = [permissions.AllowAny]
    lookup_field = 'slug'

    def get_queryset(self):
        return Product.objects.filter(is_active=True).select_related('vendor', 'category').prefetch_related('images', 'variants')


# --- Vendor Views ---

class VendorProductListCreateView(generics.ListCreateAPIView):
    permission_classes = [IsVendorOrAdmin]

    def get_serializer_class(self):
        if self.request.method == 'POST':
            return ProductWriteSerializer
        return VendorProductListSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Product.objects.all().select_related('vendor', 'category').prefetch_related('images')
        if not hasattr(user, 'vendor_profile'):
            return Product.objects.none()
        return Product.objects.filter(vendor=user.vendor_profile).select_related('vendor', 'category').prefetch_related('images')


class VendorProductDetailView(generics.RetrieveUpdateDestroyAPIView):
    permission_classes = [IsVendorOrAdmin, IsProductOwnerOrAdmin]

    def get_serializer_class(self):
        if self.request.method in ('PUT', 'PATCH'):
            return ProductWriteSerializer
        return ProductDetailSerializer

    def get_queryset(self):
        user = self.request.user
        if user.role == 'admin':
            return Product.objects.all()
        return Product.objects.filter(vendor=user.vendor_profile)

    def update(self, request, *args, **kwargs):
        kwargs['partial'] = True
        instance = self.get_object()
        new_price = request.data.get('price')
        price_changing = new_price and str(new_price) != str(instance.price)
        if price_changing and instance.price_locked:
            return Response(
                {'price': ['Price has already been updated once and is now locked.']},
                status=status.HTTP_400_BAD_REQUEST,
            )
        response = super().update(request, *args, **kwargs)
        if price_changing and not instance.price_locked:
            Product.objects.filter(pk=instance.pk).update(price_locked=True)
        return response


class ProductImageUploadView(APIView):
    permission_classes = [IsVendorOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, product_pk):
        try:
            product = Product.objects.get(pk=product_pk, vendor=request.user.vendor_profile)
        except Product.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)

        image = request.FILES.get('image')
        if not image:
            return Response({'detail': 'No image provided.'}, status=status.HTTP_400_BAD_REQUEST)

        is_primary = not product.images.filter(is_primary=True).exists()
        img = ProductImage.objects.create(
            product=product,
            image=image,
            alt_text=request.data.get('alt_text', ''),
            is_primary=is_primary,
        )
        return Response(ProductImageSerializer(img).data, status=status.HTTP_201_CREATED)


class ProductImageDeleteView(APIView):
    permission_classes = [IsVendorOrAdmin]

    def delete(self, request, product_pk, image_pk):
        try:
            user = request.user
            if user.role == 'admin':
                img = ProductImage.objects.get(pk=image_pk, product_id=product_pk)
            else:
                img = ProductImage.objects.get(pk=image_pk, product_id=product_pk, product__vendor=user.vendor_profile)
        except ProductImage.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        img.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class ProductVariantView(generics.ListCreateAPIView):
    serializer_class = ProductVariantSerializer
    permission_classes = [IsVendorOrAdmin]

    def get_queryset(self):
        return ProductVariant.objects.filter(product_id=self.kwargs['product_pk'])

    def perform_create(self, serializer):
        product = Product.objects.get(pk=self.kwargs['product_pk'])
        serializer.save(product=product)


class ProductVariantDetailView(generics.RetrieveUpdateDestroyAPIView):
    serializer_class = ProductVariantSerializer
    permission_classes = [IsVendorOrAdmin]

    def get_queryset(self):
        return ProductVariant.objects.filter(product_id=self.kwargs['product_pk'])


def _generate_sku(vendor, category):
    """Generate a unique SKU: BD + vendor_prefix(3) + cat_prefix(3) + hex(6)."""
    v = re.sub(r'[^A-Z0-9]', '', (vendor.shop_name[:3] if vendor else 'ADM').upper()).ljust(3, 'X')[:3]
    c = re.sub(r'[^A-Z0-9]', '', (category.name[:3] if category else 'GEN').upper()).ljust(3, 'X')[:3]
    while True:
        sku = f"BD{v}{c}{uuid.uuid4().hex[:6].upper()}"
        if not Product.objects.filter(sku=sku).exists():
            return sku


def _unique_slug(name):
    base = re.sub(r'[^\w]+', '-', name.lower()).strip('-')
    slug = base
    n = 1
    while Product.objects.filter(slug=slug).exists():
        slug = f'{base}-{n}'
        n += 1
    return slug


class BulkProductUploadView(APIView):
    """
    GET  → download CSV template
    POST → upload CSV and create products (max 200 rows)
    """
    permission_classes = [IsVendorOrAdmin]
    parser_classes = [MultiPartParser, FormParser]

    # ── CSV template download ─────────────────────────────────────────────
    def get(self, request):
        response = HttpResponse(content_type='text/csv; charset=utf-8')
        response['Content-Disposition'] = 'attachment; filename="bdshoe_bulk_template.csv"'
        writer = csv.writer(response)
        writer.writerow(['name', 'description', 'price', 'discount_price', 'stock', 'category_id', 'sku'])
        writer.writerow(['Nike Air Force 1 White', 'Classic white low-top sneaker', '4500', '3999', '50', '1', ''])
        writer.writerow(['Adidas Stan Smith Green', 'Iconic leather tennis shoe', '5200', '', '30', '1', 'CUSTOM-SKU-001'])
        writer.writerow(['Puma RS-X Bold', 'Retro running shoe with chunky sole', '3800', '3200', '20', '2', ''])
        return response

    # ── Bulk upload ───────────────────────────────────────────────────────
    def post(self, request):
        csv_file = request.FILES.get('file')
        if not csv_file:
            return Response({'detail': 'No file provided.'}, status=status.HTTP_400_BAD_REQUEST)
        if not csv_file.name.lower().endswith('.csv'):
            return Response({'detail': 'File must be a .csv'}, status=status.HTTP_400_BAD_REQUEST)

        user = request.user
        vendor = None
        if user.role != 'admin':
            if not hasattr(user, 'vendor_profile'):
                return Response({'detail': 'No vendor profile.'}, status=status.HTTP_400_BAD_REQUEST)
            vendor = user.vendor_profile

        try:
            content = csv_file.read().decode('utf-8-sig')
            reader = csv.DictReader(io.StringIO(content))
            fieldnames = [f.strip().lower() for f in (reader.fieldnames or [])]
        except Exception:
            return Response({'detail': 'Failed to parse CSV. Make sure it is UTF-8 encoded.'}, status=status.HTTP_400_BAD_REQUEST)

        required = {'name', 'price', 'stock'}
        if not required.issubset(set(fieldnames)):
            return Response(
                {'detail': 'CSV must have at minimum: name, price, stock columns.'},
                status=status.HTTP_400_BAD_REQUEST,
            )

        results = []
        created = 0
        failed = 0

        for i, raw_row in enumerate(reader, start=1):
            # Normalise keys to lowercase
            row = {k.strip().lower(): v.strip() for k, v in raw_row.items() if k}

            if i > 200:
                results.append({'row': i, 'name': row.get('name', ''), 'status': 'skipped', 'message': 'Limit of 200 rows reached.'})
                continue

            name = row.get('name', '')
            if not name:
                results.append({'row': i, 'name': '', 'status': 'error', 'message': 'name is required.'})
                failed += 1
                continue

            # Price
            try:
                price = float(row.get('price') or 0)
                if price <= 0:
                    raise ValueError
            except ValueError:
                results.append({'row': i, 'name': name, 'status': 'error', 'message': 'price must be a positive number.'})
                failed += 1
                continue

            # Stock
            try:
                stock = int(row.get('stock') or 0)
            except ValueError:
                results.append({'row': i, 'name': name, 'status': 'error', 'message': 'stock must be an integer.'})
                failed += 1
                continue

            # Discount price (optional)
            discount_price = None
            dp = row.get('discount_price', '')
            if dp:
                try:
                    discount_price = float(dp)
                except ValueError:
                    pass

            # Category (optional)
            category = None
            cat_raw = row.get('category_id', '')
            if cat_raw:
                try:
                    category = Category.objects.get(pk=int(cat_raw))
                except (Category.DoesNotExist, ValueError):
                    pass

            # SKU — use provided or auto-generate
            sku = row.get('sku', '')
            if sku:
                if Product.objects.filter(sku=sku).exists():
                    results.append({'row': i, 'name': name, 'status': 'error', 'message': f'SKU "{sku}" already exists.'})
                    failed += 1
                    continue
            else:
                sku = _generate_sku(vendor, category)

            # Slug
            slug = _unique_slug(name)

            # Description fallback
            description = row.get('description', '') or name

            try:
                product = Product.objects.create(
                    vendor=vendor,
                    category=category,
                    name=name,
                    slug=slug,
                    description=description,
                    price=price,
                    discount_price=discount_price,
                    stock=stock,
                    sku=sku,
                    is_active=True,
                )
                results.append({'row': i, 'name': name, 'sku': sku, 'id': product.id, 'status': 'success'})
                created += 1
            except Exception as e:
                results.append({'row': i, 'name': name, 'status': 'error', 'message': str(e)})
                failed += 1

        return Response({'created': created, 'failed': failed, 'total': i if results else 0, 'results': results})
