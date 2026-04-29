from django.db import models
from django.conf import settings


class Vendor(models.Model):
    STATUS_PENDING = 'pending'
    STATUS_APPROVED = 'approved'
    STATUS_REJECTED = 'rejected'
    STATUS_SUSPENDED = 'suspended'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_APPROVED, 'Approved'),
        (STATUS_REJECTED, 'Rejected'),
        (STATUS_SUSPENDED, 'Suspended'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='vendor_profile')
    shop_name = models.CharField(max_length=255)
    slug = models.SlugField(unique=True)
    description = models.TextField(blank=True)
    logo = models.ImageField(upload_to='vendors/logos/', null=True, blank=True)
    banner = models.ImageField(upload_to='vendors/banners/', null=True, blank=True)
    city = models.CharField(max_length=100, blank=True)
    address = models.TextField(blank=True)
    phone = models.CharField(max_length=20, blank=True)
    email = models.EmailField(blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)
    rating = models.DecimalField(max_digits=3, decimal_places=2, default=0.00)
    total_sales = models.PositiveIntegerField(default=0)
    is_premium = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'vendors'
        ordering = ['-created_at']

    def __str__(self):
        return self.shop_name

    @property
    def is_approved(self):
        return self.status == self.STATUS_APPROVED


class VendorCommission(models.Model):
    STATUS_PENDING  = 'pending'
    STATUS_SETTLED  = 'settled'
    STATUS_CHOICES  = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_SETTLED, 'Settled'),
    ]

    vendor     = models.ForeignKey(Vendor, on_delete=models.CASCADE, related_name='commissions')
    order      = models.ForeignKey('orders.Order', on_delete=models.CASCADE, related_name='commissions')
    amount     = models.DecimalField(max_digits=10, decimal_places=2)
    rate       = models.DecimalField(max_digits=5, decimal_places=2)   # rate snapshot at time of delivery
    status     = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    created_at = models.DateTimeField(auto_now_add=True)
    settled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        db_table = 'vendor_commissions'
        unique_together = ('vendor', 'order')   # one record per vendor per order
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.vendor.shop_name} | {self.order.order_number} | {self.amount}"


class SiteSettings(models.Model):
    """Singleton model for platform-wide settings."""
    default_commission_rate = models.DecimalField(max_digits=5, decimal_places=2, default=10.00)

    class Meta:
        db_table = 'site_settings'

    @classmethod
    def get(cls):
        obj, _ = cls.objects.get_or_create(pk=1)
        return obj

    def __str__(self):
        return f"SiteSettings (commission default: {self.default_commission_rate}%)"
