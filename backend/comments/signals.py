import logging
from django.db.models.signals import post_save
from django.dispatch import receiver
from channels.layers import get_channel_layer
from asgiref.sync import async_to_sync
from django.core.exceptions import ObjectDoesNotExist
from .models import Comment
from django.conf import settings

logger = logging.getLogger(__name__)


@receiver(post_save, sender=Comment)
def send_new_comment_via_websocket(sender, instance, created, **kwargs):
    """
    Signal handler to broadcast new comments via WebSocket.

    Args:
        sender: The model class (Comment)
        instance: The actual comment instance
        created: Boolean indicating if this is a new instance
        **kwargs: Additional keyword arguments
    """
    try:
        # Check if this is a new comment
        if not created:
            return

            # Get the channel layer for WebSocket communication
        channel_layer = get_channel_layer()

        # Prepare the message payload
        message_payload = {
            "type": "send_comment",
            "message": {
                "id": instance.id,
                "username": instance.username,
                "email": instance.email,
                "text": instance.text,
                "created_at": instance.created_at.isoformat(),
                "image": (
                    f"{settings.SITE_URL}{instance.image.url}"
                    if instance.image
                    else None
                ),
                "file": (
                    f"{settings.SITE_URL}{instance.file.url}" if instance.file else None
                ),
                "parent": instance.parent.id if instance.parent else None,
            },
        }

        # Send the message to the WebSocket group
        async_to_sync(channel_layer.group_send)("comments", message_payload)

        logger.info(f"Successfully sent comment ID {instance.id} to WebSocket")

    except ObjectDoesNotExist:
        logger.error(f"Failed to find comment with ID {instance.id}")
    except Exception as e:
        logger.error(f"Error sending comment to WebSocket: {str(e)}")
