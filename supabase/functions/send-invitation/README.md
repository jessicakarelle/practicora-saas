# Fonction `send-invitation`

Cette fonction Edge sert à créer une invitation institutionnelle et, si un service de courriel est configuré, à envoyer le lien directement à la personne invitée.

Elle utilise les permissions du compte connecté : le simple fait d’appeler la fonction ne doit pas permettre d’inviter quelqu’un sans avoir les droits nécessaires.

## Secrets nécessaires

```bash
supabase secrets set SITE_URL=https://votre-domaine.ca
supabase secrets set RESEND_API_KEY=...
supabase secrets set INVITATION_FROM_EMAIL="Practicora <noreply@votre-domaine.ca>"
```

`RESEND_API_KEY` est nécessaire seulement pour l’envoi automatique du courriel.

## Déploiement

```bash
supabase functions deploy send-invitation
```

## Sans service de courriel

Si `RESEND_API_KEY` n’est pas configuré, l’invitation peut quand même être créée. La fonction renvoie alors le lien sécurisé afin qu’il puisse être copié et envoyé manuellement pendant les tests.

Avant une utilisation réelle, tester le lien d’invitation, son expiration, les permissions du compte qui invite et le comportement avec un second compte Supabase.
