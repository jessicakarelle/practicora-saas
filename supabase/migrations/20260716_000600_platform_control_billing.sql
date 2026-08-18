-- Practicora V6 — Platform Control Center and Billing Core
-- Apply after the V5 institutional schema.
-- The platform owner is bootstrapped explicitly from the SQL editor with:
--   select public.bootstrap_practicora_platform_owner('owner@example.com');

create extension if not exists pgcrypto;

-- ============================================================
-- PLATFORM IDENTITY, ROLES AND ACCESS
-- ============================================================

create table if not exists public.platform_permissions (
  key text primary key,
  description_key text not null default '',
  risk_level text not null default 'standard' check (risk_level in ('standard', 'sensitive', 'critical')),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.platform_roles (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  name_key text not null,
  description_key text not null default '',
  priority integer not null default 100,
  is_system boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.platform_role_permissions (
  role_id uuid not null references public.platform_roles(id) on delete cascade,
  permission_key text not null references public.platform_permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

create table if not exists public.platform_memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'suspended', 'revoked')),
  appointed_by uuid references auth.users(id),
  appointed_at timestamptz not null default timezone('utc'::text, now()),
  last_used_at timestamptz,
  notes text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.platform_membership_roles (
  membership_id uuid not null references public.platform_memberships(id) on delete cascade,
  role_id uuid not null references public.platform_roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default timezone('utc'::text, now()),
  primary key (membership_id, role_id)
);

create table if not exists public.platform_access_overrides (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user', 'organization')),
  subject_id uuid not null,
  access_key text not null,
  effect text not null check (effect in ('allow', 'deny')),
  reason text not null default '',
  expires_at timestamptz,
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (subject_type, subject_id, access_key)
);

create table if not exists public.platform_account_controls (
  user_id uuid primary key references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'restricted', 'suspended')),
  reason text not null default '',
  locked_until timestamptz,
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.platform_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  is_public boolean not null default false,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

-- ============================================================
-- BILLING, PLANS, ENTITLEMENTS AND USAGE
-- ============================================================

