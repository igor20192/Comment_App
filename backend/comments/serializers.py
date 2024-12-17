from rest_framework import serializers
from captcha.models import CaptchaStore
from .models import Comment


class CommentSerializer(serializers.ModelSerializer):
    captcha_key = serializers.CharField(write_only=True)
    captcha_text = serializers.CharField(write_only=True)
    replies = serializers.SerializerMethodField()

    class Meta:
        model = Comment
        fields = [
            "id",
            "username",
            "email",
            "homepage",
            "text",
            "image",
            "file",
            "parent",
            "created_at",
            "captcha_key",
            "captcha_text",
            "replies",
        ]
        read_only_fields = ["id", "created_at"]

    def get_replies(self, obj):
        """Get all replies for the current comment."""
        if hasattr(obj, "replies"):  # Check if replies relation exists
            return CommentSerializer(
                obj.replies.all().select_related("parent"),  # Optimize query
                many=True,
                context=self.context,
            ).data
        return []

    def validate(self, data):
        """Validate the comment data including CAPTCHA verification."""
        # Validate required fields
        if not data.get("text"):
            raise serializers.ValidationError({"text": "Comment text is required"})

        # CAPTCHA validation
        captcha_key = data.pop("captcha_key", None)
        captcha_text = data.pop("captcha_text", None)

        if not captcha_key or not captcha_text:
            raise serializers.ValidationError(
                {"captcha": "Both captcha key and text are required"}
            )

        try:
            captcha = CaptchaStore.objects.get(hashkey=captcha_key)
            if (
                captcha.response.upper() != captcha_text.upper()
            ):  # Case-insensitive comparison
                raise serializers.ValidationError({"captcha_text": "Invalid CAPTCHA"})

            # Delete used CAPTCHA immediately
            captcha.delete()

        except CaptchaStore.DoesNotExist:
            raise serializers.ValidationError(
                {"captcha_key": "Invalid or expired CAPTCHA key"}
            )

        # Validate parent comment if provided
        if "parent" in data and data["parent"]:
            try:
                parent_comment = Comment.objects.get(id=data["parent"].id)
                if parent_comment.parent:  # Prevent nested replies beyond one level
                    raise serializers.ValidationError(
                        {"parent": "Nested replies are not allowed"}
                    )
            except Comment.DoesNotExist:
                raise serializers.ValidationError(
                    {"parent": "Parent comment does not exist"}
                )

        return data

    def create(self, validated_data):
        """Create a new comment instance."""
        return Comment.objects.create(**validated_data)
