from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [
        ('api', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='message',
            name='content_type',
            field=models.CharField(choices=[('text', 'text'), ('image', 'image')], db_index=True, default='text', max_length=16),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='message',
            name='media_mime',
            field=models.CharField(blank=True, default='', max_length=150),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='message',
            name='media_name',
            field=models.CharField(blank=True, default='', max_length=255),
            preserve_default=True,
        ),
        migrations.AddField(
            model_name='message',
            name='media_size',
            field=models.IntegerField(blank=True, null=True),
            preserve_default=True,
        ),
    ]
