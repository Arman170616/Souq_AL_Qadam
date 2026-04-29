from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.db.models import Sum


@receiver(pre_save, sender='orders.Order')
def create_commissions_on_delivery(sender, instance, **kwargs):
    """
    When an order transitions to 'delivered', create a VendorCommission
    record for each vendor that has items in the order.
    """
    if not instance.pk:
        return  # new order, skip

    try:
        old = sender.objects.get(pk=instance.pk)
    except sender.DoesNotExist:
        return

    if old.status == instance.status:
        return  # status unchanged

    if instance.status != 'delivered':
        return  # only trigger on delivered

    from apps.vendors.models import VendorCommission

    # Group order items by vendor and sum commissions
    vendor_totals = (
        instance.items
        .exclude(vendor=None)
        .values('vendor__id', 'vendor__commission_rate')
        .annotate(total_commission=Sum('vendor_commission'))
    )

    for row in vendor_totals:
        VendorCommission.objects.get_or_create(
            vendor_id=row['vendor__id'],
            order=instance,
            defaults={
                'amount': row['total_commission'] or 0,
                'rate':   row['vendor__commission_rate'],
                'status': 'pending',
            },
        )
