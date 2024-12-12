from django.db import models
from django.core.exceptions import ValidationError
from django.core.validators import FileExtensionValidator
from PIL import Image
from bleach import clean

ALLOWED_TAGS = ["a", "code", "i", "strong"]


def validate_html(value):
    cleaned_text = clean(value, tags=ALLOWED_TAGS, attributes={"a": ["href", "title"]})
    if value != cleaned_text:
        raise ValidationError("HTML contains invalid or unclosed tags.")
    return cleaned_text


class Comment(models.Model):
    username = models.CharField(max_length=50, db_index=True)
    email = models.EmailField(db_index=True)
    homepage = models.URLField(blank=True, null=True)
    text = models.TextField(validators=[validate_html])
    image = models.ImageField(
        upload_to="uploads/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["jpg", "jpeg", "png", "gif"])],
    )
    file = models.FileField(
        upload_to="uploads/",
        blank=True,
        null=True,
        validators=[FileExtensionValidator(["txt"])],
    )
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    parent = models.ForeignKey(
        "self",
        null=True,
        blank=True,
        on_delete=models.CASCADE,
        related_name="replies",
        db_index=True,
    )

    def save(self, *args, **kwargs):
        if self.file and self.file.size > 100 * 1024:
            raise ValidationError("File size should not exceed 100 KB")

        super().save(*args, **kwargs)

        if self.image:
            img = Image.open(self.image.path)
            if img.height > 240 or img.width > 320:
                output_size = (320, 240)
                img.thumbnail(output_size, Image.Resampling.LANCZOS)  # Updated here
                img.save(self.image.path)

    def __str__(self):
        return self.username
