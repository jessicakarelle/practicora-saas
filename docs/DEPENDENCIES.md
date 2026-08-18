# Dépendances principales

Les versions ci-dessous correspondent à la version actuelle du projet et sont verrouillées dans `package-lock.json`.

| Dépendance | Version |
|---|---:|
| Next.js | 16.2.10 |
| React / React DOM | 19.2.7 |
| TypeScript | 5.9.3 |
| Tailwind CSS | 4.3.2 |
| Supabase JS | 2.110.6 |
| React Hook Form | 7.81.0 |
| Zod | 4.4.3 |
| Motion | 12.42.2 |
| Recharts | 3.9.2 |
| Lucide React | 1.24.0 |
| ESLint | 9.39.5 |

Le projet demande **Node.js 22 ou plus récent**.

## Installation

Pour reproduire les versions du lockfile :

```powershell
npm.cmd ci
```

J’utilise `npm ci` plutôt que de réinstaller les dépendances au hasard afin de garder un environnement plus reproductible.

## Vérification après une mise à jour

Après avoir changé une dépendance, exécuter au minimum :

```powershell
npm.cmd run lint
npm.cmd run typecheck
npm.cmd run build
```

Une version plus récente n’est pas automatiquement meilleure pour le projet : l’important est surtout que l’ensemble des dépendances fonctionne correctement ensemble.
