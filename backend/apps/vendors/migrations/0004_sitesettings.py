from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vendors', '0003_vendorcommission'),
    ]

    operations = [
        migrations.CreateModel(
            name='SiteSettings',
            fields=[
                ('id', models.AutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('default_commission_rate', models.DecimalField(decimal_places=2, default=10.0, max_digits=5)),
            ],
            options={
                'db_table': 'site_settings',
            },
        ),
    ]
