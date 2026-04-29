from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('vendors', '0002_add_city_to_vendor'),
        ('orders', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='VendorCommission',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('rate', models.DecimalField(decimal_places=2, max_digits=5)),
                ('status', models.CharField(
                    choices=[('pending', 'Pending'), ('settled', 'Settled')],
                    default='pending',
                    max_length=20,
                )),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('settled_at', models.DateTimeField(blank=True, null=True)),
                ('vendor', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='commissions',
                    to='vendors.vendor',
                )),
                ('order', models.ForeignKey(
                    on_delete=django.db.models.deletion.CASCADE,
                    related_name='commissions',
                    to='orders.order',
                )),
            ],
            options={
                'db_table': 'vendor_commissions',
                'ordering': ['-created_at'],
                'unique_together': {('vendor', 'order')},
            },
        ),
    ]
