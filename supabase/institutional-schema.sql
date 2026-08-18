-- Practicora Institutional Core V5
-- This section is included in the cumulative supabase/schema.sql release.
-- The standalone file remains available for projects that already installed the personal snapshot schema.
-- Idempotent where practical. Review in a staging project before production rollout.

create extension if not exists pgcrypto;

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  full_name text not null default '',
  avatar_url text,
  locale text not null default 'fr' check (locale in ('fr', 'en')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  type text not null default 'college',
  country text not null default 'CA',
  timezone text not null default 'America/Toronto',
  website text not null default '',
  contact_email text not null default '',
  retention_months integer not null default 36 check (retention_months between 1 and 120),
  allow_student_exports boolean not null default true,
  require_email_verification boolean not null default true,
  require_supervisor_approval boolean not null default false,
  auto_archive_completed boolean not null default true,
  status text not null default 'active' check (status in ('active', 'suspended', 'archived')),
  created_by uuid not null references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.organization_domains (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  domain text not null,
  verified_at timestamptz,
  verification_token_hash text,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (organization_id, domain)
);

create table if not exists public.organization_memberships (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'invited', 'suspended', 'left')),
  joined_at timestamptz not null default timezone('utc'::text, now()),
  last_used_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now()),
  unique (organization_id, user_id)
);

create table if not exists public.permissions (
  key text primary key,
  description text not null default ''
);

create table if not exists public.roles (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  key text not null,
  name text not null,
  is_system boolean not null default false,
  created_at timestamptz not null default timezone('utc'::text, now()),
  unique (organization_id, key)
);

create table if not exists public.role_permissions (
  role_id uuid not null references public.roles(id) on delete cascade,
  permission_key text not null references public.permissions(key) on delete cascade,
  primary key (role_id, permission_key)
);

create table if not exists public.membership_roles (
  membership_id uuid not null references public.organization_memberships(id) on delete cascade,
  role_id uuid not null references public.roles(id) on delete cascade,
  assigned_by uuid references auth.users(id),
  assigned_at timestamptz not null default timezone('utc'::text, now()),
  primary key (membership_id, role_id)
);

