from django.contrib import admin

from .models import Profile, Dialog, Message


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "phone", "first_name", "last_name")
    search_fields = ("phone", "first_name", "last_name", "user__username")
    list_select_related = ("user",)


@admin.register(Dialog)
class DialogAdmin(admin.ModelAdmin):
    list_display = ("id", "user1", "user2", "created_at")
    list_select_related = ("user1", "user2")
    list_filter = ("user1", "user2")
    search_fields = (
        "user1__username",
        "user2__username",
        "user1__profile__phone",
        "user2__profile__phone",
    )


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "dialog", "sender", "content_type", "media_mime", "media_name", "media_size", "created_at")
    list_select_related = ("dialog", "sender")
    search_fields = ("ciphertext", "media_name", "media_mime", "sender__username", "dialog__id")
    list_filter = ("dialog", "sender", "content_type")
