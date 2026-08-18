# Architecture actuelle — résumé

Cette page résume l’architecture de Practicora en quelques points. Pour plus de détails, voir `docs/ARCHITECTURE.md`.

## Flux principal

```text
Site / application Next.js
        ↓
Supabase Auth
        ↓
Résolution de l’espace actif
        ↓
Adhésions + rôles + permissions
        ↓
Cohortes / stages / assignations
        ↓
PostgreSQL + Row Level Security
```

## Source des accès

- identité : `auth.users`;
- profil : `profiles`;
- organisation : `organization_memberships`;
- rôles : `membership_roles` et `roles`;
- permissions : `role_permissions` et `permissions`;
- périmètre de travail : cohortes, stages et assignations;
- sécurité des données : politiques RLS PostgreSQL.

Les métadonnées qu’un utilisateur peut modifier lui-même ne doivent pas servir à lui donner des permissions supplémentaires.

## Données personnelles

Les fonctions individuelles utilisent notamment `practicora_snapshots`, ce qui permet de conserver une compatibilité avec les anciennes sauvegardes du projet.

## Données institutionnelles

Les organisations utilisent des tables normalisées pour les membres, programmes, cohortes, stages, modèles, rapports, invitations, notifications et événements d’audit.

## Interface

- sidebar sur desktop;
- navigation adaptée sur mobile;
- tableaux scrollables lorsque nécessaire;
- formulaires en une colonne sur petit écran;
- modales limitées à la hauteur disponible;
- graphiques responsives;
- prise en charge du clavier et du tactile;
- réduction des animations si `prefers-reduced-motion` est activé.
