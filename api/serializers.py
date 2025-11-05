from django.contrib.auth import get_user_model
from rest_framework import serializers

from .models import Profile, Dialog, Message


class ProfileSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'phone', 'first_name', 'last_name']


class PublicUserSerializer(serializers.ModelSerializer):
    id = serializers.IntegerField(source='user.id', read_only=True)

    class Meta:
        model = Profile
        fields = ['id', 'phone', 'first_name', 'last_name']


class ProfileUpdateSerializer(serializers.ModelSerializer):
    class Meta:
        model = Profile
        fields = ['first_name', 'last_name']


class DialogSerializer(serializers.ModelSerializer):
    participant = serializers.SerializerMethodField()
    last_message = serializers.SerializerMethodField()

    class Meta:
        model = Dialog
        fields = ['id', 'participant', 'created_at', 'last_message']

    def get_participant(self, obj):
        request = self.context.get('request')
        current_user = getattr(request, 'user', None)
        other_user = obj.user2 if obj.user1_id == getattr(current_user, 'id', None) else obj.user1
        try:
            profile = Profile.objects.get(user=other_user)
        except Profile.DoesNotExist:
            return {'id': other_user.id, 'phone': '', 'first_name': '', 'last_name': ''}
        return PublicUserSerializer(profile).data

    def get_last_message(self, obj):
        last = obj.messages.order_by('-created_at').first()
        if not last:
            return None
        data = {
            'ciphertext': last.ciphertext,
            'created_at': last.created_at,
            'content_type': getattr(last, 'content_type', 'text'),
        }
        if getattr(last, 'media_mime', ''):
            data['media_mime'] = last.media_mime
        return data


class MessageSerializer(serializers.ModelSerializer):
    class Meta:
        model = Message
        fields = [
            'id', 'dialog', 'sender', 'ciphertext',
            'content_type', 'media_mime', 'media_name', 'media_size',
            'created_at'
        ]
        read_only_fields = ['id', 'created_at']
