# Backend SkillBridge AI

Backend de la plateforme SkillBridge AI, construit avec Django et Django REST Framework. Il fournit les API d’authentification, de profil candidat, d’offres, de compétences, de candidatures et de téléversement de CV.

> Ce document décrit l’implémentation actuelle. L’analyse automatique des CV et le calcul algorithmique du matching doivent être intégrés par l’équipe data science. Le backend enregistre actuellement les CV et les résultats d’analyse, mais ne les calcule pas lui-même.

## Technologies

- Python
- Django 4.2
- Django REST Framework
- SimpleJWT pour l’authentification par tokens
- MySQL
- API publique Jobicy pour importer des offres d’emploi

Les dépendances Python sont listées dans `requirements.txt`.

## Structure principale

```text
backend/
├── apps/
│   ├── accounts/       # Utilisateurs, inscription, connexion et profil
│   ├── candidates/     # Profil candidat
│   ├── jobs/           # Offres et synchronisation Jobicy
│   ├── skills/         # Compétences candidat et écarts
│   ├── applications/   # Candidatures et historique de statut
│   ├── resumes/        # Fichiers CV, analyses et preuves de compétences
│   ├── matching/       # Modèle Correspondance entre profil et offre
│   └── dashboard/      # Statistiques du tableau de bord
├── config/
│   ├── settings.py     # Configuration Django et MySQL
│   └── urls.py         # Routes principales de l’API
├── manage.py
└── requirements.txt
```

## Préparer l’environnement local

Utiliser une base de développement **distincte de la base personnelle d’un autre membre de l’équipe**. Ne pas partager les identifiants MySQL ni le fichier `.env`.

À la racine du dépôt, créer et activer un environnement virtuel si nécessaire :

```powershell
python -m venv .venv
.\.venv\Scripts\Activate.ps1
```

Créer une base MySQL et un utilisateur dédiés. Exemple à exécuter dans MySQL avec un compte qui a les droits nécessaires :

```sql
CREATE DATABASE skillbridge_science_dev
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

CREATE USER 'skillbridge_science'@'localhost'
  IDENTIFIED BY 'REMPLACER_PAR_UN_MOT_DE_PASSE_FORT';

GRANT ALL PRIVILEGES ON skillbridge_science_dev.*
  TO 'skillbridge_science'@'localhost';
```

Créer ensuite `backend/.env` avec les identifiants de cette base :

```env
DJANGO_SECRET_KEY=REMPLACER_PAR_UNE_CLE_LOCALE
DB_NAME=skillbridge_science_dev
DB_USER=skillbridge_science
DB_PASSWORD=REMPLACER_PAR_UN_MOT_DE_PASSE_FORT
DB_HOST=127.0.0.1
DB_PORT=3306
```

Générer une clé Django locale depuis PowerShell :

```powershell
cd C:\projects\cv_projet\backend
python -c "from django.core.management.utils import get_random_secret_key; print(get_random_secret_key())"
```

Mettre la valeur obtenue dans `DJANGO_SECRET_KEY` du `.env`. Ne pas mettre cette clé directement dans `settings.py`, ne pas la publier et ne pas committer `.env`.

## Installer, vérifier et initialiser

Depuis `backend/` :

```powershell
python -m pip install -r requirements.txt
python manage.py check
python manage.py migrate
```

`migrate` crée ou met à jour le schéma de la base ; il ne charge pas de candidats, de CV ni d’offres.

Lancer les tests backend :

```powershell
python manage.py test
```

Démarrer le serveur de développement :

```powershell
python manage.py runserver
```

Le serveur Django est alors disponible par défaut à `http://127.0.0.1:8000/`.

## Modèles importants

- **User** (`accounts.User`) : utilisateur Django avec une adresse e-mail unique et un rôle (`candidat` ou `admin`).
- **CandidateProfile** : informations complémentaires du candidat ; relation un-à-un avec l’utilisateur.
- **OffreEmploi** : titre, entreprise, localisation, contrat, description, source, URL et statut actif. Les offres Jobicy ont un identifiant externe.
- **Competence** : nom et catégorie d’une compétence.
- **CompetenceProfil** : compétence, niveau, score et état de vérification du profil candidat.
- **CompetenceRequise** : compétence requise par une offre, niveau attendu, poids et caractère obligatoire.
- **Candidature** et **HistoriqueCandidature** : suivi local d’une candidature et historique de ses statuts.
- **CV** : nom, chemin de stockage privé, date et profil candidat associé.
- **AnalyseCV** : statut, score, rôles suggérés, commentaires et avertissements.
- **PreuveCompetence** : compétence détectée pour une analyse, niveau, confiance et extrait du CV.
- **Correspondance** (`matching.Correspondance`) : score et explication associés à une paire profil/offre.

Les niveaux de compétence sont `DEBUTANT`, `INTERMEDIAIRE`, `AVANCE` et `EXPERT`. Les statuts d’analyse CV sont `EN_COURS`, `TERMINEE` et `ECHEC`.

## API disponible

Les routes métier exigent normalement un access token JWT, sauf l’inscription et la connexion.

