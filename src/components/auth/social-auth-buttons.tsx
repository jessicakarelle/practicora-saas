"use client";

import { translate as t } from "@/i18n";
import { useState } from "react";
import {
  CheckCircle2,
  Settings2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDialog } from "@/components/ui/dialog-provider";
import {
  configuredOAuthProviderKeys,
  OAUTH_PROVIDERS,
} from "@/lib/organization";
import {
  getSupabaseBrowserClient,
  isSupabaseConfigured,
} from "@/lib/supabase/client";

function GithubIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden>
      <path d="M12 .7a11.5 11.5 0 0 0-3.64 22.41c.58.11.79-.25.79-.56v-2.24c-3.22.7-3.9-1.36-3.9-1.36-.52-1.34-1.29-1.69-1.29-1.69-1.05-.72.08-.71.08-.71 1.16.08 1.78 1.2 1.78 1.2 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.57-.3-5.27-1.29-5.27-5.69 0-1.26.45-2.29 1.19-3.1-.12-.29-.52-1.47.11-3.06 0 0 .97-.31 3.16 1.18A10.95 10.95 0 0 1 12 6.1c.98 0 1.96.13 2.88.39 2.19-1.49 3.15-1.18 3.15-1.18.63 1.59.23 2.77.11 3.06.74.81 1.19 1.84 1.19 3.1 0 4.42-2.71 5.39-5.29 5.68.42.36.79 1.07.79 2.16v3.24c0 .31.21.68.8.56A11.5 11.5 0 0 0 12 .7Z" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden>
      <path
        fill="#4285F4"
        d="M21.6 12.23c0-.71-.06-1.23-.2-1.78H12v3.42h5.52a4.7 4.7 0 0 1-2.05 3.09l-.02.11 2.98 2.31.21.02c1.92-1.77 2.96-4.38 2.96-7.17Z"
      />
      <path
        fill="#34A853"
        d="M12 22c2.7 0 4.97-.89 6.63-2.42l-3.16-2.44c-.85.58-1.98.99-3.47.99a6.02 6.02 0 0 1-5.7-4.17l-.1.01-3.1 2.4-.04.1A10 10 0 0 0 12 22Z"
      />
      <path
        fill="#FBBC05"
        d="M6.3 13.96A6.2 6.2 0 0 1 5.96 12c0-.68.12-1.34.32-1.96l-.01-.13-3.15-2.45-.1.05A10 10 0 0 0 2 12c0 1.6.38 3.11 1.06 4.47l3.24-2.51Z"
      />
      <path
        fill="#EA4335"
        d="M12 5.87c1.87 0 3.13.8 3.85 1.47l2.85-2.78C16.95 2.94 14.7 2 12 2a10 10 0 0 0-8.98 5.51l3.26 2.53A6.03 6.03 0 0 1 12 5.87Z"
      />
    </svg>
  );
}

function ProviderIcon({ provider }: { provider: string }) {
  if (provider === "google") return <GoogleIcon />;
  if (provider === "github") return <GithubIcon />;
  if (provider === "azure") return <svg viewBox="0 0 24 24" className="size-5" aria-hidden><path fill="#f25022" d="M2 2h9v9H2z"/><path fill="#7fba00" d="M13 2h9v9h-9z"/><path fill="#00a4ef" d="M2 13h9v9H2z"/><path fill="#ffb900" d="M13 13h9v9h-9z"/></svg>;
  return <svg viewBox="0 0 24 24" className="size-5" fill="currentColor" aria-hidden><path d="M17.05 12.54c-.03-3.12 2.55-4.62 2.67-4.69-1.46-2.13-3.73-2.42-4.53-2.44-1.91-.2-3.77 1.14-4.74 1.14-.99 0-2.48-1.12-4.09-1.09-2.08.03-4.03 1.24-5.1 3.12-2.2 3.8-.56 9.39 1.55 12.46 1.05 1.5 2.28 3.18 3.89 3.12 1.57-.07 2.16-1 4.06-1 1.88 0 2.44 1 4.08.96 1.69-.03 2.76-1.5 3.77-3.02 1.21-1.72 1.7-3.42 1.72-3.51-.04-.01-3.25-1.24-3.28-5.05ZM13.94 3.38A5.5 5.5 0 0 0 15.2-.6a5.6 5.6 0 0 0-3.64 1.89 5.27 5.27 0 0 0-1.3 3.84 4.64 4.64 0 0 0 3.68-1.75Z" transform="translate(1 1) scale(.88)"/></svg>;
}

