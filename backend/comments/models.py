from django.db import models
from django.utils.html import escape


class Comment(models.Model):
    username = models.CharField(max_length=50)
    email = models.EmailField()
    homepage = models.URLField(blank=True, null=True)
    text = models.TextField()
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="replies"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def clean(self):
        # Убираем запрещенные HTML теги
        allowed_tags = ["a", "code", "i", "strong"]
        self.text = escape(self.text, allowed_tags)

    def __str__(self):
        return f"{self.username} - {self.created_at}"
