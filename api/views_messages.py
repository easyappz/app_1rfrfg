from django.utils.dateparse import parse_datetime
from rest_framework.views import APIView
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework import status

from .authentication import JWTAuthentication
from .models import Dialog, Message
from .serializers import MessageSerializer


class MessageListCreateView(APIView):
    authentication_classes = [JWTAuthentication]
    permission_classes = [IsAuthenticated]

    def _get_dialog_for_user(self, dialog_id, user):
        try:
            dialog = Dialog.objects.get(pk=dialog_id)
        except Dialog.DoesNotExist:
            return None, Response({'detail': 'Dialog not found'}, status=status.HTTP_404_NOT_FOUND)
        if user.id not in (dialog.user1_id, dialog.user2_id):
            return None, Response({'detail': 'Forbidden'}, status=status.HTTP_403_FORBIDDEN)
        return dialog, None

    def get(self, request, dialog_id: int):
        dialog, error = self._get_dialog_for_user(dialog_id, request.user)
        if error:
            return error

        try:
            limit = int(request.query_params.get('limit', 50))
        except ValueError:
            return Response({'detail': 'limit must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
        try:
            offset = int(request.query_params.get('offset', 0))
        except ValueError:
            return Response({'detail': 'offset must be an integer'}, status=status.HTTP_400_BAD_REQUEST)

        limit = max(1, min(limit, 200))
        offset = max(0, offset)

        after_str = request.query_params.get('after')
        qs = Message.objects.filter(dialog=dialog)
        if after_str:
            after_dt = parse_datetime(after_str)
            if not after_dt:
                return Response({'detail': 'after must be ISO datetime'}, status=status.HTTP_400_BAD_REQUEST)
            qs = qs.filter(created_at__gt=after_dt)

        total = qs.count()
        items = qs.order_by('created_at')[offset:offset + limit]
        data = {
            'items': MessageSerializer(items, many=True).data,
            'total': total,
            'limit': limit,
            'offset': offset,
        }
        return Response(data)

    def post(self, request, dialog_id: int):
        dialog, error = self._get_dialog_for_user(dialog_id, request.user)
        if error:
            return error

        ciphertext = request.data.get('ciphertext')
        if not isinstance(ciphertext, str) or not ciphertext:
            return Response({'detail': 'ciphertext is required and must be a non-empty string'}, status=status.HTTP_400_BAD_REQUEST)

        content_type = request.data.get('content_type', 'text')
        if content_type not in ('text', 'image'):
            return Response({'detail': "content_type must be 'text' or 'image'"}, status=status.HTTP_400_BAD_REQUEST)

        media_mime = ''
        media_name = ''
        media_size = None

        if content_type == 'image':
            media_mime = request.data.get('media_mime')
            media_name = request.data.get('media_name')
            media_size_raw = request.data.get('media_size')

            if not isinstance(media_mime, str) or not media_mime.strip():
                return Response({'detail': 'media_mime is required and must be a non-empty string for image messages'}, status=status.HTTP_400_BAD_REQUEST)
            if not isinstance(media_name, str) or not media_name.strip():
                return Response({'detail': 'media_name is required and must be a non-empty string for image messages'}, status=status.HTTP_400_BAD_REQUEST)
            try:
                media_size = int(media_size_raw)
            except (TypeError, ValueError):
                return Response({'detail': 'media_size is required and must be a positive integer for image messages'}, status=status.HTTP_400_BAD_REQUEST)
            if media_size <= 0:
                return Response({'detail': 'media_size must be greater than 0 for image messages'}, status=status.HTTP_400_BAD_REQUEST)

        message = Message.objects.create(
            dialog=dialog,
            sender=request.user,
            ciphertext=ciphertext,
            content_type=content_type,
            media_mime=media_mime,
            media_name=media_name,
            media_size=media_size,
        )
        return Response(MessageSerializer(message).data, status=status.HTTP_201_CREATED)
