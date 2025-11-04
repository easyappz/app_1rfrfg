from django.contrib import admin

from .models import Profile, Dialog, Message


@admin.register(Profile)
class ProfileAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "phone", "first_name", "last_name")
    search_fields = ("phone", "first_name", "last_name")
    list_select_related = ("user",)


@admin.register(Dialog)
class DialogAdmin(admin.ModelAdmin):
    list_display = ("id", "user1", "user2", "created_at")
    list_select_related = ("user1", "user2")


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ("id", "dialog", "sender", "created_at")
    list_select_related = ("dialog", "sender")
    search_fields = ("ciphertext",)
