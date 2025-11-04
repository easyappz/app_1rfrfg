from django.contrib.auth import get_user_model
from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .authentication import JWTAuthentication
from .models import Dialog
from .serializers import DialogSerializer


class DialogListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        dialogs = (
            Dialog.objects.select_related('user1', 'user2')
            .filter(Q(user1=user) | Q(user2=user))
            .order_by('-created_at')
        )
        data = DialogSerializer(dialogs, many=True, context={'request': request}).data
        return Response(data)

    def post(self, request):
        user = request.user
        user_id = request.data.get('user_id')
        if user_id is None:
            return Response({'detail': 'user_id is required'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            user_id = int(user_id)
        except (TypeError, ValueError):
            return Response({'detail': 'user_id must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        if user_id == user.id:
            return Response({'detail': 'Cannot create dialog with yourself'}, status=status.HTTP_400_BAD_REQUEST)

        User = get_user_model()
        try:
            other = User.objects.get(pk=user_id)
        except User.DoesNotExist:
            return Response({'detail': 'User not found'}, status=status.HTTP_404_NOT_FOUND)

        user1_id, user2_id = sorted([user.id, other.id])

        dialog, _created = Dialog.objects.get_or_create(user1_id=user1_id, user2_id=user2_id)

        data = DialogSerializer(dialog, context={'request': request}).data
        return Response(data, status=status.HTTP_201_CREATED if _created else status.HTTP_200_OK)


class DialogRetrieveView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request, dialog_id: int):
        try:
            dialog = Dialog.objects.select_related('user1', 'user2').get(pk=dialog_id)
        except Dialog.DoesNotExist:
            return Response({'detail': 'Dialog not found'}, status=status.HTTP_404_NOT_FOUND)

        if request.user.id not in (dialog.user1_id, dialog.user2_id):
            return Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)

        data = DialogSerializer(dialog, context={'request': request}).data
        return Response(data)
