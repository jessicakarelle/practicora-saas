# Base de données — ajout V6

Ce document garde une trace de la migration qui a ajouté la gestion de plateforme et la base du système de facturation.

## Installation complète

Pour une nouvelle installation, utiliser le schéma cumulatif :

```text
supabase/schema.sql
```

Le premier compte de Direction de plateforme peut ensuite être attribué avec :

```sql
select public.bootstrap_practicora_platform_owner('adresse@exemple.com');
```

Le compte doit déjà exister et être vérifié dans Supabase Auth.

## Migration concernée

```text
supabase/migrations/20260716_000600_platform_control_billing.sql
```

Cette migration ajoute les tables, fonctions PostgreSQL et politiques RLS liées aux fonctions décrites ci-dessous.

## Gestion de plateforme

- rôles et permissions internes;
- accès de l’équipe de plateforme;
- restrictions de comptes;
- paramètres globaux;
- journal d’audit;
- dérogations d’accès lorsque prévues.

## Facturation

- plans;
- prix;
- fonctionnalités;
- droits associés aux abonnements;
- clients;
- abonnements;
- compteurs d’utilisation;
- événements de facturation.

## Exploitation

- feature flags;
- déploiements ciblés;
- sessions d’assistance temporaires;
- demandes d’export, de rectification ou de suppression.

## Isolation des organisations

Les organisations utilisent un même projet Supabase. Elles sont séparées par `organization_id` et par les politiques Row Level Security.

Les rôles d’une organisation et les rôles internes de plateforme sont deux choses différentes.

## À tester avant production

Le SQL est présent dans le projet, mais une vraie mise en production demande encore :

- une exécution dans un projet Supabase de staging;
- des tests RLS avec plusieurs comptes;
- des essais de migration et de retour arrière;
- une vérification des données après migration.

Aucune clé Supabase secrète n’est incluse dans le dépôt et aucune migration distante ne doit être exécutée automatiquement depuis cette documentation.