| Méthode | Route | Description |
|---|---|---|
| `POST` | `/auth/register` | Créer un compte candidat |
| `POST` | `/auth/login` | Se connecter et obtenir les tokens |
| `GET` | `/auth/me` | Lire le profil courant |
| `PATCH` | `/auth/me` | Modifier les champs de profil autorisés |
| `POST` | `/auth/token/refresh` | Renouveler l’access token |
| `GET` | `/dashboard/analytics` | Statistiques du tableau de bord |
| `GET` | `/jobs/` | Lister les offres actives |
| `GET` | `/jobs/<id>` | Détail d’une offre active |
| `GET` | `/jobs/recommended` | Offres avec correspondances déjà enregistrées |
| `GET` | `/skills/` | Compétences du candidat courant |
| `GET` | `/skills/gaps` | Écarts vis-à-vis des compétences obligatoires requises |
| `GET` | `/applications/` | Lister les candidatures du candidat courant |
| `POST` | `/applications/` | Créer une candidature de suivi locale |
| `GET` | `/cv/analyses` | Historique des analyses CV du candidat courant |
| `POST` | `/cv/analyze` | Téléverser un CV PDF et créer une analyse en attente |

Exemple de connexion :

```http
POST /auth/login
Content-Type: application/json
```

```json
{
  "email": "candidat@example.test",
  "password": "mot-de-passe"
}
```

La réponse de connexion contient `user`, `token` (access token) et `refresh`. Pour les routes protégées, envoyer :

```http
Authorization: Bearer <access-token>
```

L’inscription attend `email`, `password`, `firstName` et `lastName`. La mise à jour de profil accepte notamment `firstName`, `lastName`, `phone`, `location`, `headline` et `bio`.

La création de candidature attend un `job_id` et accepte facultativement `cover_letter`. Une candidature à une offre inactive/expirée est refusée ; un doublon renvoie un conflit. Cette opération enregistre un suivi dans SkillBridge : elle ne soumet pas la candidature à l’employeur.

La liste des offres accepte les filtres `search`, `type`, `remote` et `min_match`. Les recommandations dépendent des lignes `Correspondance` déjà calculées et enregistrées.

## Offres d’emploi et Jobicy

L’import est fourni par la commande :

```powershell
python manage.py sync_jobicy
```

La commande récupère les annonces EMEA et Anywhere depuis l’API Jobicy, crée ou met à jour les offres par identifiant externe, puis vérifie leur statut auprès de Jobicy. Elle affiche le nombre d’offres créées, mises à jour, actives, fermées et inconnues.

- Le nombre d’offres varie selon les annonces disponibles ; un total antérieur, par exemple 499, n’est pas garanti.
- La commande charge des offres, pas des profils candidats ni des CV.
- Respecter la limite opérationnelle d’au plus une synchronisation par heure.
- La commande actuelle ne semble pas imposer elle-même ce délai ; ne pas la lancer fréquemment.
- Les annonces gardent leur URL Jobicy d’origine.

## Collaboration avec l’équipe data science

### Travail sur une branche séparée

Pour partir du code backend partagé, une fois que `feature/backend-django` est poussée sur le dépôt distant :

```powershell
git fetch origin
git switch --track -c feature/data-science origin/feature/backend-django
```

Les changements du data scientist restent sur `feature/data-science`. Ils ne rejoignent pas `main` sans Pull Request fusionnée.

### Données et traitement CV

Les migrations créent les tables, mais ne fournissent pas de données de test. L’équipe science peut :

1. Utiliser une base MySQL locale distincte.
2. Exécuter `python manage.py migrate`.
3. Charger des données synthétiques ou anonymisées pour ses expérimentations.
4. Coordonner avec l’équipe backend le contrat d’entrée/sortie du traitement avant de modifier les statuts ou d’enregistrer des résultats.

Le CV est stocké sous `MEDIA_ROOT` (par défaut `backend/private_uploads/`) et son chemin relatif figure dans `CV.chemin_stockage`. Ce stockage est privé ; ne committer ni fichiers CV ni export de base de données. Les CV personnels ne doivent être utilisés qu’avec autorisation et par un moyen de transfert sécurisé.

À ce stade, `POST /cv/analyze` valide et stocke le PDF, puis crée une `AnalyseCV` avec le statut `EN_COURS` et un avertissement indiquant que l’analyse automatique n’est pas activée. Il n’existe pas actuellement de traitement automatique déclenché par cette route ni de route dédiée pour télécharger le CV. L’intégration du traitement et l’accès sécurisé aux fichiers doivent donc être coordonnés avec l’équipe backend.

Le calcul des scores de matching n’est pas effectué par les vues d’offres : elles lisent les `Correspondance` existantes. `/jobs/recommended` ne renvoie donc pas de recommandations si aucune correspondance n’a été créée.

## Sécurité et fichiers locaux

Ne jamais committer :

- `backend/.env` ou toute clé secrète ;
- `backend/private_uploads/` ou des CV réels ;
- des dumps de la base contenant des données personnelles ;
- des mots de passe ou tokens.

Vérifier les fichiers préparés avant chaque commit :

```powershell
git status --short
git diff --cached --check
git diff --cached --stat
```