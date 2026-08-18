# Configurer Supabase

Practicora utilise Supabase pour l’authentification et pour les fonctions qui ont besoin d’une base de données partagée.

Cette documentation part du principe qu’un **projet Supabase de développement ou de staging** est utilisé avant toute production.

## 1. Installer le schéma

Pour une nouvelle installation, exécuter dans **Supabase → SQL Editor** :

```text
supabase/schema.sql
```

Le schéma contient notamment :

- `practicora_snapshots`;
- profils utilisateurs;
- organisations et adhésions;
- rôles et permissions;
- programmes et cohortes;
- stages et assignations;
- invitations;
- modèles et rapports;
- notifications;
- audit;
- préférences d’espace;
- politiques Row Level Security;
- fonctions RPC utilisées par l’application.

`supabase/institutional-schema.sql` correspond à la partie institutionnelle séparée. Pour une nouvelle base, le fichier cumulatif `schema.sql` reste le plus simple.

## 2. Variables d’environnement

Créer `.env.local` à partir de `.env.example`, puis définir les valeurs nécessaires.

Exemple :

```env
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_CONTACT_EMAIL=bonjour@practicora.app
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIQUE
NEXT_PUBLIC_AUTH_PROVIDERS=google,github,azure,apple
NEXT_PUBLIC_ENABLE_INSTITUTIONAL=true
```

La clé `anon` publique peut être utilisée côté client avec les politiques RLS correctement configurées. Une clé `service_role`, `sb_secret_*` ou tout autre secret privilégié ne doit jamais être placé dans `NEXT_PUBLIC_*`.

## 3. URL d’authentification

Dans **Authentication → URL Configuration** :

### Local

```text
Site URL: http://localhost:3000
Redirect URL: http://localhost:3000/**
```

### Site déployé

```text
Site URL: https://VOTRE-DOMAINE
Redirect URL: https://VOTRE-DOMAINE/**
```

Garder aussi l’URL locale dans les Redirect URLs si le développement local doit continuer à fonctionner.

## 4. Fournisseurs OAuth

Les fournisseurs prévus sont Google, GitHub, Microsoft et Apple.

```env
NEXT_PUBLIC_AUTH_PROVIDERS=google,github,azure,apple
```

Cette variable contrôle les boutons visibles. Chaque fournisseur doit aussi être configuré dans Supabase avec ses propres identifiants.

Voir `docs/AUTH-PROVIDERS.md`.

## 5. Courriels Supabase

Des modèles sont présents pour :

```text
supabase/email-template-confirmation.html
supabase/email-template-recovery.html
```

Les parcours concernés comprennent la confirmation d’inscription, le renvoi de confirmation et la récupération du mot de passe.

## 6. Invitations institutionnelles

La fonction se trouve ici :

```text
supabase/functions/send-invitation
```

Déploiement :

```powershell
supabase functions deploy send-invitation
```

Exemple de configuration des secrets :

```powershell
supabase secrets set `
  SITE_URL=https://VOTRE-DOMAINE `
  RESEND_API_KEY=VOTRE_CLE_RESEND `
  INVITATION_FROM_EMAIL="Practicora <noreply@VOTRE-DOMAINE>"
```

Si aucun service de courriel n’est connecté, l’invitation peut encore être créée et son lien copié manuellement.

## 7. Rôles et espaces

Après connexion, Practicora :

1. récupère la session Supabase;
2. vérifie les informations du compte;
3. appelle `resolve_practicora_context()`;
4. charge les organisations, rôles et permissions disponibles;
5. restaure un espace autorisé;
6. ouvre le tableau de bord adapté.

Un utilisateur ne doit pas pouvoir se donner lui-même un rôle privilégié en modifiant des données côté navigateur.

## 8. Tests de base

Après l’installation, je recommande de vérifier :

1. création et confirmation d’un compte;
2. création du profil;
3. synchronisation d’une donnée personnelle;
4. accès à une organisation;
5. programme et cohorte;
6. invitation d’un second compte;
7. rôle reconnu après connexion;
8. création ou assignation d’un stage;
9. soumission et révision d’un rapport;
10. notifications et audit si utilisés.

## 9. Sécurité à tester

Avant d’utiliser de vraies données :

- tester les politiques RLS avec plusieurs comptes;
- vérifier qu’un étudiant ne voit jamais les données privées d’un autre étudiant;
- vérifier qu’un superviseur ne voit que les stages prévus;
- vérifier les permissions des enseignants et administrateurs;
- tester les restrictions de plateforme;
- ne jamais exposer une clé privilégiée dans le navigateur;
- faire les essais dans un environnement de staging avant la production.
