# Architecture de Practicora

Ce document donne une vue d’ensemble de la façon dont le projet est organisé. Le but n’est pas de décrire chaque fichier, mais de comprendre où se trouvent les principales responsabilités.

## Vue générale

```text
Next.js App Router
├── site public
├── authentification
├── espace étudiant
├── espaces institutionnels
└── administration de plateforme

React + TypeScript
├── composants d’interface
├── formulaires et validation
├── navigation selon le rôle
├── graphiques et rapports
└── gestion des préférences

Supabase
├── Auth
├── PostgreSQL
├── Row Level Security
├── fonctions RPC
└── fonctions Edge
```

## 1. Site public

Les pages publiques utilisent les routes localisées de Next.js, par exemple :

```text
/{locale}
/{locale}/features
/{locale}/pricing
/{locale}/institutions
/{locale}/about
/{locale}/contact
/{locale}/blog
```

Les pages légales, la FAQ, les ressources et les guides font aussi partie de cette zone.

## 2. Authentification

Supabase Auth gère l’identité de l’utilisateur. Practicora prend en charge :

- courriel et mot de passe;
- confirmation du courriel;
- récupération du mot de passe;
- Google;
- GitHub;
- Microsoft;
- Apple;
- invitations institutionnelles.

Une connexion avec un fournisseur social ne donne pas automatiquement un rôle privilégié. Les rôles viennent des données de l’organisation.

## 3. Espace personnel

L’espace principal d’un étudiant regroupe notamment :

- journal de bord;
- calendrier;
- semaine;
- notes;
- objectifs;
- compétences;
- analytique;
- rémunération;
- rapports;
- paramètres du compte.

Les données personnelles peuvent être gardées localement puis synchronisées avec Supabase selon la configuration utilisée.

## 4. Partie institutionnelle

La partie institutionnelle ajoute plusieurs objets liés entre eux :

```text
Organisation
├── membres
├── rôles et permissions
├── programmes
├── cohortes
├── stages
├── assignations
├── modèles de rapports
├── soumissions et révisions
├── notifications
└── audit
```

Un même utilisateur peut avoir un espace personnel et appartenir à une ou plusieurs organisations.

## 5. Résolution du contexte

Après la connexion, Practicora utilise `resolve_practicora_context()` pour déterminer les espaces auxquels le compte a accès.

Le principe est :

1. Supabase authentifie le compte;
2. l’application récupère les adhésions actives;
3. les rôles et permissions sont calculés;
4. le dernier espace valide peut être restauré;
5. l’utilisateur est redirigé vers l’interface correspondant à son rôle.

## 6. Permissions

L’interface utilise des permissions comme :

```text
members.invite
members.manage
programs.manage
cohorts.manage
placements.manage
reports.review
hours.confirm
evaluations.complete
templates.manage
audit.view
organization.configure
exports.generate
```

Ces permissions servent à adapter l’interface. La sécurité finale doit rester assurée côté base de données avec les politiques RLS.

## 7. Données

Deux grandes catégories de données sont utilisées.

### Données personnelles

Les données individuelles utilisent notamment `practicora_snapshots` afin de conserver un format compatible avec les anciennes sauvegardes du projet.

### Données institutionnelles

Les données partagées sont normalisées dans plusieurs tables : organisations, membres, rôles, programmes, cohortes, stages, modèles, rapports, notifications et audit.

Cette séparation évite de mélanger les données personnelles d’un étudiant avec les données d’une organisation.

## 8. Interface et responsive

L’application utilise une sidebar sur grand écran et une navigation adaptée sur mobile. Les tableaux peuvent défiler horizontalement lorsque nécessaire, les formulaires passent en une colonne sur les petits écrans et les graphiques utilisent des conteneurs responsives.

Les composants doivent aussi rester utilisables au clavier et respecter `prefers-reduced-motion` lorsque des animations sont présentes.

## 9. Sécurité

Les points les plus importants sont :

- ne jamais exposer une clé Supabase `service_role` dans le navigateur;
- vérifier les permissions côté serveur/base de données, pas seulement dans l’interface;
- tester les politiques RLS avec plusieurs comptes différents;
- séparer les rôles de plateforme des rôles d’une organisation;
- journaliser les opérations sensibles lorsque le schéma le prévoit.

Pour la configuration détaillée de la base, voir `docs/SUPABASE.md` et `docs/INSTITUTIONAL-SETUP.md`.
