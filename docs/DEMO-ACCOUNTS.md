# Comptes de démonstration

Les comptes de démonstration servent à tester rapidement les différents rôles de Practicora sans devoir créer plusieurs utilisateurs Supabase.

Ils sont utiles surtout pendant le développement de l’interface et de la navigation.

## Activation

- en développement : disponibles automatiquement;
- en production : désactivés par défaut;
- pour une démo contrôlée :

```env
NEXT_PUBLIC_ENABLE_DEMO_ACCOUNTS=true
```

## Identifiants

Mot de passe commun :

```text
Practicora-Demo-2026!
```

| Rôle | Courriel | Page principale |
|---|---|---|
| Direction de plateforme | `platform@demo.practicora.local` | `/app/platform` |
| Administration institutionnelle | `admin@demo.practicora.local` | `/app/organization` |
| Gestion de programme | `program@demo.practicora.local` | `/app/program` |
| Professeur | `teacher@demo.practicora.local` | `/app/teaching` |
| Superviseur | `supervisor@demo.practicora.local` | `/app/supervision` |
| Étudiant | `student@demo.practicora.local` | `/app` |

## Important

Ces profils :

- ne créent pas de comptes Supabase;
- utilisent des données fictives;
- peuvent garder leur session dans le stockage local du navigateur;
- ne donnent aucun accès spécial à une vraie base de production;
- ne remplacent pas les tests avec de vrais utilisateurs.

Il vaut mieux ne pas activer cette option sur un site public de production.
