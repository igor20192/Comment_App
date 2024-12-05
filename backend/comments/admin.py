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
    search_fields = ("user__username", "text__title", "content")
    readonly_fields = ("created_at",)
    fieldsets = (
        (None, {"fields": ("username", "text", "content")}),
        ("Timestamps", {"fields": ("created_at",), "classes": ("collapse",)}),
    )
