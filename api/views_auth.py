from django.contrib.auth import authenticate, get_user_model
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from drf_spectacular.utils import extend_schema

from .jwt_utils import generate_jwt
from .models import Profile
from .serializers import ProfileSerializer


class RegisterInputSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True, min_length=6)
    first_name = serializers.CharField(allow_blank=True, required=False, default="")
    last_name = serializers.CharField(allow_blank=True, required=False, default="")


class AuthResponseSerializer(serializers.Serializer):
    token = serializers.CharField()
    user = ProfileSerializer()


class LoginInputSerializer(serializers.Serializer):
    phone = serializers.CharField(max_length=32)
    password = serializers.CharField(write_only=True)


class RegisterView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(request=RegisterInputSerializer, responses={201: AuthResponseSerializer, 400: None})
    @transaction.atomic
    def post(self, request):
        serializer = RegisterInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data.get('phone')
        password = serializer.validated_data.get('password')
        first_name = serializer.validated_data.get('first_name', '')
        last_name = serializer.validated_data.get('last_name', '')

        User = get_user_model()
        # Check phone uniqueness via Profile and also username collision
        if Profile.objects.filter(phone=phone).exists() or User.objects.filter(username=phone).exists():
            return Response({'detail': 'Phone is already registered'}, status=status.HTTP_400_BAD_REQUEST)

        user = User(username=phone)
        user.set_password(password)
        user.first_name = first_name
        user.last_name = last_name
        user.save()

        profile = Profile.objects.create(user=user, phone=phone, first_name=first_name, last_name=last_name)

        token = generate_jwt(user.id)
        data = {'token': token, 'user': ProfileSerializer(profile).data}
        return Response(data, status=status.HTTP_201_CREATED)


class LoginView(APIView):
    authentication_classes = []
    permission_classes = [AllowAny]

    @extend_schema(request=LoginInputSerializer, responses={200: AuthResponseSerializer, 400: None})
    def post(self, request):
        serializer = LoginInputSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        phone = serializer.validated_data.get('phone')
        password = serializer.validated_data.get('password')

        try:
            profile = Profile.objects.select_related('user').get(phone=phone)
        except Profile.DoesNotExist:
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        user = profile.user
        if not user.check_password(password):
            return Response({'detail': 'Invalid credentials'}, status=status.HTTP_400_BAD_REQUEST)

        token = generate_jwt(user.id)
        data = {'token': token, 'user': ProfileSerializer(profile).data}
        return Response(data, status=status.HTTP_200_OK)
