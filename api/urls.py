from django.urls import path
from .views import HelloView
from .views_auth import RegisterView, LoginView

urlpatterns = [
    path("hello/", HelloView.as_view(), name="hello"),
    path("auth/register", RegisterView.as_view(), name="auth-register"),
    path("auth/login", LoginView.as_view(), name="auth-login"),
]
