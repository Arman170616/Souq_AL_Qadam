from django.db import models
from rest_framework import serializers
from .models import Vendor, VendorCommission, SiteSettings
from apps.users.serializers import UserSerializer


class VendorSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    total_sales = serializers.SerializerMethodField()

    class Meta:
        model = Vendor
        fields = [
            'id', 'user', 'shop_name', 'slug', 'description',
            'logo', 'banner', 'city', 'address', 'phone', 'email',
            'status', 'commission_rate', 'rating', 'total_sales',
            'is_premium', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'slug', 'status', 'commission_rate', 'rating', 'created_at', 'updated_at']

    def get_total_sales(self, obj):
        from apps.orders.models import OrderItem
        result = OrderItem.objects.filter(vendor=obj).aggregate(total=models.Sum('quantity'))
        return result['total'] or 0


class VendorCreateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['shop_name', 'description', 'city', 'address', 'phone', 'email', 'logo', 'banner']

    def create(self, validated_data):
        user = self.context['request'].user
        import re
        slug_base = re.sub(r'[^\w]+', '-', validated_data['shop_name'].lower()).strip('-')
        slug = slug_base
        n = 1
        while Vendor.objects.filter(slug=slug).exists():
            slug = f'{slug_base}-{n}'
            n += 1
        default_rate = SiteSettings.get().default_commission_rate
        vendor = Vendor.objects.create(user=user, slug=slug, commission_rate=default_rate, **validated_data)
        user.role = 'vendor'
        user.save(update_fields=['role'])
        return vendor


class VendorPublicSerializer(serializers.ModelSerializer):
    class Meta:
        model = Vendor
        fields = ['id', 'shop_name', 'slug', 'description', 'logo', 'banner', 'city', 'phone', 'address', 'rating', 'total_sales', 'is_premium', 'created_at']


class VendorStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=Vendor.STATUS_CHOICES)


class VendorCommissionSerializer(serializers.ModelSerializer):
    order_number  = serializers.CharField(source='order.order_number', read_only=True)
    order_total   = serializers.DecimalField(source='order.total', max_digits=10, decimal_places=2, read_only=True)
    vendor_name   = serializers.CharField(source='vendor.shop_name', read_only=True)
    vendor_id     = serializers.IntegerField(source='vendor.id', read_only=True)

    class Meta:
        model  = VendorCommission
        fields = [
            'id', 'vendor_id', 'vendor_name', 'order_number', 'order_total',
            'amount', 'rate', 'status', 'created_at', 'settled_at',
        ]
