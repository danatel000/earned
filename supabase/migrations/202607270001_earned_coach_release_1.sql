create table if not exists public.coach_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  settings jsonb not null default '{}'::jsonb,
  disclosure_version text,
  disclosure_accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_threads (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default 'Coach conversation',
  mode text not null check (mode in ('pre_workout','in_session','post_workout','planning')),
  summary text not null default '',
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid not null references public.coach_threads(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null check (char_length(content) between 1 and 12000),
  structured_answer jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_memory_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.coach_threads(id) on delete cascade,
  kind text not null check (kind in ('decision','preference','follow_up')),
  content text not null check (char_length(content) between 1 and 1000),
  source_refs jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_data_exclusions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  target_type text not null check (target_type in ('session','date_range','exercise','data_category')),
  target_key text not null,
  selector jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique(user_id,target_type,target_key)
);

create table if not exists public.coach_trigger_states (
  user_id uuid not null references auth.users(id) on delete cascade,
  trigger_key text not null,
  trigger_type text not null,
  status text not null check (status in ('active','dismissed','muted')),
  evidence jsonb not null default '{}'::jsonb,
  first_seen_at timestamptz not null default now(),
  last_seen_at timestamptz not null default now(),
  primary key(user_id,trigger_key)
);

create table if not exists public.coach_audit_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  thread_id uuid references public.coach_threads(id) on delete set null,
  request_id uuid not null,
  event_type text not null,
  provider text,
  model text,
  evidence jsonb not null default '{}'::jsonb,
  source_versions jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.coach_source_registry (
  source_id text primary key,
  title text not null,
  canonical_url text not null,
  topics text[] not null default '{}',
  trust_tier integer not null check (trust_tier between 1 and 3),
  license_status text not null check (license_status in ('public_domain','licensed','earned_authored','metadata_only')),
  status text not null check (status in ('draft','review_required','approved','retired')),
  refresh_days integer not null check (refresh_days between 1 and 3650),
  last_reviewed_at timestamptz,
  last_successful_ingest_at timestamptz,
  current_version text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.coach_source_versions (
  source_id text not null references public.coach_source_registry(source_id) on delete cascade,
  version text not null,
  content_hash text not null,
  content text not null,
  status text not null check (status in ('review_required','approved','ingesting','active','failed','superseded')),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  ingested_at timestamptz,
  primary key(source_id,version)
);

create index if not exists coach_threads_user_updated_idx
on public.coach_threads(user_id,updated_at desc);

create index if not exists coach_messages_thread_created_idx
on public.coach_messages(thread_id,created_at);

create index if not exists coach_audit_user_created_idx
on public.coach_audit_events(user_id,created_at desc);

create index if not exists coach_source_status_idx
on public.coach_source_registry(status,trust_tier);

alter table public.coach_settings enable row level security;
alter table public.coach_threads enable row level security;
alter table public.coach_messages enable row level security;
alter table public.coach_memory_items enable row level security;
alter table public.coach_data_exclusions enable row level security;
alter table public.coach_trigger_states enable row level security;
alter table public.coach_audit_events enable row level security;
alter table public.coach_source_registry enable row level security;
alter table public.coach_source_versions enable row level security;

drop policy if exists "Coach settings owner can read" on public.coach_settings;
drop policy if exists "Coach settings owner can insert" on public.coach_settings;
drop policy if exists "Coach settings owner can update" on public.coach_settings;
drop policy if exists "Coach settings owner can delete" on public.coach_settings;

create policy "Coach settings owner can read"
on public.coach_settings for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach settings owner can insert"
on public.coach_settings for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach settings owner can update"
on public.coach_settings for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach settings owner can delete"
on public.coach_settings for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach threads owner can read" on public.coach_threads;
drop policy if exists "Coach threads owner can insert" on public.coach_threads;
drop policy if exists "Coach threads owner can update" on public.coach_threads;
drop policy if exists "Coach threads owner can delete" on public.coach_threads;

create policy "Coach threads owner can read"
on public.coach_threads for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach threads owner can insert"
on public.coach_threads for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach threads owner can update"
on public.coach_threads for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach threads owner can delete"
on public.coach_threads for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach messages owner can read" on public.coach_messages;
drop policy if exists "Coach members can insert their own user messages" on public.coach_messages;

create policy "Coach messages owner can read"
on public.coach_messages for select
to authenticated
using (
  auth.uid() = user_id and exists (
    select 1 from public.coach_threads t
    where t.id = thread_id and t.user_id = auth.uid()
  )
);

create policy "Coach members can insert their own user messages"
on public.coach_messages for insert
to authenticated
with check (
  auth.uid() = user_id and role = 'user' and exists (
    select 1 from public.coach_threads t
    where t.id = thread_id and t.user_id = auth.uid()
  )
);

drop policy if exists "Coach memory owner can read" on public.coach_memory_items;
drop policy if exists "Coach memory owner can insert" on public.coach_memory_items;
drop policy if exists "Coach memory owner can update" on public.coach_memory_items;
drop policy if exists "Coach memory owner can delete" on public.coach_memory_items;

create policy "Coach memory owner can read"
on public.coach_memory_items for select
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

create policy "Coach memory owner can insert"
on public.coach_memory_items for insert
to authenticated
with check (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

create policy "Coach memory owner can update"
on public.coach_memory_items for update
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
)
with check (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

create policy "Coach memory owner can delete"
on public.coach_memory_items for delete
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

drop policy if exists "Coach exclusions owner can read" on public.coach_data_exclusions;
drop policy if exists "Coach exclusions owner can insert" on public.coach_data_exclusions;
drop policy if exists "Coach exclusions owner can update" on public.coach_data_exclusions;
drop policy if exists "Coach exclusions owner can delete" on public.coach_data_exclusions;

create policy "Coach exclusions owner can read"
on public.coach_data_exclusions for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach exclusions owner can insert"
on public.coach_data_exclusions for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach exclusions owner can update"
on public.coach_data_exclusions for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach exclusions owner can delete"
on public.coach_data_exclusions for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach triggers owner can read" on public.coach_trigger_states;
drop policy if exists "Coach triggers owner can insert" on public.coach_trigger_states;
drop policy if exists "Coach triggers owner can update" on public.coach_trigger_states;
drop policy if exists "Coach triggers owner can delete" on public.coach_trigger_states;

create policy "Coach triggers owner can read"
on public.coach_trigger_states for select
to authenticated
using (auth.uid() = user_id);

create policy "Coach triggers owner can insert"
on public.coach_trigger_states for insert
to authenticated
with check (auth.uid() = user_id);

create policy "Coach triggers owner can update"
on public.coach_trigger_states for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Coach triggers owner can delete"
on public.coach_trigger_states for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Coach audits owner can read" on public.coach_audit_events;

create policy "Coach audits owner can read"
on public.coach_audit_events for select
to authenticated
using (
  auth.uid() = user_id and (
    thread_id is null or exists (
      select 1 from public.coach_threads t
      where t.id = thread_id and t.user_id = auth.uid()
    )
  )
);

drop policy if exists "Coach approved registry can be read" on public.coach_source_registry;

create policy "Coach approved registry can be read"
on public.coach_source_registry for select
to authenticated
using (status = 'approved');

revoke all on public.coach_settings,
  public.coach_threads,public.coach_messages,
  public.coach_memory_items,public.coach_data_exclusions,
  public.coach_trigger_states,public.coach_audit_events,
  public.coach_source_registry,public.coach_source_versions
from anon,authenticated;

grant select,insert,update,delete on public.coach_settings,
  public.coach_threads,public.coach_memory_items,
  public.coach_data_exclusions,public.coach_trigger_states to authenticated;

grant select on public.coach_messages,public.coach_audit_events,
  public.coach_source_registry to authenticated;

grant insert on public.coach_messages to authenticated;

revoke all on public.coach_source_versions from anon,authenticated;
