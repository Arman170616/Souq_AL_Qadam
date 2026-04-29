from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('vendors', '0004_sitesettings'),
    ]

    operations = [
        migrations.AddField(
            model_name='vendor',
            name='is_premium',
            field=models.BooleanField(default=False),
        ),
    ]
