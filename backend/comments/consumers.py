import json
import logging
from channels.generic.websocket import AsyncWebsocketConsumer
from channels.exceptions import ChannelFull

logger = logging.getLogger(__name__)


class CommentConsumer(AsyncWebsocketConsumer):
    """
    WebSocket consumer for handling real-time comments.
    """

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.group_name = "comments"
        self.is_connected = False

    async def connect(self):
        """
        Handle WebSocket connection.
        """
        try:
            await self.channel_layer.group_add(self.group_name, self.channel_name)
            await self.accept()
            self.is_connected = True
            logger.info(f"Client connected: {self.channel_name}")

        except ChannelFull:
            logger.error("Channel layer is full")
            await self.close(code=1013)  # 1013 is "Try Again Later"

        except Exception as e:
            logger.error(f"Error in connect: {str(e)}")
            await self.close(code=1011)  # 1011 is "Internal Error"

    async def disconnect(self, close_code: int):
        """
        Handle WebSocket disconnection.

        Args:
            close_code (int): WebSocket close code
        """
        try:
            if self.is_connected:
                await self.channel_layer.group_discard(
                    self.group_name, self.channel_name
                )
                self.is_connected = False
                logger.info(
                    f"Client disconnected: {self.channel_name}, code: {close_code}"
                )

        except Exception as e:
            logger.error(f"Error in disconnect: {str(e)}")

    async def receive(self, text_data: str):
        """
        Receive message from WebSocket and broadcast to group.

        Args:
            text_data (str): Received message data
        """
        try:
            # Validate JSON format
            message = json.loads(text_data)

            if not isinstance(message, dict):
                raise ValueError("Message must be a JSON object")

            await self.channel_layer.group_send(
                self.group_name, {"type": "send_comment", "message": message}
            )
            logger.debug(
                f"Message received and broadcast: {text_data[:100]}"
            )  # Log first 100 chars

        except json.JSONDecodeError:
            logger.error("Invalid JSON received")
            await self.send(text_data=json.dumps({"error": "Invalid JSON format"}))

        except Exception as e:
            logger.error(f"Error in receive: {str(e)}")
            await self.send(text_data=json.dumps({"error": "Internal server error"}))

    async def send_comment(self, event: dict):
        """
        Send comment to WebSocket.

        Args:
            event (dict): Event containing message to send
        """
        try:
            message = event["message"]
            await self.send(text_data=json.dumps(message))
            logger.debug(
                f"Message sent to client: {str(message)[:100]}"
            )  # Log first 100 chars

        except Exception as e:
            logger.error(f"Error in send_comment: {str(e)}")
            await self.send(text_data=json.dumps({"error": "Error sending message"}))
