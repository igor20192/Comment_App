from django.contrib import admin
from .models import Comment


@admin.register(Comment)
class CommentAdmin(admin.ModelAdmin):
    list_display = (
        "username",
        "text",
        "created_at",
    )
    list_filter = ("created_at",)
    search_fields = ("username", "email", "text")
    readonly_fields = ("created_at",)
    fieldsets = (
        (
            None,
            {
                "fields": (
                    "username",
                    "text",
                    "email",
                    "homepage",
                    "image",
                    "file",
                    "parent",
                    "created_at",
                )
            },
        ),
        ("Timestamps", {"fields": (), "classes": ("collapse",)}),
    )
