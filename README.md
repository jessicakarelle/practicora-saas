# Practicora

Practicora est un projet web que j’ai développé pour mieux organiser et documenter un stage : heures travaillées, journal de bord, objectifs, compétences, notes, rapports et suivi de progression.

Au fil du développement, j’ai aussi ajouté une partie institutionnelle pour explorer comment la même application pourrait fonctionner avec plusieurs rôles, par exemple un étudiant, un enseignant, un superviseur ou une personne responsable d’un programme.

La version actuelle du projet est **7.4.1**. Le projet est encore en développement : certaines fonctions utilisent de vraies intégrations Supabase, tandis que d’autres servent surtout à démontrer ou tester l’interface.

## Fonctionnalités principales

### Espace étudiant

- tableau de bord de stage;
- journal de bord;
- calendrier et vue par semaine;
- notes, objectifs et compétences;
- suivi des heures et de la rémunération;
- statistiques et graphiques;
- rapports et exports;
- paramètres de compte et préférences d’affichage.

### Partie institutionnelle

- organisations;
- programmes et cohortes;
- membres et invitations;
- stages et assignations;
- tableaux de bord selon le rôle;
- modèles et révision de rapports;
- notifications et journal d’audit.

### Site public

Le projet contient aussi un site public avec les pages de présentation, fonctionnalités, tarifs, institutions, FAQ, ressources, guides, études de cas, blog, contact et pages légales.

## Technologies utilisées

- Next.js 16;
- React 19;
- TypeScript;
- Tailwind CSS 4;
- Supabase;
- React Hook Form + Zod;
- Recharts;
- Motion;
- Lucide React.

Les versions exactes sont dans `package.json` et `docs/DEPENDENCIES.md`.

## Lancer le projet localement

Prérequis : **Node.js 22 ou plus récent** et npm.

```powershell
Copy-Item .env.example .env.local
npm.cmd ci
npm.cmd run dev
```

Le site est ensuite disponible sur :

```text
http://localhost:3000/fr
```

Si le projet est utilisé sans configuration Supabase complète, certaines fonctions cloud ne pourront pas fonctionner normalement.

## Commandes utiles

```powershell
npm.cmd run i18n:generate
npm.cmd run i18n:check
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Pour exécuter toutes les vérifications principales :

```powershell
npm.cmd run check
```

## Langues

Practicora contient actuellement les routes suivantes :

```text
fr | en | es | pt | de | it | ar
```

Le français et l’anglais sont les langues les plus complètes. Les autres catalogues ont la même structure, mais certaines traductions spécialisées méritent encore une révision manuelle.

## Comptes de démonstration

En développement, des profils de démonstration permettent de tester les différents rôles sans créer plusieurs comptes Supabase.

Mot de passe commun :

```text
Practicora-Demo-2026!
```

| Rôle | Courriel |
|---|---|
| Direction de plateforme | `platform@demo.practicora.local` |
| Administration institutionnelle | `admin@demo.practicora.local` |
| Gestion de programme | `program@demo.practicora.local` |
| Professeur | `teacher@demo.practicora.local` |
| Superviseur | `supervisor@demo.practicora.local` |
| Étudiant | `student@demo.practicora.local` |

Ces comptes sont uniquement des données de démonstration locales. Voir `docs/DEMO-ACCOUNTS.md` pour les détails.

## Supabase

Le schéma principal se trouve ici :

```text
supabase/schema.sql
```

Pour créer le premier accès de Direction de plateforme, le compte doit déjà exister dans Supabase Auth :

```sql
select public.bootstrap_practicora_platform_owner('adresse@exemple.com');
```

Les politiques RLS et les rôles doivent être testés avec plusieurs comptes réels avant d’utiliser la partie institutionnelle avec de vraies données.

## Structure du projet

```text
src/app/          routes Next.js
src/components/   composants de l’interface
src/i18n/         traductions
src/lib/          logique et utilitaires
supabase/         schéma SQL et fonctions
public/           fichiers statiques
docs/             documentation du projet
legacy/           ancienne version conservée pour référence
```

## État actuel

Practicora est un **projet étudiant et personnel en développement**. Il sert à pratiquer une architecture Next.js plus complète, l’authentification, les rôles, une base de données multi-utilisateur, l’internationalisation et la création d’interfaces adaptées à plusieurs tailles d’écran.

Le projet ne doit pas être présenté comme un produit officiellement lancé, audité ou juridiquement validé. Les paiements, certains courriels transactionnels et plusieurs scénarios de production restent à connecter ou à tester dans un environnement réel.

## Documentation

- `docs/ARCHITECTURE.md` — organisation générale du projet;
- `docs/SUPABASE.md` — configuration Supabase;
- `docs/AUTH-PROVIDERS.md` — connexion Google, GitHub, Microsoft et Apple;
- `docs/I18N.md` — fonctionnement des traductions;
- `docs/DEPLOYMENT.md` — étapes de mise en ligne;
- `docs/INSTITUTIONAL-SETUP.md` — configuration de la partie institutionnelle;
- `docs/DEMO-ACCOUNTS.md` — comptes de test;
- `docs/BILLING-PLANS.md` — modèle de facturation prévu;
- `docs/PLATFORM-CONTROL.md` — rôles de plateforme;
- `VALIDATION.md` — vérifications effectuées sur cette version.
