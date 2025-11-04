from django.urls import path
from .views import HelloView
from .views_auth import RegisterView, LoginView
from .views_users import MeView, UserSearchView
from .views_dialogs import DialogListCreateView, DialogRetrieveView
from .views_messages import MessageListCreateView

urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),

    # Users
    path("users/me", MeView.as_view(), name="users-me"),
    path("users/search", UserSearchView.as_view(), name="users-search"),

    # Dialogs
    path("dialogs/", DialogListCreateView.as_view(), name="dialogs-list-create"),
    path("dialogs/<int:dialog_id>/", DialogRetrieveView.as_view(), name="dialogs-retrieve"),

    # Messages
    path("dialogs/<int:dialog_id>/messages", MessageListCreateView.as_view(), name="messages-list-create"),
]
