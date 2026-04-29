from django.contrib.auth.models import AbstractUser
from django.db import models


class User(AbstractUser):
    ROLE_CUSTOMER   = 'customer'
    ROLE_VENDOR     = 'vendor'
    ROLE_ADMIN      = 'admin'
    ROLE_SUPERADMIN = 'superadmin'

    ROLE_CHOICES = [
        (ROLE_CUSTOMER,   'Customer'),
        (ROLE_VENDOR,     'Vendor'),
        (ROLE_ADMIN,      'Admin'),
        (ROLE_SUPERADMIN, 'Super Admin'),
    ]

    email = models.EmailField(unique=True)
    phone = models.CharField(max_length=20, blank=True)
    role = models.CharField(max_length=20, choices=ROLE_CHOICES, default=ROLE_CUSTOMER)
    avatar = models.ImageField(upload_to='avatars/', null=True, blank=True)
    is_verified = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = ['username']

    class Meta:
        db_table = 'users'
        ordering = ['-created_at']

    def __str__(self):
        return self.email

    @property
    def is_vendor(self):
        return self.role == self.ROLE_VENDOR

    @property
    def is_customer(self):
        return self.role == self.ROLE_CUSTOMER

    @property
    def is_superadmin(self):
        return self.role == self.ROLE_SUPERADMIN


class Address(models.Model):
    LABEL_HOME  = 'home'
    LABEL_WORK  = 'work'
    LABEL_OTHER = 'other'
    LABEL_CHOICES = [(LABEL_HOME, 'Home'), (LABEL_WORK, 'Work'), (LABEL_OTHER, 'Other')]

    user         = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses')
    label        = models.CharField(max_length=20, choices=LABEL_CHOICES, default=LABEL_HOME)
    full_name    = models.CharField(max_length=100)
    phone        = models.CharField(max_length=20)
    address_line = models.CharField(max_length=255)
    city         = models.CharField(max_length=100)
    district     = models.CharField(max_length=100, blank=True)
    postal_code  = models.CharField(max_length=20, blank=True)
    is_default   = models.BooleanField(default=False)
    created_at   = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-is_default', '-created_at']

    def save(self, *args, **kwargs):
        if self.is_default:
            Address.objects.filter(user=self.user, is_default=True).exclude(pk=self.pk).update(is_default=False)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.full_name} — {self.city}"
