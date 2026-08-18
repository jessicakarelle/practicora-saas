# Configurer la partie institutionnelle

Cette partie de Practicora permet de tester une utilisation avec plusieurs personnes et plusieurs rôles dans une même organisation.

Pour éviter de mélanger les tests et de vraies données, il vaut mieux commencer dans un projet Supabase de staging.

## 1. Installer la base

Dans le SQL Editor de Supabase :

```text
supabase/schema.sql
```

## 2. Créer ou ouvrir une organisation

Après connexion avec un compte vérifié, la route prévue pour la création est :

```text
/fr/app/organization/new
```

La création dépend des permissions du compte. Dans la version actuelle, les contrôles de plateforme peuvent limiter cette action.

## 3. Ordre de configuration conseillé

1. organisation;
2. programmes;
3. cohortes;
4. modèles de rapports;
5. membres et invitations;
6. stages et assignations;
7. règles de conservation si elles sont utilisées;
8. tests avec plusieurs comptes.

## 4. Invitations par courriel

La fonction Edge se trouve dans :

```text
supabase/functions/send-invitation
```

Déploiement :

```bash
supabase functions deploy send-invitation
```

Exemple de secrets :

```bash
supabase secrets set SITE_URL=https://votre-domaine.ca
supabase secrets set RESEND_API_KEY=...
supabase secrets set INVITATION_FROM_EMAIL="Practicora <noreply@votre-domaine.ca>"
```

Si aucun service de courriel n’est configuré, un lien d’invitation peut être copié manuellement.

## 5. Reconnaissance du rôle

Après la connexion :

1. Supabase authentifie l’utilisateur;
2. `resolve_practicora_context()` récupère les adhésions actives;
3. les rôles et permissions sont chargés;
4. l’espace actif est déterminé;
5. Practicora ouvre le tableau de bord adapté;
6. la base applique les politiques RLS sur les requêtes.

## 6. Tests importants

Pour tester correctement l’isolation des données, utiliser plusieurs comptes distincts, par exemple :

- une personne responsable;
- un enseignant;
- un superviseur;
- étudiant A;
- étudiant B.

Vérifier surtout que l’étudiant A ne peut pas voir les données privées de l’étudiant B et que chaque rôle ne voit que les stages ou ressources qui lui sont assignés.
