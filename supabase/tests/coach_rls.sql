begin;

create extension if not exists pgtap with schema extensions;

select plan(17);

insert into auth.users (id, email)
values
  ('00000000-0000-0000-0000-00000000000a', 'coach-a@example.test'),
  ('00000000-0000-0000-0000-00000000000b', 'coach-b@example.test');

insert into public.coach_threads (id, user_id, mode)
values
  (
    '10000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    'planning'
  ),
  (
    '10000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000b',
    'planning'
  );

insert into public.coach_messages (id, thread_id, user_id, role, content)
values
  (
    '20000000-0000-0000-0000-00000000000a',
    '10000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    'assistant',
    'Visible to user A'
  ),
  (
    '20000000-0000-0000-0000-00000000000b',
    '10000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000a',
    'assistant',
    'Mismatched child ownership must stay hidden'
  );

insert into public.coach_memory_items (id, user_id, thread_id, kind, content)
values (
  '30000000-0000-0000-0000-00000000000b',
  '00000000-0000-0000-0000-00000000000a',
  '10000000-0000-0000-0000-00000000000b',
  'preference',
  'Mismatched memory must stay hidden'
);

insert into public.coach_audit_events (
  id,
  user_id,
  thread_id,
  request_id,
  event_type
)
values
  (
    '40000000-0000-0000-0000-00000000000a',
    '00000000-0000-0000-0000-00000000000a',
    '10000000-0000-0000-0000-00000000000a',
    '50000000-0000-0000-0000-00000000000a',
    'answer'
  ),
  (
    '40000000-0000-0000-0000-00000000000b',
    '00000000-0000-0000-0000-00000000000a',
    '10000000-0000-0000-0000-00000000000b',
    '50000000-0000-0000-0000-00000000000b',
    'answer'
  );

insert into public.coach_source_registry (
  source_id,
  title,
  canonical_url,
  trust_tier,
  license_status,
  status,
  refresh_days
)
values
  (
    'approved-source',
    'Approved source',
    'https://example.test/approved',
    1,
    'earned_authored',
    'approved',
    30
  ),
  (
    'draft-source',
    'Draft source',
    'https://example.test/draft',
    1,
    'earned_authored',
    'draft',
    30
  );

insert into public.coach_source_versions (
  source_id,
  version,
  content_hash,
  content,
  status
)
values (
  'approved-source',
  '1',
  'hash',
  'Raw source content',
  'active'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.coach_audit_events',
    'INSERT'
  ),
  'Authenticated members have no audit insert grant'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.coach_source_versions',
    'SELECT'
  ),
  'Authenticated members have no source-version select grant'
);

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-00000000000a';
set local request.jwt.claim.role = 'authenticated';

select results_eq(
  $$ select count(*)::bigint from public.coach_threads where user_id='00000000-0000-0000-0000-00000000000a' $$,
  array[1::bigint],
  'User A can read A''s thread'
);

select results_eq(
  $$ select count(*)::bigint from public.coach_threads where user_id='00000000-0000-0000-0000-00000000000b' $$,
  array[0::bigint],
  'User A cannot read B''s thread'
);

select lives_ok(
  $$ insert into public.coach_threads(user_id,mode)
     values ('00000000-0000-0000-0000-00000000000a','planning') $$,
  'User A can insert A''s thread'
);

select throws_ok(
  $$ insert into public.coach_threads(user_id,mode)
     values ('00000000-0000-0000-0000-00000000000b','planning') $$,
  '42501',
  'new row violates row-level security policy for table "coach_threads"',
  'User A cannot insert B''s thread'
);

select results_eq(
  $$ select count(*)::bigint from public.coach_messages
     where id='20000000-0000-0000-0000-00000000000a' $$,
  array[1::bigint],
  'User A can read a message in A''s thread'
);

select results_eq(
  $$ select count(*)::bigint from public.coach_messages
     where id='20000000-0000-0000-0000-00000000000b' $$,
  array[0::bigint],
  'Child thread ownership hides a mismatched message'
);

select lives_ok(
  $$ insert into public.coach_messages(thread_id,user_id,role,content)
     values (
       '10000000-0000-0000-0000-00000000000a',
       '00000000-0000-0000-0000-00000000000a',
       'user',
       'Member-authored message'
     ) $$,
  'User A can insert a user message in A''s thread'
);

select throws_ok(
  $$ insert into public.coach_messages(thread_id,user_id,role,content)
     values (
       '10000000-0000-0000-0000-00000000000a',
       '00000000-0000-0000-0000-00000000000a',
       'assistant',
       'Forbidden assistant message'
     ) $$,
  '42501',
  'new row violates row-level security policy for table "coach_messages"',
  'Authenticated members cannot insert assistant messages'
);

select results_eq(
  $$ select count(*)::bigint from public.coach_memory_items
     where id='30000000-0000-0000-0000-00000000000b' $$,
  array[0::bigint],
  'Child thread ownership hides mismatched memory'
);

select throws_ok(
  $$ insert into public.coach_memory_items(user_id,thread_id,kind,content)
     values (
       '00000000-0000-0000-0000-00000000000a',
       '10000000-0000-0000-0000-00000000000b',
       'preference',
       'Forbidden cross-thread memory'
     ) $$,
  '42501',
  'new row violates row-level security policy for table "coach_memory_items"',
  'User A cannot attach memory to B''s thread'
);

select results_eq(
  $$ select count(*)::bigint from public.coach_audit_events
     where id='40000000-0000-0000-0000-00000000000a' $$,
  array[1::bigint],
  'User A can read A''s audit event'
);

select results_eq(
  $$ select count(*)::bigint from public.coach_audit_events
     where id='40000000-0000-0000-0000-00000000000b' $$,
  array[0::bigint],
  'Child thread ownership hides a mismatched audit event'
);

select throws_ok(
  $$ insert into public.coach_audit_events(user_id,request_id,event_type)
     values (
       '00000000-0000-0000-0000-00000000000a',
       gen_random_uuid(),
       'answer'
     ) $$,
  '42501',
  'permission denied for table coach_audit_events',
  'User A cannot insert an audit event'
);

select results_eq(
  $$ select source_id from public.coach_source_registry order by source_id $$,
  array['approved-source'::text],
  'Authenticated members can read only approved source registry rows'
);

select throws_ok(
  $$ select content from public.coach_source_versions $$,
  '42501',
  'permission denied for table coach_source_versions',
  'Authenticated members cannot query raw source-version content'
);

select * from finish();
rollback;
