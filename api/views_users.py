from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .authentication import JWTAuthentication
from .models import Profile
from .serializers import ProfileSerializer, PublicUserSerializer, ProfileUpdateSerializer


class MeView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        try:
            profile = Profile.objects.select_related('user').get(user=request.user)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)
        return Response(ProfileSerializer(profile).data)

    def patch(self, request):
        try:
            profile = Profile.objects.select_related('user').get(user=request.user)
        except Profile.DoesNotExist:
            return Response({'detail': 'Profile not found'}, status=status.HTTP_404_NOT_FOUND)

        serializer = ProfileUpdateSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        # Keep Django User names in sync
        updated = False
        if 'first_name' in serializer.validated_data:
            request.user.first_name = serializer.validated_data['first_name']
            updated = True
        if 'last_name' in serializer.validated_data:
            request.user.last_name = serializer.validated_data['last_name']
            updated = True
        if updated:
            request.user.save(update_fields=['first_name', 'last_name'])

        return Response(ProfileSerializer(profile).data)


class UserSearchView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        phone = request.query_params.get('phone')
        if phone is None:
            return Response({'detail': 'Query param "phone" is required'}, status=status.HTTP_400_BAD_REQUEST)

        qs = (
            Profile.objects.select_related('user')
            .filter(phone__icontains=phone)
            .exclude(user=request.user)[:50]
        )
        data = PublicUserSerializer(qs, many=True).data
        return Response(data)
