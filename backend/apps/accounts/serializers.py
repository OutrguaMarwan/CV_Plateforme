from uuid import uuid4

from django.contrib.auth.password_validation import validate_password
from django.db import transaction
from rest_framework import serializers

from apps.accounts.models import User
from apps.candidates.models import CandidateProfile


class UserSerializer(serializers.ModelSerializer):
    id = serializers.CharField(read_only=True)
    firstName = serializers.CharField(source="first_name", read_only=True)
    lastName = serializers.CharField(source="last_name", read_only=True)
    createdAt = serializers.DateTimeField(source="date_joined", read_only=True)
    role = serializers.SerializerMethodField()
    phone = serializers.SerializerMethodField()
    location = serializers.SerializerMethodField()
    headline = serializers.SerializerMethodField()
    bio = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "firstName",
            "lastName",
            "role",
            "phone",
            "location",
            "headline",
            "bio",
            "createdAt",
        )

    def get_role(self, user):
        roles = {
            User.Role.CANDIDAT: "student",
            User.Role.ADMIN: "admin",
        }
        return roles[user.role]

    def get_phone(self, user):
        profile = getattr(user, "candidate_profile", None)
        return profile.phone if profile else ""

    def get_location(self, user):
        profile = getattr(user, "candidate_profile", None)
        return profile.location if profile else ""

    def get_headline(self, user):
        profile = getattr(user, "candidate_profile", None)
        return profile.professional_title if profile else ""

    def get_bio(self, user):
        profile = getattr(user, "candidate_profile", None)
        return profile.biography if profile else ""


class ProfileUpdateSerializer(serializers.Serializer):
    email = serializers.EmailField(required=False)
    firstName = serializers.CharField(
        source="first_name",
        required=False,
        max_length=150,
    )
    lastName = serializers.CharField(
        source="last_name",
        required=False,
        max_length=150,
    )
    phone = serializers.CharField(required=False, allow_blank=True, max_length=30)
    location = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )
    headline = serializers.CharField(
        required=False,
        allow_blank=True,
        max_length=150,
    )
    bio = serializers.CharField(required=False, allow_blank=True)

    def validate_email(self, email):
        user = self.instance
        if User.objects.filter(email__iexact=email).exclude(pk=user.pk).exists():
            raise serializers.ValidationError(
                "Cette adresse e-mail est déjà utilisée."
            )
        return email

    def validate(self, attrs):
        if not attrs:
            raise serializers.ValidationError(
                "Indique au moins un champ à modifier."
            )
        return attrs

    @transaction.atomic
    def update(self, user, validated_data):
        profile_values = {}

        for field in ("phone", "location"):
            if field in validated_data:
                profile_values[field] = validated_data.pop(field)

        if "headline" in validated_data:
            profile_values["professional_title"] = validated_data.pop("headline")

        if "bio" in validated_data:
            profile_values["biography"] = validated_data.pop("bio")

        for field, value in validated_data.items():
            setattr(user, field, value)

        if validated_data:
            user.save(update_fields=list(validated_data))

        if profile_values:
            profile, _created = CandidateProfile.objects.get_or_create(user=user)
            for field, value in profile_values.items():
                setattr(profile, field, value)
            profile.save(update_fields=list(profile_values))

        return user


class RegisterSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        validators=[validate_password],
    )
    firstName = serializers.CharField(source="first_name", max_length=150)
    lastName = serializers.CharField(source="last_name", max_length=150)

    def validate_email(self, email):
        if User.objects.filter(email__iexact=email).exists():
            raise serializers.ValidationError(
                "Cette adresse e-mail est déjà utilisée."
            )
        return email

    @transaction.atomic
    def create(self, validated_data):
        user = User.objects.create_user(
            username=f"user_{uuid4().hex}",
            role=User.Role.CANDIDAT,
            **validated_data,
        )
        CandidateProfile.objects.create(user=user)
        return user


class LoginSerializer(serializers.Serializer):
    email = serializers.EmailField()
    password = serializers.CharField(
        write_only=True,
        trim_whitespace=False,
    )