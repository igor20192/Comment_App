# Generated by Django 5.1.4 on 2024-12-10 17:13

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('comments', '0002_remove_comment_captcha_alter_comment_file_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='comment',
            name='created_at',
            field=models.DateTimeField(auto_now_add=True, db_index=True),
        ),
        migrations.AlterField(
            model_name='comment',
            name='email',
            field=models.EmailField(db_index=True, max_length=254),
        ),
        migrations.AlterField(
            model_name='comment',
            name='username',
            field=models.CharField(db_index=True, max_length=50),
        ),
    ]
