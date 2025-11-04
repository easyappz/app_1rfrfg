from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import serializers
from django.utils import timezone
from drf_spectacular.utils import extend_schema


class HelloMessageSerializer(serializers.Serializer):
    message = serializers.CharField()
    timestamp = serializers.DateTimeField()


class HelloView(APIView):
    """
    A simple API endpoint that returns a greeting message.
    """

    @extend_schema(
        responses={200: HelloMessageSerializer}, description="Get a hello world message"
    )
    def get(self, request):
        data = {"message": "Hello!", "timestamp": timezone.now()}
        return Response(data)
