# Déployer Practicora

Voici la procédure que j’utilise comme référence pour mettre Practicora en ligne avec **GitHub, Vercel et Supabase**.

Pour un simple test, un projet de staging est préférable à une vraie production.

## 1. Vérifier le projet

```powershell
npm.cmd ci
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Corriger les erreurs avant de pousser la version à déployer.

## 2. Préparer Supabase

1. Créer un projet Supabase de test ou de staging.
2. Exécuter `supabase/schema.sql` dans le SQL Editor.
3. Configurer les URL d’authentification.
4. Activer uniquement les fournisseurs OAuth réellement utilisés.
5. Déployer `send-invitation` si les invitations par courriel doivent fonctionner.
6. Tester les politiques RLS avec plusieurs comptes.

Voir aussi :

- `docs/SUPABASE.md`;
- `docs/AUTH-PROVIDERS.md`;
- `docs/INSTITUTIONAL-SETUP.md`.

## 3. Mettre le projet sur GitHub

Exemple pour un nouveau dépôt :

```powershell
git init
git add .
git commit -m "chore: prepare Practicora deployment"
git branch -M main
git remote add origin https://github.com/VOTRE-COMPTE/practicora-saas.git
git push -u origin main
```

`.env.local` ne doit jamais être envoyé sur GitHub.

## 4. Créer le projet Vercel

1. Connecter le dépôt GitHub à Vercel.
2. Importer le projet.
3. Vérifier que Vercel détecte Next.js.
4. Garder `npm run build` comme commande de build.
5. Ajouter les variables d’environnement.

## 5. Variables principales

Exemple :

```env
NEXT_PUBLIC_SITE_URL=https://VOTRE-DOMAINE
NEXT_PUBLIC_CONTACT_EMAIL=bonjour@VOTRE-DOMAINE
NEXT_PUBLIC_SUPABASE_URL=https://VOTRE-PROJET.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=VOTRE_CLE_PUBLIQUE_SUPABASE
NEXT_PUBLIC_AUTH_PROVIDERS=google,github,azure,apple
NEXT_PUBLIC_ENABLE_INSTITUTIONAL=true
```

Ne jamais mettre une clé `service_role` ou un autre secret dans une variable `NEXT_PUBLIC_*`.

## 6. OAuth

Pour chaque fournisseur utilisé :

1. créer l’application OAuth;
2. utiliser l’URL de callback Supabase;
3. ajouter le Client ID et le secret dans Supabase;
4. activer le fournisseur;
5. l’ajouter à `NEXT_PUBLIC_AUTH_PROVIDERS`;
6. tester connexion et déconnexion.

Les détails sont dans `docs/AUTH-PROVIDERS.md`.

## 7. Domaine

Dans Vercel :

1. ajouter le domaine;
2. appliquer les enregistrements DNS proposés;
3. attendre la validation du certificat;
4. mettre `NEXT_PUBLIC_SITE_URL` à jour;
5. mettre aussi à jour les URL autorisées dans Supabase;
6. redéployer.

## 8. Courriels et invitations

Si les invitations institutionnelles doivent être envoyées par courriel :

```bash
supabase functions deploy send-invitation
```

Puis configurer les secrets nécessaires côté Supabase, par exemple `SITE_URL`, `RESEND_API_KEY` et `INVITATION_FROM_EMAIL`.

Sans service de courriel, l’application peut encore générer un lien d’invitation à copier manuellement.

## 9. Tests après déploiement

Je vérifie au minimum :

### Public

- `/fr` et `/en`;
- navigation principale;
- sitemap et robots;
- métadonnées;
- pages légales et contact.

### Authentification

- inscription;
- confirmation du courriel;
- connexion;
- récupération du mot de passe;
- OAuth configuré;
- déconnexion.

### Espace étudiant

- journal;
- sauvegarde;
- rapports;
- changement de langue;
- graphiques;
- paramètres.

### Partie institutionnelle

- création ou accès à une organisation;
- invitation;
- rôle reconnu après connexion;
- programme et cohorte;
- assignation de stage;
- rapport et révision;
- permissions;
- responsive mobile/tablette/desktop.

## 10. Avant une vraie production

Une version accessible au public demande davantage que le simple déploiement Vercel : tests RLS, sauvegardes, données de staging, vérification des courriels, textes légaux, accessibilité et plan de récupération en cas de problème.
