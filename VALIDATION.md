# Validation de Practicora 7.4.1

Ce fichier résume les vérifications faites sur la version actuelle. Il sert surtout à garder une trace de ce qui a été testé et de ce qui reste à vérifier.

## Vérifications effectuées

Les vérifications suivantes ont été réussies lors de la préparation de cette version :

- génération des catalogues i18n;
- même structure de namespaces et de clés pour les 7 langues;
- vérification des références de traduction utilisées dans le code;
- audit des textes visibles écrits directement dans les fichiers TypeScript/TSX;
- ESLint sans avertissement;
- TypeScript strict sans erreur;
- compilation Next.js réussie;
- génération des routes statiques prévues;
- chargement des principales pages publiques dans les langues testées;
- vérification des pages FAQ, ressources, guides, études de cas, changelog, cookies, sécurité, accessibilité, blog et contact;
- profils de démonstration disponibles pour les 6 rôles;
- protection de la création d’une institution par la permission `platform.organizations.create`;
- comptes de démonstration désactivés par défaut en production.

## Commandes de validation

```powershell
npm.cmd run i18n:generate
npm.cmd run i18n:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

La commande suivante regroupe les principales vérifications :

```powershell
npm.cmd run check
```

## Point particulier sur le build

Le projet compile avec Next.js et génère les pages prévues. Dans certains environnements Linux limités utilisés pendant la préparation du projet, la phase finale de collecte des traces peut dépasser le temps disponible même après la compilation. Pour une validation finale, le build doit donc aussi être exécuté directement sur la machine ou l’environnement de déploiement visé.

## Ce qui reste à vérifier

- relire complètement les traductions espagnoles, portugaises, allemandes, italiennes et arabes;
- tester les politiques RLS avec plusieurs vrais comptes Supabase;
- tester les invitations et les courriels avec un fournisseur réellement configuré;
- connecter et tester le système de paiement avant toute utilisation réelle de la facturation;
- faire relire les textes légaux avant une mise en ligne publique;
- faire des tests d’accessibilité plus complets;
- tester les rôles institutionnels avec de vraies données de staging;
- vérifier les performances et les Core Web Vitals une fois le site déployé.

Cette liste est volontairement prudente : réussir le lint, le typecheck et le build ne remplace pas des tests réels de sécurité, de données ou d’utilisation.
