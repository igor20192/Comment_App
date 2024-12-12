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

    def get_replies(self, obj):
        if obj.replies.exists():
            return CommentSerializer(obj.replies.all(), many=True).data
        return []

    def validate(self, data):
        captcha_key = data.pop("captcha_key", None)
        captcha_text = data.pop("captcha_text", None)

        # Проверяем CAPTCHA
        try:
            captcha = CaptchaStore.objects.get(hashkey=captcha_key)
            if captcha.response.upper() != captcha_text:
                raise serializers.ValidationError({"captcha_text": "Invalid CAPTCHA"})
        except CaptchaStore.DoesNotExist:
            raise serializers.ValidationError({"captcha_key": "Invalid CAPTCHA key"})

        # Удаляем использованную CAPTCHA
        CaptchaStore.objects.filter(hashkey=captcha_key).delete()

        return data

    def create(self, validated_data):
        # Создаем объект модели без временных полей
        return Comment.objects.create(**validated_data)
        # return super().create(validated_data)
