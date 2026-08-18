# Plans et facturation

La partie facturation est surtout un **modèle de travail** dans la version actuelle. Les tables et les écrans existent pour préparer la logique, mais aucun fournisseur de paiement complet n’est considéré comme connecté tant que les webhooks, taxes et scénarios de paiement n’ont pas été testés.

## Tables principales

Le schéma utilise notamment :

- `billing_plans`;
- `billing_plan_prices`;
- `billing_features`;
- `billing_plan_features`;
- `billing_customers`;
- `billing_subscriptions`;
- `billing_subscription_entitlements`;
- `billing_usage_counters`;
- `billing_events`.

Les prix et limites restent dans la base plutôt que d’être écrits directement dans les pages React.

## Plans de départ

Les valeurs ci-dessous sont des valeurs de démonstration ou de préparation. Elles peuvent être modifiées avant toute utilisation réelle.

### Free

- 1 stage actif;
- 3 rapports par mois;
- environ 50 Mo de stockage prévu;
- export PDF non inclus par défaut.

### Plus

- 5,99 CAD par mois ou 49 CAD par année dans les données initiales;
- stages et rapports sans limite technique initiale;
- export PDF;
- modèles personnalisés;
- analytique avancée;
- options de rémunération avancées;
- environ 2 Go de stockage prévu.

### Institution

- 2 400 CAD par année dans les données initiales;
- 50 étudiants;
- 5 membres du personnel;
- modèles et analytique institutionnelle;
- journal d’audit;
- conservation pouvant aller jusqu’à cinq ans selon la configuration.

### Enterprise

- prix contractuel;
- limites adaptées au contrat;
- `-1` peut représenter une valeur contractuelle ou sans limite fixe dans certaines données numériques.

## Vérification d’une fonctionnalité payante

Une fonction payante ne devrait pas être autorisée uniquement parce qu’un bouton est visible. Le contrôle prévu tient compte de :

1. l’utilisateur connecté;
2. l’espace actif;
3. ses rôles et permissions;
4. l’abonnement;
5. les fonctionnalités incluses;
6. les quotas utilisés;
7. l’accès à la ressource concernée.

## Fournisseur de paiement

Le modèle n’impose pas Stripe ou un autre service. Un fournisseur réel peut être relié aux identifiants externes déjà prévus dans le schéma.

Avant d’utiliser cette partie avec de vrais paiements, il faut encore gérer correctement les webhooks, remboursements, taxes, échecs de paiement et règles de facturation applicables.
