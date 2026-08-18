# Migration depuis StageLog Pro

Practicora peut reprendre les anciennes sauvegardes JSON provenant de la version StageLog Pro.

Les données historiques peuvent contenir notamment :

- `entries`;
- `stages`;
- `activeStageId`;
- `objectifs`;
- `notes`;
- `trash`;
- `settings`;
- `salary`.

Certains anciens champs, comme `breakMin`, `done`, `stageId`, `goal`, `weeklyGoal`, `evalStar` et `evalSkills`, sont convertis vers le format utilisé par la version React actuelle.

L’import se fait depuis :

```text
Rapports et exports → Importer une sauvegarde
```

Avant d’importer une ancienne sauvegarde importante, il est préférable d’en garder une copie originale afin de pouvoir comparer les données après la migration.
