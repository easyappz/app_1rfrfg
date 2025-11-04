from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):
    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='Profile',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False, verbose_name='ID')),
                ('phone', models.CharField(max_length=32, unique=True)),
                ('first_name', models.CharField(blank=True, default='', max_length=150)),
                ('last_name', models.CharField(blank=True, default='', max_length=150)),
                ('user', models.OneToOneField(on_delete=models.deletion.CASCADE, related_name='profile', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Profile',
                'verbose_name_plural': 'Profiles',
            },
        ),
        migrations.CreateModel(
            name='Dialog',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False, verbose_name='ID')),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('user1', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='dialogs_as_user1', to=settings.AUTH_USER_MODEL)),
                ('user2', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='dialogs_as_user2', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'verbose_name': 'Dialog',
                'verbose_name_plural': 'Dialogs',
            },
        ),
        migrations.CreateModel(
            name='Message',
            fields=[
                ('id', models.BigAutoField(primary_key=True, serialize=False, verbose_name='ID')),
                ('ciphertext', models.TextField()),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('dialog', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='messages', to='api.dialog')),
                ('sender', models.ForeignKey(on_delete=models.deletion.CASCADE, related_name='sent_messages', to=settings.AUTH_USER_MODEL)),
            ],
            options={
                'ordering': ['-created_at'],
                'verbose_name': 'Message',
                'verbose_name_plural': 'Messages',
            },
        ),
        migrations.AddConstraint(
            model_name='dialog',
            constraint=models.UniqueConstraint(fields=['user1', 'user2'], name='unique_dialog_pair'),
        ),
        migrations.AddConstraint(
            model_name='dialog',
            constraint=models.CheckConstraint(check=~models.Q(('user1', models.F('user2'))), name='dialog_user1_not_user2'),
        ),
        migrations.AddConstraint(
            model_name='dialog',
            constraint=models.CheckConstraint(check=models.Q(('user1__lt', models.F('user2'))), name='dialog_user1_lt_user2'),
        ),
    ]