export function SocialAuthButtons({
  locale,
  nextPath,
}: {
  locale: string;
  mode: "login" | "register";
  nextPath?: string;
}) {
  const dialog = useDialog();
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null);
  const configuredKeys = configuredOAuthProviderKeys();
  const supabaseConfigured = isSupabaseConfigured();

  async function signIn(provider: (typeof OAUTH_PROVIDERS)[number]) {
    const available =
      supabaseConfigured && configuredKeys.includes(provider.key);
    if (!available) {
      await dialog.alert({
        title: t(locale, "auth.social-auth-buttons.configuration_required"),
        description: t(
          locale,
          "auth.social-auth-buttons.configuration_required_description",
          {
            provider: t(
              locale,
              `auth.social-auth-buttons.provider_${provider.key}`,
            ),
          },
        ),
        tone: "warning",
        confirmLabel: t(locale, "auth.social-auth-buttons.close"),
      });
      return;
    }

    const supabase = getSupabaseBrowserClient();
    if (!supabase) return;
    setLoadingProvider(provider.key);
    const destination = nextPath?.startsWith(`/${locale}/`)
      ? nextPath
      : `/${locale}/auth/resolve`;
    const redirectTo = `${window.location.origin}/${locale}/auth/callback?next=${encodeURIComponent(destination)}`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: provider.provider,
      options: {
        redirectTo,
        scopes: provider.key === "azure" ? "email" : undefined,
        queryParams:
          provider.key === "google"
            ? { access_type: "offline", prompt: "consent" }
            : undefined,
      },
    });
    if (error) {
      setLoadingProvider(null);
      await dialog.alert({
        title: t(locale, "auth.social-auth-buttons.unable_to_sign_in"),
        description: t(
          locale,
          "auth.social-auth-buttons.provider_not_enabled",
          {
            provider: t(
              locale,
              `auth.social-auth-buttons.provider_${provider.key}`,
            ),
            message: error.message,
          },
        ),
        tone: "danger",
        confirmLabel: t(locale, "auth.social-auth-buttons.close"),
      });
    }
  }

  return (
    <div>
      <div className="mb-3 flex items-center gap-3 text-xs font-semibold text-muted">
        <span className="h-px flex-1 bg-border" />
        <span>{t(locale, "auth.social-auth-buttons.or_continue_with")}</span>
        <span className="h-px flex-1 bg-border" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        {OAUTH_PROVIDERS.map((provider) => {
          const available =
            supabaseConfigured && configuredKeys.includes(provider.key);
          const label = t(
            locale,
            `auth.social-auth-buttons.provider_${provider.key}`,
          );
          return (
            <Button
              key={provider.key}
              type="button"
              variant="secondary"
              className="group min-h-11 w-full justify-center gap-2 px-3"
              disabled={Boolean(loadingProvider)}
              onClick={() => void signIn(provider)}
              data-tooltip={
                available
                  ? t(locale, "auth.social-auth-buttons.ready")
                  : t(locale, "auth.social-auth-buttons.setup_required")
              }
            >
              <ProviderIcon provider={provider.key} />
              <span className="truncate text-sm font-bold">{label}</span>
              {loadingProvider === provider.key ? (
                <span className="size-3.5 animate-spin rounded-full border-2 border-primary/25 border-t-primary" />
              ) : available ? (
                <CheckCircle2 className="size-3.5 text-success" />
              ) : (
                <Settings2 className="size-3.5 text-muted" />
              )}
            </Button>
          );
        })}
      </div>
      <p className="mt-2 text-center text-[11px] leading-4 text-muted">
        {t(locale, "auth.social-auth-buttons.cards_visible_notice")}
      </p>
    </div>
  );
}
