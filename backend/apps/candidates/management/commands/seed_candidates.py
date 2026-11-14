from django.contrib.auth.hashers import make_password
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.accounts.models import User
from apps.candidates.models import CandidateProfile


class Command(BaseCommand):
    help = "Create or update 1000 fictional candidate accounts and profiles."

    @transaction.atomic
    def handle(self, *args, **options):
        first_names = [
            "Amine", "Youssef", "Adam", "Ayoub", "Hamza",
            "Mehdi", "Anas", "Omar", "Bilal", "Karim",
            "Soufiane", "Rayan", "Zakaria", "Ismail", "Ilyas",
            "Marouane", "Hicham", "Nabil", "Reda", "Samir",
            "Amina", "Salma", "Sara", "Imane", "Yasmine",
            "Aya", "Lina", "Ines", "Mariam", "Nour",
            "Ghita", "Hajar", "Kenza", "Khadija", "Asmae",
            "Fatima", "Chaimae", "Wiam", "Siham", "Zineb",
        ]
        last_names = [
            "Alaoui", "Benali", "El Amrani", "Berrada", "Idrissi",
            "El Fassi", "Tazi", "Bennani", "Chraibi", "Lahlou",
            "Mansouri", "Kettani", "Filali", "Ouazzani", "Rami",
            "Bennis", "El Khatib", "Naciri", "Fikri", "Ouali",
            "Bousfiha", "Slaoui", "Belhaj", "El Idrissi", "Mernissi",
        ]
        locations = ["Casablanca", "Rabat", "Marrakech", "Tanger", "Agadir", "Fes"]
        titles = [
            "Etudiant en informatique",
            "Developpeur junior",
            "Analyste de donnees junior",
            "Etudiant en gestion",
        ]

        users_created = 0
        users_updated = 0
        profiles_created = 0

        for number in range(1, 1001):
            first_name = first_names[(number - 1) % len(first_names)]
            last_name = last_names[(number - 1) // len(first_names)]
            username = f"candidat_{number:04d}"
            email_name = f"{first_name}.{last_name.replace(' ', '')}".lower()
            email = f"{email_name}.{number:04d}@example.test"

            user, created = User.objects.get_or_create(
                username=username,
                defaults={
                    "email": email,
                    "first_name": first_name,
                    "last_name": last_name,
                    "role": User.Role.CANDIDAT,
                    "password": make_password(None),
                },
            )

            if created:
                users_created += 1
            else:
                user.email = email
                user.first_name = first_name
                user.last_name = last_name
                user.role = User.Role.CANDIDAT
                user.save(update_fields=["email", "first_name", "last_name", "role"])
                users_updated += 1

            _, profile_created = CandidateProfile.objects.get_or_create(
                user=user,
                defaults={
                    "location": locations[(number - 1) % len(locations)],
                    "professional_title": titles[(number - 1) % len(titles)],
                    "biography": "Profil fictif genere pour les tests du projet.",
                },
            )
            profiles_created += int(profile_created)

        self.stdout.write(
            self.style.SUCCESS(
                f"Termine : {users_created} comptes crees, "
                f"{users_updated} comptes mis a jour et "
                f"{profiles_created} profils crees."
            )
        )