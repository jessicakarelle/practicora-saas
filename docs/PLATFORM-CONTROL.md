# Administration de la plateforme

Practicora contient aussi une zone d’administration globale qui sert à tester la gestion de plusieurs organisations depuis une même application.

Dans l’interface, le rôle principal est appelé **Direction de plateforme**. La clé interne `platform_owner` est conservée dans le code et la base pour éviter de casser les migrations et les règles existantes.

## Rôles internes

- `platform_owner` — Direction de plateforme;
- `platform_admin` — Administration de plateforme;
- `platform_operations` — Opérations;
- `platform_finance` — Facturation;
- `platform_support` — Assistance;
- `platform_auditor` — Audit.

Ces rôles sont séparés des rôles d’une organisation scolaire.

## Pages principales

| Route | Utilité |
|---|---|
| `/app/platform` | vue générale |
| `/app/platform/institutions` | organisations |
| `/app/platform/users` | utilisateurs |
| `/app/platform/access` | équipe et permissions |
| `/app/platform/plans` | plans et fonctionnalités |
| `/app/platform/subscriptions` | abonnements |
| `/app/platform/usage` | quotas et utilisation |
| `/app/platform/features` | feature flags |
| `/app/platform/security` | contrôles de sécurité |
| `/app/platform/support` | assistance temporaire |
| `/app/platform/data` | demandes liées aux données |
| `/app/platform/audit` | journal d’audit |
| `/app/platform/settings` | paramètres |

## Principes importants

- les permissions doivent être vérifiées côté application et côté base;
- les actions sensibles peuvent demander une justification;
- les opérations importantes doivent pouvoir être retracées dans l’audit;
- les accès temporaires d’assistance doivent rester limités;
- une restriction de compte ne doit pas dépendre uniquement d’un bouton caché dans l’interface;
- aucune clé Supabase privilégiée ne doit être envoyée au navigateur.

## Créer le premier accès

Le compte doit d’abord exister dans Supabase Auth. Ensuite :

```sql
select public.bootstrap_practicora_platform_owner('adresse@exemple.com');
```

La fonction refuse une adresse qui n’existe pas dans `auth.users`.