create table if not exists public.billing_plans (
  id uuid primary key default gen_random_uuid(),
  code text not null unique check (code ~ '^[a-z0-9]+(?:_[a-z0-9]+)*$'),
  name_key text not null,
  description_key text not null default '',
  audience text not null check (audience in ('individual', 'organization', 'enterprise')),
  status text not null default 'draft' check (status in ('draft', 'active', 'archived')),
  is_public boolean not null default false,
  sort_order integer not null default 100,
  trial_days integer not null default 0 check (trial_days between 0 and 365),
  created_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.billing_plan_prices (
  id uuid primary key default gen_random_uuid(),
  plan_id uuid not null references public.billing_plans(id) on delete cascade,
  currency text not null default 'CAD' check (currency ~ '^[A-Z]{3}$'),
  billing_interval text not null check (billing_interval in ('month', 'year', 'one_time', 'custom')),
  amount_cents integer not null default 0 check (amount_cents >= 0),
  external_price_id text,
  active_from timestamptz not null default timezone('utc'::text, now()),
  active_until timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (plan_id, currency, billing_interval, active_from)
);

create table if not exists public.billing_features (
  key text primary key,
  name_key text not null,
  description_key text not null default '',
  value_type text not null default 'boolean' check (value_type in ('boolean', 'integer', 'decimal', 'text', 'json')),
  scope text not null default 'all' check (scope in ('personal', 'organization', 'platform', 'all')),
  unit_key text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.billing_plan_features (
  plan_id uuid not null references public.billing_plans(id) on delete cascade,
  feature_key text not null references public.billing_features(key) on delete cascade,
  value jsonb not null,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (plan_id, feature_key)
);

create table if not exists public.billing_customers (
  id uuid primary key default gen_random_uuid(),
  owner_type text not null check (owner_type in ('user', 'organization')),
  user_id uuid references auth.users(id) on delete cascade,
  organization_id uuid references public.organizations(id) on delete cascade,
  provider text not null default 'manual' check (provider in ('manual', 'stripe', 'paddle')),
  external_customer_id text,
  billing_email text not null default '',
  country text not null default 'CA',
  tax_id text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  check (
    (owner_type = 'user' and user_id is not null and organization_id is null)
    or (owner_type = 'organization' and organization_id is not null and user_id is null)
  )
);

create unique index if not exists billing_customers_user_unique
  on public.billing_customers(user_id) where user_id is not null;
create unique index if not exists billing_customers_organization_unique
  on public.billing_customers(organization_id) where organization_id is not null;

create table if not exists public.billing_subscriptions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.billing_customers(id) on delete cascade,
  plan_id uuid not null references public.billing_plans(id),
  price_id uuid references public.billing_plan_prices(id),
  status text not null default 'trialing' check (status in ('trialing', 'active', 'past_due', 'paused', 'cancelled', 'expired')),
  external_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  cancelled_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.billing_subscription_entitlements (
  subscription_id uuid not null references public.billing_subscriptions(id) on delete cascade,
  feature_key text not null references public.billing_features(key) on delete cascade,
  value jsonb not null,
  source text not null default 'plan' check (source in ('plan', 'override', 'promotion', 'contract')),
  expires_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (subscription_id, feature_key)
);

create table if not exists public.billing_usage_counters (
  id uuid primary key default gen_random_uuid(),
  subject_type text not null check (subject_type in ('user', 'organization')),
  subject_id uuid not null,
  feature_key text not null references public.billing_features(key) on delete cascade,
  period_start date not null,
  period_end date not null,
  quantity numeric(18,4) not null default 0 check (quantity >= 0),
  last_event_at timestamptz,
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (subject_type, subject_id, feature_key, period_start, period_end)
);

create table if not exists public.billing_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'manual',
  external_event_id text,
  event_type text not null,
  customer_id uuid references public.billing_customers(id) on delete set null,
  subscription_id uuid references public.billing_subscriptions(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processing_status text not null default 'received' check (processing_status in ('received', 'processed', 'ignored', 'failed')),
  error_code text,
  occurred_at timestamptz not null default timezone('utc'::text, now()),
  processed_at timestamptz,
  unique (provider, external_event_id)
);

-- ============================================================
-- FEATURE FLAGS, SUPPORT, DATA OPERATIONS AND AUDIT
-- ============================================================

create table if not exists public.platform_feature_flags (
  key text primary key,
  name_key text not null,
  description_key text not null default '',
  enabled boolean not null default false,
  rollout_percentage integer not null default 0 check (rollout_percentage between 0 and 100),
  rules jsonb not null default '[]'::jsonb,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.platform_feature_flag_overrides (
  flag_key text not null references public.platform_feature_flags(key) on delete cascade,
  subject_type text not null check (subject_type in ('user', 'organization')),
  subject_id uuid not null,
  enabled boolean not null,
  reason text not null default '',
  expires_at timestamptz,
  updated_by uuid references auth.users(id),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  primary key (flag_key, subject_type, subject_id)
);

create table if not exists public.platform_support_sessions (
  id uuid primary key default gen_random_uuid(),
  operator_user_id uuid not null references auth.users(id),
  target_type text not null check (target_type in ('user', 'organization')),
  target_id uuid not null,
  mode text not null default 'read_only' check (mode in ('read_only', 'assisted_write')),
  reason text not null,
  status text not null default 'active' check (status in ('active', 'ended', 'expired', 'revoked')),
  expires_at timestamptz not null,
  ended_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.platform_data_requests (
  id uuid primary key default gen_random_uuid(),
  request_type text not null check (request_type in ('export', 'deletion', 'retention_hold', 'restore')),
  subject_type text not null check (subject_type in ('user', 'organization')),
  subject_id uuid not null,
  status text not null default 'queued' check (status in ('queued', 'processing', 'completed', 'failed', 'cancelled')),
  reason text not null default '',
  requested_by uuid not null references auth.users(id),
  assigned_to uuid references auth.users(id),
  result_location text,
  metadata jsonb not null default '{}'::jsonb,
  requested_at timestamptz not null default timezone('utc'::text, now()),
  completed_at timestamptz
);

create table if not exists public.platform_audit_logs (
  id bigint generated always as identity primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  target_type text not null default '',
  target_id text not null default '',
  reason text not null default '',
  before_data jsonb,
  after_data jsonb,
  metadata jsonb not null default '{}'::jsonb,
  ip_hash text,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists platform_audit_logs_created_at_idx on public.platform_audit_logs(created_at desc);
create index if not exists platform_audit_logs_actor_idx on public.platform_audit_logs(actor_user_id, created_at desc);
create index if not exists platform_account_controls_status_idx on public.platform_account_controls(status);
create index if not exists billing_subscriptions_status_idx on public.billing_subscriptions(status);
create index if not exists billing_usage_subject_idx on public.billing_usage_counters(subject_type, subject_id, period_start desc);

-- ============================================================
-- CORE SECURITY FUNCTIONS
-- ============================================================

create or replace function public.is_platform_member()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.platform_memberships m
    where m.user_id = auth.uid() and m.status = 'active'
  );
$$;

create or replace function public.has_platform_permission(target_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.platform_memberships m
    join public.platform_membership_roles mr on mr.membership_id = m.id
    join public.platform_role_permissions rp on rp.role_id = mr.role_id
    where m.user_id = auth.uid()
      and m.status = 'active'
      and rp.permission_key = target_permission_key
  );
$$;

create or replace function public.is_practicora_account_allowed()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select not exists (
    select 1 from public.platform_account_controls c
    where c.user_id = auth.uid()
      and (
        c.status = 'suspended'
        or (c.locked_until is not null and c.locked_until > timezone('utc'::text, now()))
      )
  );
$$;

create or replace function public.write_platform_audit(
  target_action text,
  target_type text default '',
  target_id text default '',
  target_reason text default '',
  target_before jsonb default null,
  target_after jsonb default null,
  target_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.platform_audit_logs(
    actor_user_id, action, target_type, target_id, reason, before_data, after_data, metadata
  ) values (
    auth.uid(), target_action, target_type, target_id, target_reason,
    target_before, target_after, coalesce(target_metadata, '{}'::jsonb)
  );
$$;

-- ============================================================
-- SEEDING
-- ============================================================

create or replace function public.seed_practicora_platform_core()
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  role_owner uuid;
  role_admin uuid;
  role_operations uuid;
  role_finance uuid;
  role_support uuid;
  role_auditor uuid;
begin
  insert into public.platform_permissions(key, description_key, risk_level) values
    ('platform.dashboard.view', 'platform.permissions.dashboard_view', 'standard'),
    ('platform.organizations.view', 'platform.permissions.organizations_view', 'standard'),
    ('platform.organizations.manage', 'platform.permissions.organizations_manage', 'critical'),
    ('platform.users.view', 'platform.permissions.users_view', 'sensitive'),
    ('platform.users.manage', 'platform.permissions.users_manage', 'critical'),
    ('platform.access.view', 'platform.permissions.access_view', 'sensitive'),
    ('platform.access.manage', 'platform.permissions.access_manage', 'critical'),
    ('platform.plans.view', 'platform.permissions.plans_view', 'standard'),
    ('platform.plans.manage', 'platform.permissions.plans_manage', 'sensitive'),
    ('platform.plans.publish', 'platform.permissions.plans_publish', 'critical'),
    ('platform.subscriptions.view', 'platform.permissions.subscriptions_view', 'sensitive'),
    ('platform.subscriptions.manage', 'platform.permissions.subscriptions_manage', 'critical'),
    ('platform.usage.view', 'platform.permissions.usage_view', 'standard'),
    ('platform.features.view', 'platform.permissions.features_view', 'standard'),
    ('platform.features.manage', 'platform.permissions.features_manage', 'critical'),
    ('platform.audit.view', 'platform.permissions.audit_view', 'sensitive'),
    ('platform.security.view', 'platform.permissions.security_view', 'sensitive'),
    ('platform.security.manage', 'platform.permissions.security_manage', 'critical'),
    ('platform.support.view', 'platform.permissions.support_view', 'sensitive'),
    ('platform.support.manage', 'platform.permissions.support_manage', 'critical'),
    ('platform.data.view', 'platform.permissions.data_view', 'sensitive'),
    ('platform.data.manage', 'platform.permissions.data_manage', 'critical'),
    ('platform.settings.view', 'platform.permissions.settings_view', 'standard'),
    ('platform.settings.manage', 'platform.permissions.settings_manage', 'critical')
  on conflict (key) do update set
    description_key = excluded.description_key,
    risk_level = excluded.risk_level;

  insert into public.platform_roles(key, name_key, description_key, priority, is_system) values
    ('platform_owner', 'platform.roles.owner_name', 'platform.roles.owner_description', 10, true),
    ('platform_admin', 'platform.roles.admin_name', 'platform.roles.admin_description', 20, true),
    ('platform_operations', 'platform.roles.operations_name', 'platform.roles.operations_description', 30, true),
    ('platform_finance', 'platform.roles.finance_name', 'platform.roles.finance_description', 40, true),
    ('platform_support', 'platform.roles.support_name', 'platform.roles.support_description', 50, true),
    ('platform_auditor', 'platform.roles.auditor_name', 'platform.roles.auditor_description', 60, true)
  on conflict (key) do update set
    name_key = excluded.name_key,
    description_key = excluded.description_key,
    priority = excluded.priority;

  select id into role_owner from public.platform_roles where key = 'platform_owner';
  select id into role_admin from public.platform_roles where key = 'platform_admin';
  select id into role_operations from public.platform_roles where key = 'platform_operations';
  select id into role_finance from public.platform_roles where key = 'platform_finance';
  select id into role_support from public.platform_roles where key = 'platform_support';
  select id into role_auditor from public.platform_roles where key = 'platform_auditor';

  insert into public.platform_role_permissions(role_id, permission_key)
  select role_owner, key from public.platform_permissions on conflict do nothing;

  insert into public.platform_role_permissions(role_id, permission_key)
  select role_admin, key from public.platform_permissions
  where key <> 'platform.access.manage'
  on conflict do nothing;

  insert into public.platform_role_permissions(role_id, permission_key)
  select role_operations, key from public.platform_permissions
  where key = any(array[
    'platform.dashboard.view','platform.organizations.view','platform.organizations.manage',
    'platform.users.view','platform.users.manage','platform.access.view',
    'platform.usage.view','platform.features.view','platform.audit.view',
    'platform.security.view','platform.support.view','platform.support.manage',
    'platform.data.view','platform.data.manage','platform.settings.view'
  ]) on conflict do nothing;

  insert into public.platform_role_permissions(role_id, permission_key)
  select role_finance, key from public.platform_permissions
  where key = any(array[
    'platform.dashboard.view','platform.organizations.view','platform.users.view',
    'platform.plans.view','platform.plans.manage','platform.plans.publish',
    'platform.subscriptions.view','platform.subscriptions.manage','platform.usage.view',
    'platform.audit.view','platform.settings.view'
  ]) on conflict do nothing;

  insert into public.platform_role_permissions(role_id, permission_key)
  select role_support, key from public.platform_permissions
  where key = any(array[
    'platform.dashboard.view','platform.organizations.view','platform.users.view',
    'platform.access.view','platform.usage.view','platform.features.view',
    'platform.audit.view','platform.security.view','platform.support.view','platform.support.manage'
  ]) on conflict do nothing;

  insert into public.platform_role_permissions(role_id, permission_key)
  select role_auditor, key from public.platform_permissions
  where key = any(array[
    'platform.dashboard.view','platform.organizations.view','platform.users.view',
    'platform.access.view','platform.plans.view','platform.subscriptions.view',
    'platform.usage.view','platform.features.view','platform.audit.view',
    'platform.security.view','platform.support.view','platform.data.view','platform.settings.view'
  ]) on conflict do nothing;

  insert into public.billing_features(key, name_key, description_key, value_type, scope, unit_key) values
    ('stages.max_active', 'billing.features.stages_max_active', 'billing.features.stages_max_active_description', 'integer', 'personal', 'billing.units.stages'),
    ('reports.monthly_limit', 'billing.features.reports_monthly_limit', 'billing.features.reports_monthly_limit_description', 'integer', 'personal', 'billing.units.reports'),
    ('reports.pdf_export', 'billing.features.reports_pdf_export', 'billing.features.reports_pdf_export_description', 'boolean', 'personal', ''),
    ('reports.custom_templates', 'billing.features.reports_custom_templates', 'billing.features.reports_custom_templates_description', 'boolean', 'all', ''),
    ('analytics.advanced', 'billing.features.analytics_advanced', 'billing.features.analytics_advanced_description', 'boolean', 'all', ''),
    ('salary.analytics', 'billing.features.salary_analytics', 'billing.features.salary_analytics_description', 'boolean', 'personal', ''),
    ('storage.max_mb', 'billing.features.storage_max_mb', 'billing.features.storage_max_mb_description', 'integer', 'all', 'billing.units.megabytes'),
    ('organization.enabled', 'billing.features.organization_enabled', 'billing.features.organization_enabled_description', 'boolean', 'organization', ''),
    ('organization.max_students', 'billing.features.organization_max_students', 'billing.features.organization_max_students_description', 'integer', 'organization', 'billing.units.students'),
    ('organization.max_staff', 'billing.features.organization_max_staff', 'billing.features.organization_max_staff_description', 'integer', 'organization', 'billing.units.staff'),
    ('organization.audit', 'billing.features.organization_audit', 'billing.features.organization_audit_description', 'boolean', 'organization', ''),
    ('organization.sso', 'billing.features.organization_sso', 'billing.features.organization_sso_description', 'boolean', 'organization', ''),
    ('organization.custom_roles', 'billing.features.organization_custom_roles', 'billing.features.organization_custom_roles_description', 'boolean', 'organization', ''),
    ('retention.max_years', 'billing.features.retention_max_years', 'billing.features.retention_max_years_description', 'integer', 'organization', 'billing.units.years')
  on conflict (key) do update set
    name_key = excluded.name_key,
    description_key = excluded.description_key,
    value_type = excluded.value_type,
    scope = excluded.scope,
    unit_key = excluded.unit_key;

  insert into public.billing_plans(code, name_key, description_key, audience, status, is_public, sort_order, trial_days) values
    ('free', 'billing.plans.free_name', 'billing.plans.free_description', 'individual', 'active', true, 10, 0),
    ('plus', 'billing.plans.plus_name', 'billing.plans.plus_description', 'individual', 'draft', false, 20, 14),
    ('institution', 'billing.plans.institution_name', 'billing.plans.institution_description', 'organization', 'draft', false, 30, 30),
    ('enterprise', 'billing.plans.enterprise_name', 'billing.plans.enterprise_description', 'enterprise', 'draft', false, 40, 30)
  on conflict (code) do update set
    name_key = excluded.name_key,
    description_key = excluded.description_key,
    audience = excluded.audience,
    sort_order = excluded.sort_order;

  insert into public.billing_plan_prices(plan_id, currency, billing_interval, amount_cents, is_active)
  select id, 'CAD', 'month', 0, true from public.billing_plans where code = 'free'
  on conflict do nothing;
  insert into public.billing_plan_prices(plan_id, currency, billing_interval, amount_cents, is_active)
  select id, 'CAD', 'month', 599, true from public.billing_plans where code = 'plus'
  on conflict do nothing;
  insert into public.billing_plan_prices(plan_id, currency, billing_interval, amount_cents, is_active)
  select id, 'CAD', 'year', 4900, true from public.billing_plans where code = 'plus'
  on conflict do nothing;
  insert into public.billing_plan_prices(plan_id, currency, billing_interval, amount_cents, is_active)
  select id, 'CAD', 'year', 240000, true from public.billing_plans where code = 'institution'
  on conflict do nothing;

  insert into public.billing_plan_features(plan_id, feature_key, value)
  select p.id, f.key,
    case
      when p.code = 'free' and f.key = 'stages.max_active' then '1'::jsonb
      when p.code = 'free' and f.key = 'reports.monthly_limit' then '3'::jsonb
      when p.code = 'free' and f.key = 'reports.pdf_export' then 'false'::jsonb
      when p.code = 'free' and f.key = 'storage.max_mb' then '50'::jsonb
      when p.code = 'plus' and f.key in ('stages.max_active','reports.monthly_limit') then '-1'::jsonb
      when p.code = 'plus' and f.key in ('reports.pdf_export','reports.custom_templates','analytics.advanced','salary.analytics') then 'true'::jsonb
      when p.code = 'plus' and f.key = 'storage.max_mb' then '2048'::jsonb
      when p.code = 'institution' and f.key = 'organization.enabled' then 'true'::jsonb
      when p.code = 'institution' and f.key = 'organization.max_students' then '50'::jsonb
      when p.code = 'institution' and f.key = 'organization.max_staff' then '5'::jsonb
      when p.code = 'institution' and f.key in ('organization.audit','reports.custom_templates','analytics.advanced') then 'true'::jsonb
      when p.code = 'institution' and f.key = 'retention.max_years' then '5'::jsonb
      when p.code = 'enterprise' and f.value_type = 'boolean' then 'true'::jsonb
      when p.code = 'enterprise' and f.value_type = 'integer' then '-1'::jsonb
      else 'false'::jsonb
    end
  from public.billing_plans p
  cross join public.billing_features f
  where p.code in ('free','plus','institution','enterprise')
  on conflict (plan_id, feature_key) do nothing;

  insert into public.platform_feature_flags(key, name_key, description_key, enabled, rollout_percentage) values
    ('institutional_core', 'platform.flags.institutional_core_name', 'platform.flags.institutional_core_description', true, 100),
    ('advanced_reports', 'platform.flags.advanced_reports_name', 'platform.flags.advanced_reports_description', true, 100),
    ('social_auth', 'platform.flags.social_auth_name', 'platform.flags.social_auth_description', true, 100),
    ('billing_enforcement', 'platform.flags.billing_enforcement_name', 'platform.flags.billing_enforcement_description', false, 0),
    ('support_sessions', 'platform.flags.support_sessions_name', 'platform.flags.support_sessions_description', false, 0)
  on conflict (key) do nothing;

  insert into public.platform_settings(key, value, is_public) values
    ('platform.branding', jsonb_build_object('control_center_name', 'Practicora Control Center'), false),
    ('platform.security', jsonb_build_object('support_session_minutes', 30, 'require_reason', true, 'require_reauthentication', true), false),
    ('platform.billing', jsonb_build_object('provider', 'manual', 'currency', 'CAD', 'enforcement_mode', 'observe'), false),
    ('platform.data', jsonb_build_object('export_expiry_hours', 24, 'deletion_grace_days', 30), false)
  on conflict (key) do nothing;
end;
$$;

select public.seed_practicora_platform_core();

-- This bootstrap function is deliberately not granted to authenticated users.
-- Run it once from the Supabase SQL editor or another privileged connection.
create or replace function public.bootstrap_practicora_platform_owner(target_email text)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
  target_membership_id uuid;
  owner_role_id uuid;
begin
  perform public.seed_practicora_platform_core();
  select id into target_user_id from auth.users where lower(email) = lower(trim(target_email)) limit 1;
  if target_user_id is null then raise exception 'PLATFORM_OWNER_USER_NOT_FOUND'; end if;

  insert into public.platform_memberships(user_id, status, notes)
  values (target_user_id, 'active', 'bootstrap')
  on conflict (user_id) do update set status = 'active', updated_at = timezone('utc'::text, now())
  returning id into target_membership_id;

  select id into owner_role_id from public.platform_roles where key = 'platform_owner';
  insert into public.platform_membership_roles(membership_id, role_id, assigned_by)
  values (target_membership_id, owner_role_id, target_user_id)
  on conflict do nothing;

  insert into public.platform_audit_logs(actor_user_id, action, target_type, target_id, reason)
  values (target_user_id, 'platform.owner.bootstrapped', 'user', target_user_id::text, 'bootstrap');

  return jsonb_build_object('user_id', target_user_id, 'membership_id', target_membership_id, 'role', 'platform_owner');
end;
$$;

-- ============================================================
-- PLATFORM CONTEXT AND READ MODELS
-- ============================================================

create or replace function public.resolve_platform_context()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((
    select jsonb_build_object(
      'membership_id', m.id,
      'status', m.status,
      'roles', coalesce((
        select jsonb_agg(r.key order by r.priority, r.key)
        from public.platform_membership_roles mr
        join public.platform_roles r on r.id = mr.role_id
        where mr.membership_id = m.id
      ), '[]'::jsonb),
      'permissions', coalesce((
        select jsonb_agg(distinct rp.permission_key order by rp.permission_key)
        from public.platform_membership_roles mr
        join public.platform_role_permissions rp on rp.role_id = mr.role_id
        where mr.membership_id = m.id
      ), '[]'::jsonb),
      'account_status', coalesce((select c.status from public.platform_account_controls c where c.user_id = auth.uid()), 'active')
    )
    from public.platform_memberships m
    where m.user_id = auth.uid() and m.status = 'active'
  ), jsonb_build_object('roles', '[]'::jsonb, 'permissions', '[]'::jsonb, 'account_status', 'active'));
$$;

create or replace function public.platform_dashboard_metrics()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.has_platform_permission('platform.dashboard.view') then jsonb_build_object(
    'organizations_total', (select count(*) from public.organizations),
    'organizations_active', (select count(*) from public.organizations where status = 'active'),
    'organizations_suspended', (select count(*) from public.organizations where status = 'suspended'),
    'users_total', (select count(*) from auth.users),
    'users_active_30d', (select count(*) from auth.users where last_sign_in_at >= timezone('utc'::text, now()) - interval '30 days'),
    'users_suspended', (select count(*) from public.platform_account_controls where status = 'suspended'),
    'subscriptions_active', (select count(*) from public.billing_subscriptions where status in ('trialing','active')),
    'subscriptions_past_due', (select count(*) from public.billing_subscriptions where status = 'past_due'),
    'reports_waiting', (select count(*) from public.report_submissions where status in ('submitted','in_review','changes_requested')),
    'support_sessions_active', (select count(*) from public.platform_support_sessions where status = 'active' and expires_at > timezone('utc'::text, now())),
    'data_requests_open', (select count(*) from public.platform_data_requests where status in ('queued','processing')),
    'audit_events_24h', (select count(*) from public.platform_audit_logs where created_at >= timezone('utc'::text, now()) - interval '24 hours')
  ) else null end;
$$;

create or replace function public.list_platform_organizations(
  search_text text default '',
  status_filter text default 'all',
  page_limit integer default 50,
  page_offset integer default 0
)
returns table(
  organization_id uuid,
  name text,
  slug text,
  organization_type text,
  country text,
  status text,
  member_count bigint,
  student_count bigint,
  active_placements bigint,
  subscription_status text,
  plan_code text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    o.id,
    o.name,
    o.slug,
    o.type,
    o.country,
    o.status,
    (select count(*) from public.organization_memberships m where m.organization_id = o.id and m.status = 'active'),
    (select count(*) from public.organization_memberships m join public.membership_roles mr on mr.membership_id = m.id join public.roles r on r.id = mr.role_id where m.organization_id = o.id and m.status = 'active' and r.key = 'student'),
    (select count(*) from public.placements p where p.organization_id = o.id and p.status in ('planned','active','at_risk')),
    coalesce((select s.status from public.billing_customers c join public.billing_subscriptions s on s.customer_id = c.id where c.organization_id = o.id order by s.created_at desc limit 1), 'none'),
    coalesce((select p.code from public.billing_customers c join public.billing_subscriptions s on s.customer_id = c.id join public.billing_plans p on p.id = s.plan_id where c.organization_id = o.id order by s.created_at desc limit 1), ''),
    o.created_at
  from public.organizations o
  where public.has_platform_permission('platform.organizations.view')
    and (coalesce(trim(search_text), '') = '' or o.name ilike '%' || trim(search_text) || '%' or o.slug ilike '%' || trim(search_text) || '%')
    and (status_filter = 'all' or o.status = status_filter)
  order by o.created_at desc
  limit greatest(1, least(page_limit, 200))
  offset greatest(page_offset, 0);
$$;

create or replace function public.list_platform_users(
  search_text text default '',
  status_filter text default 'all',
  page_limit integer default 50,
  page_offset integer default 0
)
returns table(
  user_id uuid,
  email text,
  full_name text,
  account_status text,
  email_confirmed boolean,
  organization_count bigint,
  organization_names text,
  last_sign_in_at timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    u.id,
    coalesce(u.email, ''),
    coalesce(p.full_name, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')),
    coalesce(c.status, 'active'),
    u.email_confirmed_at is not null,
    (select count(*) from public.organization_memberships m where m.user_id = u.id and m.status = 'active'),
    coalesce((select string_agg(o.name, ', ' order by o.name) from public.organization_memberships m join public.organizations o on o.id = m.organization_id where m.user_id = u.id and m.status = 'active'), ''),
    u.last_sign_in_at,
    u.created_at
  from auth.users u
  left join public.profiles p on p.id = u.id
  left join public.platform_account_controls c on c.user_id = u.id
  where public.has_platform_permission('platform.users.view')
    and (
      coalesce(trim(search_text), '') = ''
      or coalesce(u.email, '') ilike '%' || trim(search_text) || '%'
      or coalesce(p.full_name, '') ilike '%' || trim(search_text) || '%'
    )
    and (status_filter = 'all' or coalesce(c.status, 'active') = status_filter)
  order by u.created_at desc
  limit greatest(1, least(page_limit, 200))
  offset greatest(page_offset, 0);
$$;

create or replace function public.list_platform_team()
returns table(
  membership_id uuid,
  user_id uuid,
  email text,
  full_name text,
  status text,
  roles text[],
  permissions text[],
  appointed_at timestamptz,
  last_used_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select
    m.id,
    m.user_id,
    coalesce(u.email, ''),
    coalesce(p.full_name, coalesce(u.raw_user_meta_data->>'full_name', u.raw_user_meta_data->>'name', '')),
    m.status,
    coalesce((select array_agg(r.key order by r.priority, r.key) from public.platform_membership_roles mr join public.platform_roles r on r.id = mr.role_id where mr.membership_id = m.id), array[]::text[]),
    coalesce((select array_agg(distinct rp.permission_key order by rp.permission_key) from public.platform_membership_roles mr join public.platform_role_permissions rp on rp.role_id = mr.role_id where mr.membership_id = m.id), array[]::text[]),
    m.appointed_at,
    m.last_used_at
  from public.platform_memberships m
  join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
  where public.has_platform_permission('platform.access.view')
  order by m.status, m.appointed_at;
$$;

create or replace function public.list_platform_plans()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.has_platform_permission('platform.plans.view') then coalesce((
    select jsonb_agg(jsonb_build_object(
      'id', p.id,
      'code', p.code,
      'name_key', p.name_key,
      'description_key', p.description_key,
      'audience', p.audience,
      'status', p.status,
      'is_public', p.is_public,
      'sort_order', p.sort_order,
      'trial_days', p.trial_days,
      'prices', coalesce((select jsonb_agg(to_jsonb(pp) order by pp.currency, pp.billing_interval) from public.billing_plan_prices pp where pp.plan_id = p.id and pp.is_active), '[]'::jsonb),
      'features', coalesce((select jsonb_agg(jsonb_build_object('key', pf.feature_key, 'value', pf.value, 'value_type', f.value_type, 'name_key', f.name_key) order by pf.feature_key) from public.billing_plan_features pf join public.billing_features f on f.key = pf.feature_key where pf.plan_id = p.id), '[]'::jsonb)
    ) order by p.sort_order, p.code) from public.billing_plans p
  ), '[]'::jsonb) else '[]'::jsonb end;
$$;

create or replace function public.list_platform_subscriptions(page_limit integer default 100)
returns table(
  subscription_id uuid,
  owner_type text,
  owner_name text,
  plan_code text,
  status text,
  currency text,
  amount_cents integer,
  billing_interval text,
  current_period_end timestamptz,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    s.id,
    c.owner_type,
    case when c.owner_type = 'organization'
      then coalesce((select o.name from public.organizations o where o.id = c.organization_id), '')
      else coalesce((select p.full_name from public.profiles p where p.id = c.user_id), c.billing_email)
    end,
    p.code,
    s.status,
    coalesce(pp.currency, 'CAD'),
    coalesce(pp.amount_cents, 0),
    coalesce(pp.billing_interval, 'custom'),
    s.current_period_end,
    s.created_at
  from public.billing_subscriptions s
  join public.billing_customers c on c.id = s.customer_id
  join public.billing_plans p on p.id = s.plan_id
  left join public.billing_plan_prices pp on pp.id = s.price_id
  where public.has_platform_permission('platform.subscriptions.view')
  order by s.created_at desc
  limit greatest(1, least(page_limit, 500));
$$;

create or replace function public.list_platform_usage(page_limit integer default 200)
returns table(
  subject_type text,
  subject_id uuid,
  subject_name text,
  feature_key text,
  quantity numeric,
  period_start date,
  period_end date,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    u.subject_type,
    u.subject_id,
    case when u.subject_type = 'organization'
      then coalesce((select o.name from public.organizations o where o.id = u.subject_id), u.subject_id::text)
      else coalesce((select p.full_name from public.profiles p where p.id = u.subject_id), u.subject_id::text)
    end,
    u.feature_key,
    u.quantity,
    u.period_start,
    u.period_end,
    u.updated_at
  from public.billing_usage_counters u
  where public.has_platform_permission('platform.usage.view')
  order by u.updated_at desc
  limit greatest(1, least(page_limit, 1000));
$$;

create or replace function public.list_platform_feature_flags()
returns table(
  key text,
  name_key text,
  description_key text,
  enabled boolean,
  rollout_percentage integer,
  rules jsonb,
  updated_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select f.key, f.name_key, f.description_key, f.enabled, f.rollout_percentage, f.rules, f.updated_at
  from public.platform_feature_flags f
  where public.has_platform_permission('platform.features.view')
  order by f.key;
$$;

create or replace function public.list_platform_audit_events(page_limit integer default 200)
returns table(
  event_id bigint,
  actor_user_id uuid,
  actor_email text,
  action text,
  target_type text,
  target_id text,
  reason text,
  metadata jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, auth
as $$
  select a.id, a.actor_user_id, coalesce(u.email, ''), a.action, a.target_type, a.target_id, a.reason, a.metadata, a.created_at
  from public.platform_audit_logs a
  left join auth.users u on u.id = a.actor_user_id
  where public.has_platform_permission('platform.audit.view')
  order by a.created_at desc
  limit greatest(1, least(page_limit, 1000));
$$;

-- ============================================================
-- CONTROL MUTATIONS
-- ============================================================

create or replace function public.set_platform_account_status(
  target_user_id uuid,
  target_status text,
  target_reason text default '',
  target_locked_until timestamptz default null
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row jsonb;
begin
  if not public.has_platform_permission('platform.users.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  if target_status not in ('active','restricted','suspended') then raise exception 'PLATFORM_INVALID_ACCOUNT_STATUS'; end if;
  if target_user_id = auth.uid() and target_status = 'suspended' then raise exception 'PLATFORM_SELF_SUSPENSION_FORBIDDEN'; end if;

  select to_jsonb(c) into before_row from public.platform_account_controls c where c.user_id = target_user_id;
  insert into public.platform_account_controls(user_id, status, reason, locked_until, reviewed_by, reviewed_at)
  values (target_user_id, target_status, trim(target_reason), target_locked_until, auth.uid(), timezone('utc'::text, now()))
  on conflict (user_id) do update set
    status = excluded.status,
    reason = excluded.reason,
    locked_until = excluded.locked_until,
    reviewed_by = excluded.reviewed_by,
    reviewed_at = excluded.reviewed_at,
    updated_at = timezone('utc'::text, now());

  perform public.write_platform_audit('platform.user.status_changed', 'user', target_user_id::text, target_reason, before_row, jsonb_build_object('status', target_status, 'locked_until', target_locked_until));
end;
$$;

create or replace function public.set_platform_organization_status(
  target_organization_id uuid,
  target_status text,
  target_reason text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row jsonb;
begin
  if not public.has_platform_permission('platform.organizations.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  if target_status not in ('active','suspended','archived') then raise exception 'PLATFORM_INVALID_ORGANIZATION_STATUS'; end if;
  select to_jsonb(o) into before_row from public.organizations o where o.id = target_organization_id;
  update public.organizations set status = target_status, updated_at = timezone('utc'::text, now()) where id = target_organization_id;
  if not found then raise exception 'PLATFORM_ORGANIZATION_NOT_FOUND'; end if;
  perform public.write_platform_audit('platform.organization.status_changed', 'organization', target_organization_id::text, target_reason, before_row, jsonb_build_object('status', target_status));
end;
$$;

create or replace function public.assign_platform_role_by_email(
  target_email text,
  target_role_key text,
  target_notes text default ''
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $$
declare
  target_user_id uuid;
  target_membership_id uuid;
  target_role_id uuid;
begin
  if not public.has_platform_permission('platform.access.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  select id into target_user_id from auth.users where lower(email) = lower(trim(target_email)) limit 1;
  if target_user_id is null then raise exception 'PLATFORM_USER_NOT_FOUND'; end if;
  select id into target_role_id from public.platform_roles where key = target_role_key;
  if target_role_id is null then raise exception 'PLATFORM_ROLE_NOT_FOUND'; end if;

  insert into public.platform_memberships(user_id, status, appointed_by, notes)
  values (target_user_id, 'active', auth.uid(), trim(target_notes))
  on conflict (user_id) do update set status = 'active', notes = excluded.notes, updated_at = timezone('utc'::text, now())
  returning id into target_membership_id;

  insert into public.platform_membership_roles(membership_id, role_id, assigned_by)
  values (target_membership_id, target_role_id, auth.uid())
  on conflict do nothing;

  perform public.write_platform_audit('platform.role.assigned', 'user', target_user_id::text, target_notes, null, jsonb_build_object('role', target_role_key));
  return jsonb_build_object('user_id', target_user_id, 'membership_id', target_membership_id, 'role', target_role_key);
end;
$$;

create or replace function public.remove_platform_role(
  target_user_id uuid,
  target_role_key text,
  target_reason text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  target_membership_id uuid;
  target_role_id uuid;
  owner_count integer;
begin
  if not public.has_platform_permission('platform.access.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  select id into target_membership_id from public.platform_memberships where user_id = target_user_id;
  select id into target_role_id from public.platform_roles where key = target_role_key;
  if target_membership_id is null or target_role_id is null then raise exception 'PLATFORM_MEMBERSHIP_OR_ROLE_NOT_FOUND'; end if;
  if target_role_key = 'platform_owner' then
    select count(*) into owner_count
    from public.platform_membership_roles mr
    join public.platform_memberships m on m.id = mr.membership_id and m.status = 'active'
    join public.platform_roles r on r.id = mr.role_id
    where r.key = 'platform_owner';
    if owner_count <= 1 then raise exception 'PLATFORM_LAST_OWNER_PROTECTED'; end if;
  end if;
  delete from public.platform_membership_roles where membership_id = target_membership_id and role_id = target_role_id;
  perform public.write_platform_audit('platform.role.removed', 'user', target_user_id::text, target_reason, jsonb_build_object('role', target_role_key), null);
end;
$$;

create or replace function public.update_platform_plan(
  target_plan_id uuid,
  target_status text,
  target_is_public boolean,
  target_trial_days integer,
  target_reason text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row jsonb;
begin
  if not public.has_platform_permission('platform.plans.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  if target_status not in ('draft','active','archived') then raise exception 'PLATFORM_INVALID_PLAN_STATUS'; end if;
  if target_is_public and not public.has_platform_permission('platform.plans.publish') then raise exception 'PLATFORM_PUBLISH_PERMISSION_REQUIRED'; end if;
  select to_jsonb(p) into before_row from public.billing_plans p where p.id = target_plan_id;
  update public.billing_plans set status = target_status, is_public = target_is_public, trial_days = greatest(0, least(target_trial_days, 365)), updated_at = timezone('utc'::text, now()) where id = target_plan_id;
  if not found then raise exception 'PLATFORM_PLAN_NOT_FOUND'; end if;
  perform public.write_platform_audit('platform.plan.updated', 'plan', target_plan_id::text, target_reason, before_row, jsonb_build_object('status', target_status, 'is_public', target_is_public, 'trial_days', target_trial_days));
end;
$$;

create or replace function public.update_platform_plan_feature(
  target_plan_id uuid,
  target_feature_key text,
  target_value jsonb
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_platform_permission('platform.plans.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  insert into public.billing_plan_features(plan_id, feature_key, value, updated_by, updated_at)
  values (target_plan_id, target_feature_key, target_value, auth.uid(), timezone('utc'::text, now()))
  on conflict (plan_id, feature_key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = excluded.updated_at;
  perform public.write_platform_audit('platform.plan.feature_updated', 'plan', target_plan_id::text, '', null, jsonb_build_object('feature', target_feature_key, 'value', target_value));
end;
$$;

create or replace function public.set_platform_feature_flag(
  target_key text,
  target_enabled boolean,
  target_rollout_percentage integer,
  target_reason text default ''
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row jsonb;
begin
  if not public.has_platform_permission('platform.features.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  select to_jsonb(f) into before_row from public.platform_feature_flags f where f.key = target_key;
  update public.platform_feature_flags set enabled = target_enabled, rollout_percentage = greatest(0, least(target_rollout_percentage, 100)), updated_by = auth.uid(), updated_at = timezone('utc'::text, now()) where key = target_key;
  if not found then raise exception 'PLATFORM_FEATURE_FLAG_NOT_FOUND'; end if;
  perform public.write_platform_audit('platform.feature_flag.updated', 'feature_flag', target_key, target_reason, before_row, jsonb_build_object('enabled', target_enabled, 'rollout_percentage', target_rollout_percentage));
end;
$$;

create or replace function public.start_platform_support_session(
  target_type text,
  target_id uuid,
  target_mode text,
  target_reason text,
  duration_minutes integer default 30
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  session_id uuid;
begin
  if not public.has_platform_permission('platform.support.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  if target_type not in ('user','organization') then raise exception 'PLATFORM_INVALID_SUPPORT_TARGET'; end if;
  if target_mode not in ('read_only','assisted_write') then raise exception 'PLATFORM_INVALID_SUPPORT_MODE'; end if;
  if length(trim(target_reason)) < 10 then raise exception 'PLATFORM_SUPPORT_REASON_REQUIRED'; end if;
  insert into public.platform_support_sessions(operator_user_id, target_type, target_id, mode, reason, expires_at)
  values (auth.uid(), target_type, target_id, target_mode, trim(target_reason), timezone('utc'::text, now()) + make_interval(mins => greatest(5, least(duration_minutes, 120))))
  returning id into session_id;
  perform public.write_platform_audit('platform.support_session.started', target_type, target_id::text, target_reason, null, jsonb_build_object('session_id', session_id, 'mode', target_mode, 'duration_minutes', duration_minutes));
  return session_id;
end;
$$;

create or replace function public.end_platform_support_session(target_session_id uuid, target_reason text default '')
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.has_platform_permission('platform.support.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  update public.platform_support_sessions set status = 'ended', ended_at = timezone('utc'::text, now()) where id = target_session_id and status = 'active';
  perform public.write_platform_audit('platform.support_session.ended', 'support_session', target_session_id::text, target_reason);
end;
$$;


create or replace function public.create_platform_data_request(
  target_request_type text,
  target_subject_type text,
  target_subject_id uuid,
  target_reason text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  request_id uuid;
begin
  if not public.has_platform_permission('platform.data.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  if target_request_type not in ('export','deletion','retention_hold','restore') then raise exception 'PLATFORM_INVALID_DATA_REQUEST'; end if;
  if target_subject_type not in ('user','organization') then raise exception 'PLATFORM_INVALID_DATA_SUBJECT'; end if;
  if length(trim(target_reason)) < 10 then raise exception 'PLATFORM_DATA_REASON_REQUIRED'; end if;
  insert into public.platform_data_requests(request_type, subject_type, subject_id, reason, requested_by)
  values (target_request_type, target_subject_type, target_subject_id, trim(target_reason), auth.uid())
  returning id into request_id;
  perform public.write_platform_audit('platform.data_request.created', target_subject_type, target_subject_id::text, target_reason, null, jsonb_build_object('request_id', request_id, 'request_type', target_request_type));
  return request_id;
end;
$$;

create or replace function public.update_platform_setting(
  target_key text,
  target_value jsonb,
  target_is_public boolean default false
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  before_row jsonb;
begin
  if not public.has_platform_permission('platform.settings.manage') then raise exception 'PLATFORM_ACCESS_DENIED'; end if;
  if target_key not in ('platform.branding','platform.security','platform.billing','platform.data') then raise exception 'PLATFORM_SETTING_NOT_ALLOWED'; end if;
  select to_jsonb(s) into before_row from public.platform_settings s where s.key = target_key;
  insert into public.platform_settings(key, value, is_public, updated_by, updated_at)
  values (target_key, coalesce(target_value, '{}'::jsonb), target_is_public, auth.uid(), timezone('utc'::text, now()))
  on conflict (key) do update set value = excluded.value, is_public = excluded.is_public, updated_by = auth.uid(), updated_at = timezone('utc'::text, now());
  perform public.write_platform_audit('platform.setting.updated', 'platform_setting', target_key, '', before_row, jsonb_build_object('value', target_value, 'is_public', target_is_public));
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.platform_permissions enable row level security;
alter table public.platform_roles enable row level security;
alter table public.platform_role_permissions enable row level security;
alter table public.platform_memberships enable row level security;
alter table public.platform_membership_roles enable row level security;
alter table public.platform_access_overrides enable row level security;
alter table public.platform_account_controls enable row level security;
alter table public.platform_settings enable row level security;
alter table public.billing_plans enable row level security;
alter table public.billing_plan_prices enable row level security;
alter table public.billing_features enable row level security;
alter table public.billing_plan_features enable row level security;
alter table public.billing_customers enable row level security;
alter table public.billing_subscriptions enable row level security;
alter table public.billing_subscription_entitlements enable row level security;
alter table public.billing_usage_counters enable row level security;
alter table public.billing_events enable row level security;
alter table public.platform_feature_flags enable row level security;
alter table public.platform_feature_flag_overrides enable row level security;
alter table public.platform_support_sessions enable row level security;
alter table public.platform_data_requests enable row level security;
alter table public.platform_audit_logs enable row level security;

drop policy if exists "platform permissions read" on public.platform_permissions;
create policy "platform permissions read" on public.platform_permissions for select to authenticated using (public.has_platform_permission('platform.access.view'));
drop policy if exists "platform roles read" on public.platform_roles;
create policy "platform roles read" on public.platform_roles for select to authenticated using (public.has_platform_permission('platform.access.view'));
drop policy if exists "platform role permissions read" on public.platform_role_permissions;
create policy "platform role permissions read" on public.platform_role_permissions for select to authenticated using (public.has_platform_permission('platform.access.view'));
drop policy if exists "platform memberships read" on public.platform_memberships;
create policy "platform memberships read" on public.platform_memberships for select to authenticated using (user_id = auth.uid() or public.has_platform_permission('platform.access.view'));
drop policy if exists "platform membership roles read" on public.platform_membership_roles;
create policy "platform membership roles read" on public.platform_membership_roles for select to authenticated using (public.has_platform_permission('platform.access.view'));
drop policy if exists "platform access overrides read" on public.platform_access_overrides;
create policy "platform access overrides read" on public.platform_access_overrides for select to authenticated using (public.has_platform_permission('platform.access.view'));
drop policy if exists "platform account controls read" on public.platform_account_controls;
create policy "platform account controls read" on public.platform_account_controls for select to authenticated using (user_id = auth.uid() or public.has_platform_permission('platform.security.view'));
drop policy if exists "platform settings read" on public.platform_settings;
create policy "platform settings read" on public.platform_settings for select to authenticated using (is_public or public.has_platform_permission('platform.settings.view'));

drop policy if exists "billing plans read" on public.billing_plans;
create policy "billing plans read" on public.billing_plans for select to authenticated using (is_public or public.has_platform_permission('platform.plans.view'));
drop policy if exists "billing plan prices read" on public.billing_plan_prices;
create policy "billing plan prices read" on public.billing_plan_prices for select to authenticated using (exists (select 1 from public.billing_plans p where p.id = plan_id and (p.is_public or public.has_platform_permission('platform.plans.view'))));
drop policy if exists "billing features read" on public.billing_features;
create policy "billing features read" on public.billing_features for select to authenticated using (true);
drop policy if exists "billing plan features read" on public.billing_plan_features;
create policy "billing plan features read" on public.billing_plan_features for select to authenticated using (exists (select 1 from public.billing_plans p where p.id = plan_id and (p.is_public or public.has_platform_permission('platform.plans.view'))));
drop policy if exists "billing customers platform read" on public.billing_customers;
create policy "billing customers platform read" on public.billing_customers for select to authenticated using (public.has_platform_permission('platform.subscriptions.view') or user_id = auth.uid() or (organization_id is not null and public.is_organization_member(organization_id)));
drop policy if exists "billing subscriptions platform read" on public.billing_subscriptions;
create policy "billing subscriptions platform read" on public.billing_subscriptions for select to authenticated using (public.has_platform_permission('platform.subscriptions.view') or exists (select 1 from public.billing_customers c where c.id = customer_id and (c.user_id = auth.uid() or (c.organization_id is not null and public.is_organization_member(c.organization_id)))));
drop policy if exists "billing entitlements read" on public.billing_subscription_entitlements;
create policy "billing entitlements read" on public.billing_subscription_entitlements for select to authenticated using (public.has_platform_permission('platform.subscriptions.view') or exists (select 1 from public.billing_subscriptions s join public.billing_customers c on c.id = s.customer_id where s.id = subscription_id and (c.user_id = auth.uid() or (c.organization_id is not null and public.is_organization_member(c.organization_id)))));
drop policy if exists "billing usage read" on public.billing_usage_counters;
create policy "billing usage read" on public.billing_usage_counters for select to authenticated using (public.has_platform_permission('platform.usage.view') or (subject_type = 'user' and subject_id = auth.uid()) or (subject_type = 'organization' and public.is_organization_member(subject_id)));
drop policy if exists "billing events platform read" on public.billing_events;
create policy "billing events platform read" on public.billing_events for select to authenticated using (public.has_platform_permission('platform.subscriptions.view'));

drop policy if exists "platform flags read" on public.platform_feature_flags;
create policy "platform flags read" on public.platform_feature_flags for select to authenticated using (public.has_platform_permission('platform.features.view'));
drop policy if exists "platform flag overrides read" on public.platform_feature_flag_overrides;
create policy "platform flag overrides read" on public.platform_feature_flag_overrides for select to authenticated using (public.has_platform_permission('platform.features.view'));
drop policy if exists "platform support sessions read" on public.platform_support_sessions;
create policy "platform support sessions read" on public.platform_support_sessions for select to authenticated using (operator_user_id = auth.uid() or public.has_platform_permission('platform.support.view'));
drop policy if exists "platform data requests read" on public.platform_data_requests;
create policy "platform data requests read" on public.platform_data_requests for select to authenticated using (requested_by = auth.uid() or public.has_platform_permission('platform.data.view'));
drop policy if exists "platform audit read" on public.platform_audit_logs;
create policy "platform audit read" on public.platform_audit_logs for select to authenticated using (public.has_platform_permission('platform.audit.view'));

-- Restrictive account gate: a platform suspension blocks all application data access,
-- not only the React interface.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'practicora_snapshots','profiles','organizations','organization_domains','organization_memberships',
    'permissions','roles','role_permissions','membership_roles','programs','cohorts','cohort_members',
    'placements','report_templates','report_submissions','report_reviews','organization_invitations',
    'notifications','audit_logs','user_workspace_preferences'
  ] loop
    if to_regclass('public.' || table_name) is not null then
      execute format('drop policy if exists "platform account gate" on public.%I', table_name);
      execute format('create policy "platform account gate" on public.%I as restrictive for all to authenticated using (public.is_practicora_account_allowed()) with check (public.is_practicora_account_allowed())', table_name);
    end if;
  end loop;
end
$$;

-- ============================================================
-- GRANTS
-- ============================================================

grant execute on function public.resolve_platform_context() to authenticated;
grant execute on function public.platform_dashboard_metrics() to authenticated;
grant execute on function public.list_platform_organizations(text,text,integer,integer) to authenticated;
grant execute on function public.list_platform_users(text,text,integer,integer) to authenticated;
grant execute on function public.list_platform_team() to authenticated;
grant execute on function public.list_platform_plans() to authenticated;
grant execute on function public.list_platform_subscriptions(integer) to authenticated;
grant execute on function public.list_platform_usage(integer) to authenticated;
grant execute on function public.list_platform_feature_flags() to authenticated;
grant execute on function public.list_platform_audit_events(integer) to authenticated;
grant execute on function public.set_platform_account_status(uuid,text,text,timestamptz) to authenticated;
grant execute on function public.set_platform_organization_status(uuid,text,text) to authenticated;
grant execute on function public.assign_platform_role_by_email(text,text,text) to authenticated;
grant execute on function public.remove_platform_role(uuid,text,text) to authenticated;
grant execute on function public.update_platform_plan(uuid,text,boolean,integer,text) to authenticated;
grant execute on function public.update_platform_plan_feature(uuid,text,jsonb) to authenticated;
grant execute on function public.set_platform_feature_flag(text,boolean,integer,text) to authenticated;
grant execute on function public.start_platform_support_session(text,uuid,text,text,integer) to authenticated;
grant execute on function public.end_platform_support_session(uuid,text) to authenticated;
grant execute on function public.create_platform_data_request(text,text,uuid,text) to authenticated;
grant execute on function public.update_platform_setting(text,jsonb,boolean) to authenticated;
grant execute on function public.is_practicora_account_allowed() to authenticated;
