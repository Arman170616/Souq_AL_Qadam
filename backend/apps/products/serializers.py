from rest_framework import serializers
from .models import Category, Product, ProductImage, ProductVariant
from apps.vendors.serializers import VendorPublicSerializer


class CategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()
    product_count = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ['id', 'name', 'slug', 'parent', 'image', 'is_active', 'children', 'product_count']

    def get_children(self, obj):
        return CategorySerializer(obj.children.filter(is_active=True), many=True, context=self.context).data

    def get_product_count(self, obj):
        return obj.products.filter(is_active=True).count()


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image', 'alt_text', 'is_primary', 'order']


class ProductVariantSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductVariant
        fields = ['id', 'size', 'color', 'stock', 'price_adjustment']


class ProductListSerializer(serializers.ModelSerializer):
    primary_image = serializers.SerializerMethodField()
    vendor_name = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_slug = serializers.CharField(source='vendor.slug', read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'name', 'slug', 'price', 'discount_price', 'effective_price',
            'rating', 'review_count', 'is_active', 'is_featured',
            'primary_image', 'vendor_name', 'vendor_slug', 'category_name',
        ]

    def get_primary_image(self, obj):
        img = obj.images.filter(is_primary=True).first() or obj.images.first()
        if img:
            request = self.context.get('request')
            return request.build_absolute_uri(img.image.url) if request and img.image else None
        return None


class VendorProductListSerializer(ProductListSerializer):
    """Extends public list serializer with sku and stock for vendor/admin manage views."""

    class Meta(ProductListSerializer.Meta):
        fields = ProductListSerializer.Meta.fields + ['sku', 'stock']


class ProductDetailSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    variants = ProductVariantSerializer(many=True, read_only=True)
    vendor = VendorPublicSerializer(read_only=True)
    category = CategorySerializer(read_only=True)
    effective_price = serializers.DecimalField(max_digits=10, decimal_places=2, read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'vendor', 'category', 'name', 'slug', 'description',
            'price', 'discount_price', 'effective_price', 'stock', 'sku',
            'is_active', 'is_featured', 'price_locked', 'rating', 'review_count',
            'images', 'variants', 'created_at', 'updated_at',
        ]


class ProductWriteSerializer(serializers.ModelSerializer):
    vendor_id = serializers.IntegerField(write_only=True, required=False, allow_null=True)
    id = serializers.IntegerField(read_only=True)

    class Meta:
        model = Product
        fields = [
            'id', 'vendor_id', 'category', 'name', 'description', 'price', 'discount_price',
            'stock', 'sku', 'is_active', 'is_featured', 'price_locked',
        ]

    def validate_sku(self, value):
        qs = Product.objects.filter(sku=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('SKU already exists.')
        return value

    def create(self, validated_data):
        import re
        from rest_framework.exceptions import PermissionDenied, ValidationError
        from apps.vendors.models import Vendor
        user = self.context['request'].user

        vendor_id = validated_data.pop('vendor_id', None)

        if user.role == 'admin':
            # Admin must specify vendor_id, or we pick the first available vendor
            if vendor_id:
                try:
                    vendor = Vendor.objects.get(pk=vendor_id)
                except Vendor.DoesNotExist:
                    raise ValidationError({'vendor_id': 'Vendor not found.'})
            elif hasattr(user, 'vendor_profile'):
                vendor = user.vendor_profile
            else:
                # Fall back to first approved vendor
                vendor = Vendor.objects.filter(status='approved').first()
                if not vendor:
                    raise PermissionDenied('No approved vendor found. Create a vendor first.')
        else:
            if not hasattr(user, 'vendor_profile'):
                raise PermissionDenied('Your vendor profile has not been set up yet. Please contact support.')
            vendor = user.vendor_profile

        slug_base = re.sub(r'[^\w]+', '-', validated_data['name'].lower()).strip('-')
        slug = slug_base
        n = 1
        while Product.objects.filter(slug=slug).exists():
            slug = f'{slug_base}-{n}'
            n += 1
        return Product.objects.create(vendor=vendor, slug=slug, **validated_data)
