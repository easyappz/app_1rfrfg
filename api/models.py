from django.conf import settings
from django.db import models


class Profile(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="profile")
    phone = models.CharField(max_length=32, unique=True)
    first_name = models.CharField(max_length=150, blank=True, default="")
    last_name = models.CharField(max_length=150, blank=True, default="")

    def __str__(self) -> str:
        return f"{self.phone} ({self.first_name} {self.last_name})".strip()


class Dialog(models.Model):
    user1 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dialogs_as_user1")
    user2 = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="dialogs_as_user2")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=["user1", "user2"], name="unique_dialog_pair"),
            models.CheckConstraint(check=~models.Q(user1=models.F("user2")), name="dialog_user1_not_user2"),
            models.CheckConstraint(check=models.Q(user1__lt=models.F("user2")), name="dialog_user1_lt_user2"),
        ]

    def __str__(self) -> str:
        return f"Dialog #{self.pk}: {self.user1_id} <-> {self.user2_id}"


class Message(models.Model):
    dialog = models.ForeignKey(Dialog, on_delete=models.CASCADE, related_name="messages")
    sender = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sent_messages")
    ciphertext = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self) -> str:
        return f"Message #{self.pk} in dialog {self.dialog_id} by {self.sender_id}"
