# Authentification et fournisseurs OAuth

Practicora utilise Supabase Auth pour la connexion. Les fournisseurs externes servent uniquement à identifier l’utilisateur : les rôles institutionnels sont ensuite récupérés depuis la base de données.

## Fournisseurs prévus

Les boutons affichés sont contrôlés par :

```env
NEXT_PUBLIC_AUTH_PROVIDERS=google,github,azure,apple
```

Retirer un identifiant de cette variable masque simplement le fournisseur dans l’interface.

## URL de callback

Pour Google, GitHub, Microsoft ou Apple, l’URL de callback principale est celle du projet Supabase :

```text
https://VOTRE-PROJET.supabase.co/auth/v1/callback
```

Dans **Supabase → Authentication → URL Configuration**, ajouter aussi les URL de l’application :

```text
http://localhost:3000/**
https://votre-domaine.ca/**
```

Practicora termine ensuite la connexion avec les routes :

```text
/{locale}/auth/callback
/{locale}/auth/resolve
```

## Google

1. Créer un projet dans Google Cloud.
2. Configurer l’écran de consentement OAuth.
3. Créer un client OAuth de type Web.
4. Ajouter l’URL `/auth/v1/callback` de Supabase.
5. Copier le Client ID et le Client Secret dans Supabase Auth.

## GitHub

1. Créer une OAuth App GitHub.
2. Utiliser l’URL Supabase comme `Authorization callback URL`.
3. Copier le Client ID et le Client Secret dans Supabase.

## Microsoft

1. Créer une App Registration dans Microsoft Entra.
2. Ajouter l’URL Supabase comme Redirect URI Web.
3. Créer un secret client.
4. Configurer le fournisseur Azure dans Supabase Auth.

## Apple

La connexion Apple demande un compte Apple Developer, un Service ID et une clé de connexion. Les domaines et URL de retour doivent correspondre aux valeurs données par Supabase.

## Rôles après connexion

Le fournisseur OAuth ne choisit jamais le rôle. Après authentification, Practicora charge les adhésions, rôles et permissions déjà associés au compte.

Le schéma prévoit aussi la possibilité d’ajouter plus tard une connexion SSO institutionnelle, mais celle-ci doit être configurée et testée séparément.
