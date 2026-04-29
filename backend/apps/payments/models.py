from django.db import models
from django.conf import settings


class Payment(models.Model):
    METHOD_COD      = 'cod'
    METHOD_BKASH    = 'bkash'
    METHOD_NAGAD    = 'nagad'
    METHOD_CARD     = 'card'
    METHOD_BANGOPAY = 'bangopay'

    METHOD_CHOICES = [
        (METHOD_COD,      'Cash on Delivery'),
        (METHOD_BKASH,    'bKash'),
        (METHOD_NAGAD,    'Nagad'),
        (METHOD_CARD,     'Card'),
        (METHOD_BANGOPAY, 'BangoPay'),
    ]

    STATUS_PENDING = 'pending'
    STATUS_COMPLETED = 'completed'
    STATUS_FAILED = 'failed'
    STATUS_REFUNDED = 'refunded'

    STATUS_CHOICES = [
        (STATUS_PENDING, 'Pending'),
        (STATUS_COMPLETED, 'Completed'),
        (STATUS_FAILED, 'Failed'),
        (STATUS_REFUNDED, 'Refunded'),
    ]

    order = models.OneToOneField('orders.Order', on_delete=models.CASCADE, related_name='payment')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, related_name='payments')
    method = models.CharField(max_length=20, choices=METHOD_CHOICES)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default=STATUS_PENDING)
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    transaction_id = models.CharField(max_length=255, blank=True)
    gateway_response = models.JSONField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments'
        ordering = ['-created_at']

    def __str__(self):
        return f'Payment({self.order.order_number}, {self.method}, {self.status})'
