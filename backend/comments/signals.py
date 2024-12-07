from django.db.models.signals import post_save
from django.dispatch import receiver
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from .models import Comment


@receiver(post_save, sender=Comment)
def send_new_comment_via_websocket(sender, instance, created, **kwargs):
    if created and not Comment.objects.filter(id=instance.id):
        # Обработать только новые комментарии
        channel_layer = get_channel_layer()
        async_to_sync(channel_layer.group_send)(
            "comments",
            {
                "type": "send_comment",
                "message": {
                    "id": instance.id,
                    "username": instance.username,
                    "email": instance.email,
                    "text": instance.text,
                    "created_at": instance.created_at.isoformat(),
                },
            },
        )