create table if not exists public.programs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  code text not null default '',
  description text not null default '',
  required_hours numeric(10,2) not null default 240 check (required_hours >= 0),
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.cohorts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  program_id uuid references public.programs(id) on delete set null,
  name text not null,
  start_date date,
  end_date date,
  status text not null default 'active' check (status in ('planned', 'active', 'completed', 'archived')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.cohort_members (
  cohort_id uuid not null references public.cohorts(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  member_type text not null default 'student' check (member_type in ('student', 'teacher', 'program_manager')),
  created_at timestamptz not null default timezone('utc'::text, now()),
  primary key (cohort_id, user_id, member_type)
);

create table if not exists public.placements (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  cohort_id uuid references public.cohorts(id) on delete set null,
  student_user_id uuid not null references auth.users(id) on delete cascade,
  teacher_user_id uuid references auth.users(id) on delete set null,
  supervisor_user_id uuid references auth.users(id) on delete set null,
  company text not null,
  role_title text not null default '',
  start_date date,
  end_date date,
  required_hours numeric(10,2) not null default 240 check (required_hours >= 0),
  logged_hours numeric(10,2) not null default 0 check (logged_hours >= 0),
  status text not null default 'active' check (status in ('planned', 'active', 'at_risk', 'completed', 'archived')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.report_templates (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  description text not null default '',
  report_type text not null default 'weekly',
  cadence text not null default 'weekly',
  sections jsonb not null default '[]'::jsonb,
  status text not null default 'active' check (status in ('active', 'inactive', 'archived')),
  created_by uuid not null default auth.uid() references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.report_submissions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  placement_id uuid not null references public.placements(id) on delete cascade,
  template_id uuid references public.report_templates(id) on delete set null,
  author_user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  report_type text not null default 'weekly',
  period_start date,
  period_end date,
  content jsonb not null default '{}'::jsonb,
  status text not null default 'draft' check (status in ('draft', 'ready', 'submitted', 'in_review', 'changes_requested', 'approved', 'rejected', 'archived')),
  submitted_at timestamptz,
  approved_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now()),
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.report_reviews (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  submission_id uuid not null references public.report_submissions(id) on delete cascade,
  reviewer_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null check (status in ('in_review', 'changes_requested', 'approved', 'rejected')),
  comment text not null default '',
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.organization_invitations (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  email text not null,
  role_key text not null check (role_key in ('admin', 'program_manager', 'teacher', 'supervisor', 'student')),
  program_id uuid references public.programs(id) on delete set null,
  cohort_id uuid references public.cohorts(id) on delete set null,
  token_hash text not null unique,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked', 'expired')),
  invited_by uuid not null references auth.users(id),
  expires_at timestamptz not null,
  accepted_at timestamptz,
  accepted_by uuid references auth.users(id),
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid references public.organizations(id) on delete cascade,
  recipient_user_id uuid not null references auth.users(id) on delete cascade,
  type text not null default 'message',
  title text not null,
  body text not null default '',
  action_url text not null default '',
  read_at timestamptz,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations(id) on delete cascade,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity_type text not null default '',
  entity_id text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default timezone('utc'::text, now())
);

create table if not exists public.user_workspace_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  active_organization_id uuid references public.organizations(id) on delete set null,
  updated_at timestamptz not null default timezone('utc'::text, now())
);

create index if not exists organization_memberships_user_idx on public.organization_memberships(user_id, status);
create index if not exists membership_roles_membership_idx on public.membership_roles(membership_id);
create index if not exists placements_org_idx on public.placements(organization_id, status);
create index if not exists placements_student_idx on public.placements(student_user_id, status);
create index if not exists report_submissions_org_status_idx on public.report_submissions(organization_id, status, updated_at desc);
create index if not exists notifications_recipient_idx on public.notifications(recipient_user_id, read_at, created_at desc);
create index if not exists audit_logs_org_idx on public.audit_logs(organization_id, created_at desc);
create index if not exists invitations_email_idx on public.organization_invitations(lower(email), status);

-- Permission catalogue
insert into public.permissions(key, description) values
  ('organization.configure', 'Configure organization settings'),
  ('members.view', 'View organization members'),
  ('members.invite', 'Invite organization members'),
  ('members.manage', 'Manage roles and memberships'),
  ('programs.view', 'View programs'),
  ('programs.manage', 'Manage programs'),
  ('cohorts.view', 'View cohorts'),
  ('cohorts.manage', 'Manage cohorts'),
  ('students.view', 'View all authorized students'),
  ('students.view_assigned', 'View assigned students'),
  ('placements.view', 'View placements'),
  ('placements.view_assigned', 'View assigned placements'),
  ('placements.manage', 'Manage placements'),
  ('reports.submit', 'Submit reports'),
  ('reports.review', 'Review reports'),
  ('reports.comment', 'Comment on reports'),
  ('hours.confirm', 'Confirm placement hours'),
  ('templates.view', 'View templates'),
  ('templates.manage', 'Manage templates'),
  ('analytics.view', 'View analytics'),
  ('audit.view', 'View audit log'),
  ('exports.generate', 'Generate administrative exports'),
  ('retention.manage', 'Manage retention policies')
on conflict (key) do update set description = excluded.description;

create or replace function public.handle_practicora_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles(id, email, full_name, avatar_url)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'name', ''),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do update set
    email = excluded.email,
    full_name = case when excluded.full_name <> '' then excluded.full_name else public.profiles.full_name end,
    avatar_url = coalesce(excluded.avatar_url, public.profiles.avatar_url),
    updated_at = timezone('utc'::text, now());
  return new;
end;
$$;

drop trigger if exists on_auth_user_practicora_profile on auth.users;
create trigger on_auth_user_practicora_profile
after insert or update of email, raw_user_meta_data on auth.users
for each row execute function public.handle_practicora_user();

create or replace function public.is_organization_member(target_organization_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.organization_memberships m
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
  );
$$;

create or replace function public.has_organization_role(target_organization_id uuid, target_role_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.roles r on r.id = mr.role_id
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and r.key = target_role_key
  );
$$;

create or replace function public.has_organization_permission(target_organization_id uuid, target_permission_key text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.organization_memberships m
    join public.membership_roles mr on mr.membership_id = m.id
    join public.role_permissions rp on rp.role_id = mr.role_id
    where m.organization_id = target_organization_id
      and m.user_id = auth.uid()
      and m.status = 'active'
      and rp.permission_key = target_permission_key
  );
$$;

create or replace function public.seed_practicora_roles(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  role_record record;
  permission_record record;
begin
  insert into public.roles(organization_id, key, name, is_system) values
    (target_organization_id, 'owner', 'Owner', true),
    (target_organization_id, 'admin', 'Administrator', true),
    (target_organization_id, 'program_manager', 'Program manager', true),
    (target_organization_id, 'teacher', 'Teacher', true),
    (target_organization_id, 'supervisor', 'Supervisor', true),
    (target_organization_id, 'student', 'Student', true)
  on conflict (organization_id, key) do nothing;

  -- Owner receives every permission.
  insert into public.role_permissions(role_id, permission_key)
  select r.id, p.key
  from public.roles r cross join public.permissions p
  where r.organization_id = target_organization_id and r.key = 'owner'
  on conflict do nothing;

  -- Administrator.
  insert into public.role_permissions(role_id, permission_key)
  select r.id, p.key
  from public.roles r join public.permissions p on p.key = any(array[
    'organization.configure','members.view','members.invite','members.manage','programs.view','programs.manage',
    'cohorts.view','cohorts.manage','students.view','placements.view','placements.manage','reports.review',
    'reports.comment','hours.confirm','templates.view','templates.manage','analytics.view','audit.view',
    'exports.generate','retention.manage'
  ])
  where r.organization_id = target_organization_id and r.key = 'admin'
  on conflict do nothing;

  -- Program manager.
  insert into public.role_permissions(role_id, permission_key)
  select r.id, p.key
  from public.roles r join public.permissions p on p.key = any(array[
    'members.view','members.invite','programs.view','programs.manage','cohorts.view','cohorts.manage',
    'students.view','placements.view','placements.manage','reports.review','reports.comment','hours.confirm',
    'templates.view','templates.manage','analytics.view','exports.generate'
  ])
  where r.organization_id = target_organization_id and r.key = 'program_manager'
  on conflict do nothing;

  -- Teacher.
  insert into public.role_permissions(role_id, permission_key)
  select r.id, p.key
  from public.roles r join public.permissions p on p.key = any(array[
    'programs.view','cohorts.view','students.view_assigned','placements.view_assigned','reports.review',
    'reports.comment','hours.confirm','templates.view'
  ])
  where r.organization_id = target_organization_id and r.key = 'teacher'
  on conflict do nothing;

  -- Supervisor.
  insert into public.role_permissions(role_id, permission_key)
  select r.id, p.key
  from public.roles r join public.permissions p on p.key = any(array[
    'students.view_assigned','placements.view_assigned','reports.comment','hours.confirm','templates.view'
  ])
  where r.organization_id = target_organization_id and r.key = 'supervisor'
  on conflict do nothing;

  -- Student.
  insert into public.role_permissions(role_id, permission_key)
  select r.id, p.key
  from public.roles r join public.permissions p on p.key = any(array['reports.submit','templates.view'])
  where r.organization_id = target_organization_id and r.key = 'student'
  on conflict do nothing;
end;
$$;

create or replace function public.write_practicora_audit(
  target_organization_id uuid,
  target_action text,
  target_entity_type text default '',
  target_entity_id text default '',
  target_metadata jsonb default '{}'::jsonb
)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.audit_logs(organization_id, actor_user_id, action, entity_type, entity_id, metadata)
  values (target_organization_id, auth.uid(), target_action, target_entity_type, target_entity_id, coalesce(target_metadata, '{}'::jsonb));
$$;

create or replace function public.create_practicora_organization(
  organization_name text,
  organization_slug text,
  organization_type text default 'college',
  organization_country text default 'CA',
  organization_timezone text default 'America/Toronto'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  new_organization public.organizations;
  new_membership public.organization_memberships;
  owner_role_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  if length(trim(organization_name)) < 2 then raise exception 'Organization name is required'; end if;
  if organization_slug !~ '^[a-z0-9]+(?:-[a-z0-9]+)*$' then raise exception 'Invalid organization slug'; end if;

  insert into public.organizations(name, slug, type, country, timezone, created_by)
  values (trim(organization_name), lower(organization_slug), organization_type, organization_country, organization_timezone, current_user_id)
  returning * into new_organization;

  perform public.seed_practicora_roles(new_organization.id);

  insert into public.organization_memberships(organization_id, user_id, status, last_used_at)
  values (new_organization.id, current_user_id, 'active', timezone('utc'::text, now()))
  returning * into new_membership;

  select id into owner_role_id from public.roles where organization_id = new_organization.id and key = 'owner';
  insert into public.membership_roles(membership_id, role_id, assigned_by)
  values (new_membership.id, owner_role_id, current_user_id)
  on conflict do nothing;

  insert into public.user_workspace_preferences(user_id, active_organization_id)
  values (current_user_id, new_organization.id)
  on conflict (user_id) do update set active_organization_id = excluded.active_organization_id, updated_at = timezone('utc'::text, now());

  perform public.write_practicora_audit(new_organization.id, 'organization.created', 'organization', new_organization.id::text, jsonb_build_object('name', new_organization.name));
  return jsonb_build_object('organization_id', new_organization.id, 'membership_id', new_membership.id);
end;
$$;

create or replace function public.resolve_practicora_context()
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  with memberships as (
    select
      m.id as membership_id,
      m.organization_id,
      m.status,
      m.last_used_at,
      o.name as organization_name,
      o.slug as organization_slug,
      coalesce((select jsonb_agg(r.key order by r.key) from public.membership_roles mr join public.roles r on r.id = mr.role_id where mr.membership_id = m.id), '[]'::jsonb) as roles,
      coalesce((select jsonb_agg(distinct rp.permission_key order by rp.permission_key) from public.membership_roles mr join public.role_permissions rp on rp.role_id = mr.role_id where mr.membership_id = m.id), '[]'::jsonb) as permissions
    from public.organization_memberships m
    join public.organizations o on o.id = m.organization_id
    where m.user_id = auth.uid() and m.status = 'active' and o.status = 'active'
  ), preferred as (
    select active_organization_id from public.user_workspace_preferences where user_id = auth.uid()
  )
  select jsonb_build_object(
    'profile', coalesce((select to_jsonb(p) - 'created_at' - 'updated_at' from public.profiles p where p.id = auth.uid()), '{}'::jsonb),
    'memberships', coalesce((select jsonb_agg(to_jsonb(memberships) order by last_used_at desc nulls last) from memberships), '[]'::jsonb),
    'recommended_workspace_id', coalesce(
      (select 'organization:' || p.active_organization_id::text from preferred p where exists (select 1 from memberships m where m.organization_id = p.active_organization_id)),
      (select 'organization:' || m.organization_id::text from memberships m order by m.last_used_at desc nulls last limit 1),
      'personal'
    )
  );
$$;

create or replace function public.set_active_practicora_workspace(target_organization_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_organization_member(target_organization_id) then raise exception 'Access denied'; end if;
  update public.organization_memberships set last_used_at = timezone('utc'::text, now()) where organization_id = target_organization_id and user_id = auth.uid();
  insert into public.user_workspace_preferences(user_id, active_organization_id)
  values (auth.uid(), target_organization_id)
  on conflict (user_id) do update set active_organization_id = excluded.active_organization_id, updated_at = timezone('utc'::text, now());
end;
$$;

create or replace function public.create_organization_invitation(
  target_organization_id uuid,
  target_email text,
  target_role_key text,
  target_program_id uuid default null,
  target_cohort_id uuid default null,
  expires_in_days integer default 14
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_token text := encode(gen_random_bytes(24), 'hex');
  new_invitation_id uuid;
begin
  if not public.has_organization_permission(target_organization_id, 'members.invite') then raise exception 'Access denied'; end if;
  if target_role_key not in ('admin','program_manager','teacher','supervisor','student') then raise exception 'Invalid role'; end if;
  if target_email !~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' then raise exception 'Invalid email'; end if;

  insert into public.organization_invitations(organization_id, email, role_key, program_id, cohort_id, token_hash, invited_by, expires_at)
  values (target_organization_id, lower(trim(target_email)), target_role_key, target_program_id, target_cohort_id, encode(digest(raw_token, 'sha256'), 'hex'), auth.uid(), timezone('utc'::text, now()) + make_interval(days => greatest(1, least(expires_in_days, 90))))
  returning id into new_invitation_id;

  perform public.write_practicora_audit(target_organization_id, 'invitation.created', 'invitation', new_invitation_id::text, jsonb_build_object('email', lower(trim(target_email)), 'role', target_role_key));
  return jsonb_build_object('invitation_id', new_invitation_id, 'token', raw_token);
end;
$$;

create or replace function public.accept_organization_invitation(invitation_token text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  current_user_id uuid := auth.uid();
  current_email text := lower(coalesce(auth.jwt()->>'email', ''));
  invitation public.organization_invitations;
  membership public.organization_memberships;
  selected_role_id uuid;
begin
  if current_user_id is null then raise exception 'Authentication required'; end if;
  select * into invitation from public.organization_invitations
  where token_hash = encode(digest(invitation_token, 'sha256'), 'hex')
    and status = 'pending'
    and expires_at > timezone('utc'::text, now())
  for update;
  if invitation.id is null then raise exception 'Invitation is invalid or expired'; end if;
  if lower(invitation.email) <> current_email then raise exception 'This invitation belongs to another email address'; end if;

  insert into public.organization_memberships(organization_id, user_id, status, last_used_at)
  values (invitation.organization_id, current_user_id, 'active', timezone('utc'::text, now()))
  on conflict (organization_id, user_id) do update set status = 'active', last_used_at = timezone('utc'::text, now())
  returning * into membership;

  select id into selected_role_id from public.roles where organization_id = invitation.organization_id and key = invitation.role_key;
  if selected_role_id is null then perform public.seed_practicora_roles(invitation.organization_id); select id into selected_role_id from public.roles where organization_id = invitation.organization_id and key = invitation.role_key; end if;
  insert into public.membership_roles(membership_id, role_id, assigned_by) values (membership.id, selected_role_id, invitation.invited_by) on conflict do nothing;

  if invitation.cohort_id is not null then
    insert into public.cohort_members(cohort_id, user_id, member_type)
    values (invitation.cohort_id, current_user_id, case when invitation.role_key = 'teacher' then 'teacher' when invitation.role_key = 'program_manager' then 'program_manager' else 'student' end)
    on conflict do nothing;
  end if;

  update public.organization_invitations set status = 'accepted', accepted_at = timezone('utc'::text, now()), accepted_by = current_user_id where id = invitation.id;
  insert into public.user_workspace_preferences(user_id, active_organization_id) values (current_user_id, invitation.organization_id) on conflict (user_id) do update set active_organization_id = excluded.active_organization_id, updated_at = timezone('utc'::text, now());
  perform public.write_practicora_audit(invitation.organization_id, 'invitation.accepted', 'invitation', invitation.id::text, jsonb_build_object('user_id', current_user_id, 'role', invitation.role_key));
  return jsonb_build_object('organization_id', invitation.organization_id, 'membership_id', membership.id, 'role', invitation.role_key);
end;
$$;

create or replace function public.organization_dashboard_metrics(target_organization_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public
as $$
  select case when public.is_organization_member(target_organization_id) then jsonb_build_object(
    'member_count', (select count(*) from public.organization_memberships where organization_id = target_organization_id and status = 'active'),
    'student_count', (select count(distinct m.user_id) from public.organization_memberships m join public.membership_roles mr on mr.membership_id = m.id join public.roles r on r.id = mr.role_id where m.organization_id = target_organization_id and m.status = 'active' and r.key = 'student'),
    'teacher_count', (select count(distinct m.user_id) from public.organization_memberships m join public.membership_roles mr on mr.membership_id = m.id join public.roles r on r.id = mr.role_id where m.organization_id = target_organization_id and m.status = 'active' and r.key in ('teacher','program_manager')),
    'active_placements', (select count(*) from public.placements where organization_id = target_organization_id and status in ('planned','active','at_risk')),
    'reports_waiting', (select count(*) from public.report_submissions where organization_id = target_organization_id and status in ('submitted','in_review','changes_requested')),
    'at_risk_placements', (select count(*) from public.placements where organization_id = target_organization_id and status = 'at_risk'),
    'completion_rate', coalesce((select avg(case when required_hours > 0 then least(100, logged_hours / required_hours * 100) else 0 end) from public.placements where organization_id = target_organization_id and status <> 'archived'), 0)
  ) else '{}'::jsonb end;
$$;

create or replace function public.list_organization_members(target_organization_id uuid)
returns table(membership_id uuid, user_id uuid, full_name text, email text, status text, roles jsonb, joined_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select m.id, m.user_id, coalesce(p.full_name, ''), coalesce(p.email, ''), m.status,
    coalesce((select jsonb_agg(r.key order by r.key) from public.membership_roles mr join public.roles r on r.id = mr.role_id where mr.membership_id = m.id), '[]'::jsonb),
    m.joined_at
  from public.organization_memberships m left join public.profiles p on p.id = m.user_id
  where m.organization_id = target_organization_id
    and (m.user_id = auth.uid() or public.has_organization_permission(target_organization_id, 'members.view') or public.has_organization_permission(target_organization_id, 'students.view') or public.has_organization_permission(target_organization_id, 'students.view_assigned'))
  order by coalesce(p.full_name, p.email, '') asc;
$$;

create or replace function public.list_organization_cohorts(target_organization_id uuid)
returns table(id uuid, program_id uuid, program_name text, name text, start_date date, end_date date, status text, student_count bigint)
language sql
stable
security definer
set search_path = public
as $$
  select c.id, c.program_id, coalesce(p.name, ''), c.name, c.start_date, c.end_date, c.status,
    (select count(*) from public.cohort_members cm where cm.cohort_id = c.id and cm.member_type = 'student')
  from public.cohorts c left join public.programs p on p.id = c.program_id
  where c.organization_id = target_organization_id and public.is_organization_member(target_organization_id)
  order by c.created_at desc;
$$;

create or replace function public.list_organization_placements(target_organization_id uuid)
returns table(id uuid, student_name text, company text, role_title text, teacher_name text, supervisor_name text, status text, logged_hours numeric, required_hours numeric)
language sql
stable
security definer
set search_path = public
as $$
  select pl.id, coalesce(sp.full_name, sp.email, ''), pl.company, pl.role_title,
    coalesce(tp.full_name, tp.email, ''), coalesce(vp.full_name, vp.email, ''), pl.status, pl.logged_hours, pl.required_hours
  from public.placements pl
  left join public.profiles sp on sp.id = pl.student_user_id
  left join public.profiles tp on tp.id = pl.teacher_user_id
  left join public.profiles vp on vp.id = pl.supervisor_user_id
  where pl.organization_id = target_organization_id
    and (
      public.has_organization_permission(target_organization_id, 'placements.view')
      or (public.has_organization_permission(target_organization_id, 'placements.view_assigned') and auth.uid() in (pl.student_user_id, pl.teacher_user_id, pl.supervisor_user_id))
      or auth.uid() = pl.student_user_id
    )
  order by pl.updated_at desc;
$$;

create or replace function public.list_organization_reports(target_organization_id uuid)
returns table(id uuid, title text, student_name text, report_type text, period_label text, status text, submitted_at timestamptz, updated_at timestamptz)
language sql
stable
security definer
set search_path = public
as $$
  select rs.id, rs.title, coalesce(p.full_name, p.email, ''), rs.report_type,
    case when rs.period_start is null and rs.period_end is null then '' else concat(coalesce(rs.period_start::text, ''), case when rs.period_end is not null then ' — ' || rs.period_end::text else '' end) end,
    rs.status, rs.submitted_at, rs.updated_at
  from public.report_submissions rs
  join public.placements pl on pl.id = rs.placement_id
  left join public.profiles p on p.id = pl.student_user_id
  where rs.organization_id = target_organization_id
    and (
      rs.author_user_id = auth.uid()
      or public.has_organization_permission(target_organization_id, 'reports.review')
      or (public.has_organization_permission(target_organization_id, 'reports.comment') and auth.uid() in (pl.teacher_user_id, pl.supervisor_user_id))
    )
  order by rs.updated_at desc;
$$;


create or replace function public.submit_practicora_report(
  target_organization_id uuid,
  report_title text,
  report_type_value text,
  period_start_value date default null,
  period_end_value date default null,
  total_hours_value numeric default 0,
  report_content jsonb default '{}'::jsonb,
  submission_status text default 'submitted'
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  placement_record public.placements;
  submission_id uuid;
  safe_status text;
begin
  if auth.uid() is null then raise exception 'Authentication required'; end if;
  safe_status := case when submission_status in ('ready', 'submitted') then submission_status else 'submitted' end;

  select * into placement_record
  from public.placements
  where organization_id = target_organization_id
    and student_user_id = auth.uid()
    and status in ('planned', 'active', 'at_risk')
  order by created_at desc
  limit 1;

  if placement_record.id is null then raise exception 'No active placement found'; end if;
  if not public.is_organization_member(target_organization_id) then raise exception 'Access denied'; end if;

  insert into public.report_submissions(
    organization_id,
    placement_id,
    author_user_id,
    title,
    report_type,
    period_start,
    period_end,
    content,
    status,
    submitted_at
  ) values (
    target_organization_id,
    placement_record.id,
    auth.uid(),
    left(coalesce(nullif(trim(report_title), ''), 'Professional report'), 180),
    coalesce(nullif(trim(report_type_value), ''), 'weekly'),
    period_start_value,
    period_end_value,
    coalesce(report_content, '{}'::jsonb),
    safe_status,
    case when safe_status = 'submitted' then timezone('utc'::text, now()) else null end
  ) returning id into submission_id;

  update public.placements
  set logged_hours = greatest(logged_hours, greatest(coalesce(total_hours_value, 0), 0))
  where id = placement_record.id;

  insert into public.notifications(organization_id, recipient_user_id, type, title, body, action_url)
  select target_organization_id, recipient_id, 'report', 'New report submitted', report_title, '/app/organization/reports'
  from (
    values (placement_record.teacher_user_id), (placement_record.supervisor_user_id)
  ) as recipients(recipient_id)
  where recipient_id is not null;

  perform public.write_practicora_audit(
    target_organization_id,
    'report.submitted',
    'report_submission',
    submission_id::text,
    jsonb_build_object('report_type', report_type_value, 'total_hours', total_hours_value)
  );

  return jsonb_build_object('id', submission_id, 'status', safe_status, 'placement_id', placement_record.id);
end;
$$;

create or replace function public.review_report_submission(target_submission_id uuid, target_status text, review_comment text default null)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  submission public.report_submissions;
begin
  select * into submission from public.report_submissions where id = target_submission_id for update;
  if submission.id is null then raise exception 'Report not found'; end if;
  if not (public.has_organization_permission(submission.organization_id, 'reports.review') or public.has_organization_permission(submission.organization_id, 'reports.comment')) then raise exception 'Access denied'; end if;
  if target_status not in ('in_review','changes_requested','approved','rejected') then raise exception 'Invalid status'; end if;
  insert into public.report_reviews(organization_id, submission_id, reviewer_user_id, status, comment)
  values (submission.organization_id, submission.id, auth.uid(), target_status, coalesce(review_comment, ''));
  update public.report_submissions set status = target_status, approved_at = case when target_status = 'approved' then timezone('utc'::text, now()) else approved_at end where id = submission.id;
  insert into public.notifications(organization_id, recipient_user_id, type, title, body, action_url)
  values (submission.organization_id, submission.author_user_id, 'review', 'Report review updated', coalesce(review_comment, target_status), '/app/reports');
  perform public.write_practicora_audit(submission.organization_id, 'report.' || target_status, 'report_submission', submission.id::text, jsonb_build_object('comment', coalesce(review_comment, '')));
  return jsonb_build_object('id', submission.id, 'status', target_status);
end;
$$;

create or replace function public.list_organization_audit_events(target_organization_id uuid)
returns table(id uuid, action text, entity_type text, entity_id text, actor_name text, created_at timestamptz, metadata jsonb)
language sql
stable
security definer
set search_path = public
as $$
  select a.id, a.action, a.entity_type, a.entity_id, coalesce(p.full_name, p.email, 'System'), a.created_at, a.metadata
  from public.audit_logs a left join public.profiles p on p.id = a.actor_user_id
  where a.organization_id = target_organization_id and public.has_organization_permission(target_organization_id, 'audit.view')
  order by a.created_at desc limit 250;
$$;

-- Updated-at triggers
do $$
begin
  -- Empty block keeps the following idempotent trigger statements grouped in this script.
end $$;

drop trigger if exists profiles_updated_at on public.profiles;
create trigger profiles_updated_at before update on public.profiles for each row execute function public.set_updated_at();
drop trigger if exists organizations_updated_at on public.organizations;
create trigger organizations_updated_at before update on public.organizations for each row execute function public.set_updated_at();
drop trigger if exists memberships_updated_at on public.organization_memberships;
create trigger memberships_updated_at before update on public.organization_memberships for each row execute function public.set_updated_at();
drop trigger if exists programs_updated_at on public.programs;
create trigger programs_updated_at before update on public.programs for each row execute function public.set_updated_at();
drop trigger if exists cohorts_updated_at on public.cohorts;
create trigger cohorts_updated_at before update on public.cohorts for each row execute function public.set_updated_at();
drop trigger if exists placements_updated_at on public.placements;
create trigger placements_updated_at before update on public.placements for each row execute function public.set_updated_at();
drop trigger if exists report_templates_updated_at on public.report_templates;
create trigger report_templates_updated_at before update on public.report_templates for each row execute function public.set_updated_at();
drop trigger if exists report_submissions_updated_at on public.report_submissions;
create trigger report_submissions_updated_at before update on public.report_submissions for each row execute function public.set_updated_at();

-- RLS
alter table public.profiles enable row level security;
alter table public.organizations enable row level security;
alter table public.organization_domains enable row level security;
alter table public.organization_memberships enable row level security;
alter table public.roles enable row level security;
alter table public.permissions enable row level security;
alter table public.role_permissions enable row level security;
alter table public.membership_roles enable row level security;
alter table public.programs enable row level security;
alter table public.cohorts enable row level security;
alter table public.cohort_members enable row level security;
alter table public.placements enable row level security;
alter table public.report_templates enable row level security;
alter table public.report_submissions enable row level security;
alter table public.report_reviews enable row level security;
alter table public.organization_invitations enable row level security;
alter table public.notifications enable row level security;
alter table public.audit_logs enable row level security;
alter table public.user_workspace_preferences enable row level security;

-- Drop/recreate named policies for repeatable installs.
drop policy if exists "profiles self read" on public.profiles;
create policy "profiles self read" on public.profiles for select to authenticated using (id = auth.uid());
drop policy if exists "profiles organization read" on public.profiles;
create policy "profiles organization read" on public.profiles for select to authenticated using (exists (select 1 from public.organization_memberships mine join public.organization_memberships theirs on theirs.organization_id = mine.organization_id where mine.user_id = auth.uid() and mine.status = 'active' and theirs.user_id = profiles.id and theirs.status = 'active'));
drop policy if exists "profiles self update" on public.profiles;
create policy "profiles self update" on public.profiles for update to authenticated using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists "organizations member read" on public.organizations;
create policy "organizations member read" on public.organizations for select to authenticated using (public.is_organization_member(id));
drop policy if exists "organizations configure" on public.organizations;
create policy "organizations configure" on public.organizations for update to authenticated using (public.has_organization_permission(id, 'organization.configure')) with check (public.has_organization_permission(id, 'organization.configure'));

drop policy if exists "memberships allowed read" on public.organization_memberships;
create policy "memberships allowed read" on public.organization_memberships for select to authenticated using (user_id = auth.uid() or public.has_organization_permission(organization_id, 'members.view') or public.has_organization_permission(organization_id, 'students.view') or public.has_organization_permission(organization_id, 'students.view_assigned'));
drop policy if exists "memberships manage" on public.organization_memberships;
create policy "memberships manage" on public.organization_memberships for update to authenticated using (public.has_organization_permission(organization_id, 'members.manage')) with check (public.has_organization_permission(organization_id, 'members.manage'));

drop policy if exists "permissions authenticated read" on public.permissions;
create policy "permissions authenticated read" on public.permissions for select to authenticated using (true);
drop policy if exists "roles member read" on public.roles;
create policy "roles member read" on public.roles for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists "role permissions member read" on public.role_permissions;
create policy "role permissions member read" on public.role_permissions for select to authenticated using (exists (select 1 from public.roles r where r.id = role_id and public.is_organization_member(r.organization_id)));
drop policy if exists "membership roles allowed read" on public.membership_roles;
create policy "membership roles allowed read" on public.membership_roles for select to authenticated using (exists (select 1 from public.organization_memberships m where m.id = membership_id and (m.user_id = auth.uid() or public.has_organization_permission(m.organization_id, 'members.view'))));

drop policy if exists "programs member read" on public.programs;
create policy "programs member read" on public.programs for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists "programs manage insert" on public.programs;
create policy "programs manage insert" on public.programs for insert to authenticated with check (public.has_organization_permission(organization_id, 'programs.manage'));
drop policy if exists "programs manage update" on public.programs;
create policy "programs manage update" on public.programs for update to authenticated using (public.has_organization_permission(organization_id, 'programs.manage')) with check (public.has_organization_permission(organization_id, 'programs.manage'));

drop policy if exists "cohorts member read" on public.cohorts;
create policy "cohorts member read" on public.cohorts for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists "cohorts manage insert" on public.cohorts;
create policy "cohorts manage insert" on public.cohorts for insert to authenticated with check (public.has_organization_permission(organization_id, 'cohorts.manage'));
drop policy if exists "cohorts manage update" on public.cohorts;
create policy "cohorts manage update" on public.cohorts for update to authenticated using (public.has_organization_permission(organization_id, 'cohorts.manage')) with check (public.has_organization_permission(organization_id, 'cohorts.manage'));

drop policy if exists "cohort members read" on public.cohort_members;
create policy "cohort members read" on public.cohort_members for select to authenticated using (user_id = auth.uid() or exists (select 1 from public.cohorts c where c.id = cohort_id and public.is_organization_member(c.organization_id)));
drop policy if exists "cohort members manage" on public.cohort_members;
create policy "cohort members manage" on public.cohort_members for all to authenticated using (exists (select 1 from public.cohorts c where c.id = cohort_id and public.has_organization_permission(c.organization_id, 'cohorts.manage'))) with check (exists (select 1 from public.cohorts c where c.id = cohort_id and public.has_organization_permission(c.organization_id, 'cohorts.manage')));

drop policy if exists "placements allowed read" on public.placements;
create policy "placements allowed read" on public.placements for select to authenticated using (student_user_id = auth.uid() or teacher_user_id = auth.uid() or supervisor_user_id = auth.uid() or public.has_organization_permission(organization_id, 'placements.view'));
drop policy if exists "placements manage insert" on public.placements;
create policy "placements manage insert" on public.placements for insert to authenticated with check (public.has_organization_permission(organization_id, 'placements.manage'));
drop policy if exists "placements manage update" on public.placements;
create policy "placements manage update" on public.placements for update to authenticated using (public.has_organization_permission(organization_id, 'placements.manage') or teacher_user_id = auth.uid() or supervisor_user_id = auth.uid()) with check (public.has_organization_permission(organization_id, 'placements.manage') or teacher_user_id = auth.uid() or supervisor_user_id = auth.uid());

drop policy if exists "templates member read" on public.report_templates;
create policy "templates member read" on public.report_templates for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists "templates manage insert" on public.report_templates;
create policy "templates manage insert" on public.report_templates for insert to authenticated with check (public.has_organization_permission(organization_id, 'templates.manage'));
drop policy if exists "templates manage update" on public.report_templates;
create policy "templates manage update" on public.report_templates for update to authenticated using (public.has_organization_permission(organization_id, 'templates.manage')) with check (public.has_organization_permission(organization_id, 'templates.manage'));

drop policy if exists "submissions allowed read" on public.report_submissions;
create policy "submissions allowed read" on public.report_submissions for select to authenticated using (author_user_id = auth.uid() or exists (select 1 from public.placements p where p.id = placement_id and auth.uid() in (p.student_user_id, p.teacher_user_id, p.supervisor_user_id)) or public.has_organization_permission(organization_id, 'reports.review'));
drop policy if exists "submissions student insert" on public.report_submissions;
create policy "submissions student insert" on public.report_submissions for insert to authenticated with check (author_user_id = auth.uid() and exists (select 1 from public.placements p where p.id = placement_id and p.student_user_id = auth.uid()));
drop policy if exists "submissions allowed update" on public.report_submissions;
create policy "submissions allowed update" on public.report_submissions for update to authenticated using ((author_user_id = auth.uid() and status in ('draft','ready','changes_requested')) or public.has_organization_permission(organization_id, 'reports.review')) with check ((author_user_id = auth.uid()) or public.has_organization_permission(organization_id, 'reports.review'));

drop policy if exists "reviews allowed read" on public.report_reviews;
create policy "reviews allowed read" on public.report_reviews for select to authenticated using (reviewer_user_id = auth.uid() or exists (select 1 from public.report_submissions s where s.id = submission_id and s.author_user_id = auth.uid()) or public.has_organization_permission(organization_id, 'reports.review'));

drop policy if exists "invitations manager read" on public.organization_invitations;
create policy "invitations manager read" on public.organization_invitations for select to authenticated using (public.has_organization_permission(organization_id, 'members.invite'));

drop policy if exists "notifications recipient read" on public.notifications;
create policy "notifications recipient read" on public.notifications for select to authenticated using (recipient_user_id = auth.uid());
drop policy if exists "notifications recipient update" on public.notifications;
create policy "notifications recipient update" on public.notifications for update to authenticated using (recipient_user_id = auth.uid()) with check (recipient_user_id = auth.uid());

drop policy if exists "audit authorized read" on public.audit_logs;
create policy "audit authorized read" on public.audit_logs for select to authenticated using (public.has_organization_permission(organization_id, 'audit.view'));

drop policy if exists "workspace preference self" on public.user_workspace_preferences;
create policy "workspace preference self" on public.user_workspace_preferences for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists "domains member read" on public.organization_domains;
create policy "domains member read" on public.organization_domains for select to authenticated using (public.is_organization_member(organization_id));
drop policy if exists "domains configure" on public.organization_domains;
create policy "domains configure" on public.organization_domains for all to authenticated using (public.has_organization_permission(organization_id, 'organization.configure')) with check (public.has_organization_permission(organization_id, 'organization.configure'));

-- Grant RPC execution to authenticated users.
grant execute on function public.create_practicora_organization(text,text,text,text,text) to authenticated;
grant execute on function public.resolve_practicora_context() to authenticated;
grant execute on function public.set_active_practicora_workspace(uuid) to authenticated;
grant execute on function public.create_organization_invitation(uuid,text,text,uuid,uuid,integer) to authenticated;
grant execute on function public.accept_organization_invitation(text) to authenticated;
grant execute on function public.organization_dashboard_metrics(uuid) to authenticated;
grant execute on function public.list_organization_members(uuid) to authenticated;
grant execute on function public.list_organization_cohorts(uuid) to authenticated;
grant execute on function public.list_organization_placements(uuid) to authenticated;
grant execute on function public.list_organization_reports(uuid) to authenticated;
grant execute on function public.review_report_submission(uuid,text,text) to authenticated;
grant execute on function public.list_organization_audit_events(uuid) to authenticated;


grant execute on function public.submit_practicora_report(uuid,text,text,date,date,numeric,jsonb,text) to authenticated;
