from rest_framework import serializers
from django.contrib.auth import get_user_model

User = get_user_model()

class UserSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True)
    profile_picture = serializers.ImageField(required=False, allow_null=True)

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'bio', 'password', 'profile_picture')

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user
