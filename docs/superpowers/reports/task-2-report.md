# Task 2 Recovery Report

## Status

DONE

Task 2 implementation is complete by source audit, security audit, local migration
application, and live pgTAP verification.

## Files Changed During Recovery

- Created `docs/superpowers/reports/task-2-report.md`.
- No Task 2 implementation files were changed during recovery.

## Recovered Pre-Task Evidence

This is recovered filesystem evidence, not a personally observed original RED run.

The read-only pre-task snapshot at
`C:\Users\danat\.codex\visualizations\2026\07\27\019fa1fc-b471-7033-be73-5548ef7de505\sdd-snapshots\2026-07-27-earned-nvidia-coach-release-1\task-2-baseline`
contains:

```text
supabase.sql                                                    16105 bytes
scripts\verify-earned-coach-schema.cjs                              0 bytes
supabase\config.toml                                                0 bytes
supabase\migrations\202607270001_earned_coach_release_1.sql         0 bytes
supabase\tests\coach_rls.sql                                        0 bytes
```

Source comparison produced:

```text
BaselineHasCoach                 : False
CurrentStartsWithBaseline        : True
CoachStartIndex                  : 16106
BaselineNormalizedLength         : 16105
PrefixBeforeCoachMatchesBaseline : True
CoachSuffixMatchesMigration      : True
CurrentLength                    : 28942
MigrationLength                  : 12836
```

This proves the Coach schema was absent before Task 2, the unrelated baseline
content in `supabase.sql` remains intact, and the current appended Coach schema
matches the migration after line-ending normalization.

## New RED Evidence

None. No implementation defect was found during recovery, so no test was changed
and no new RED-to-GREEN repair cycle was required.

## Source Audit

The recovered implementation satisfies the brief:

- All nine required Coach tables use the specified keys, foreign keys, defaults,
  checks, and delete behavior.
- All nine tables have row-level security enabled.
- The four required indexes are present.
- Settings, threads, memory, exclusions, and trigger state have authenticated
  owner-only select, insert, update, and delete policies.
- Messages require both row ownership and ownership of the referenced thread for
  reads and inserts; authenticated inserts additionally require `role = 'user'`.
- Memory items with a thread require ownership of that thread for all member CRUD
  operations.
- Audit reads require row ownership and, when present, ownership of the referenced
  thread. No authenticated audit-write policy or grant exists.
- Source-registry reads are restricted to `status = 'approved'`.
- Source-version rows have no authenticated policy and all privileges are revoked
  from `anon` and `authenticated`.
- `supabase/tests/coach_rls.sql` creates users A and B, sets the authenticated JWT
  subject, and defines 17 pgTAP assertions covering own/cross-user thread access,
  child ownership, user-only message insertion, audit-write denial, approved-only
  registry reads, and raw source-content denial.

## GREEN Verification

System `node` was not present, so the bundled runtime was used:

```powershell
& 'C:\Users\danat\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' scripts\verify-earned-coach-schema.cjs
```

Exact result:

```text
Exit code: 0
Output:
```

The verifier emitted no stdout or stderr.

## Live Supabase and RLS Verification

Live database and RLS acceptance completed against local Supabase:

```text
Docker Desktop server: 29.6.1
Local Supabase mode: database only; all optional services excluded
Migration: 202607270001_earned_coach_release_1.sql
Migration execution: psql with ON_ERROR_STOP
Confirmed relations: coach_threads, coach_messages
RLS test: supabase/tests/coach_rls.sql
RLS test execution: direct against local Supabase Postgres
Exit code: 0
pgTAP plan: 1..17
pgTAP assertions: ok 1 through ok 17
Completion: finish(0)
Cleanup: rollback
```

The migration applied without a psql error, both representative Coach relations
were present, and all 17 pgTAP assertions passed. Full optional Supabase service
health remained environment-limited, but those services are not part of Task 2
database/RLS acceptance.

## Security Self-Review

### Grants

Authenticated members receive CRUD only on settings, threads, memory items, data
exclusions, and trigger states; select plus insert on messages; and select only on
audits and source registry. The migration first revokes all Coach-table privileges
from `anon` and `authenticated`, then applies this narrow grant set. There is no
authenticated grant for audit writes, message updates/deletes, registry writes, or
any source-version operation.

### Policies

Owner checks use `auth.uid() = user_id`. Update policies include both `using` and
`with check`, preventing ownership transfer. Assistant-message inserts are rejected
by `role = 'user'`, and no authenticated policies exist for audit writes,
source-registry writes, or source-version access.

### Child Ownership

Messages, thread-bound memory items, and thread-bound audit events join their
`thread_id` to `coach_threads.id` and require the thread owner to equal
`auth.uid()`. This prevents a caller from attaching or reading an owned child row
through another user's thread.

### Source Content Access

Authenticated users can select only approved metadata rows from
`coach_source_registry`. Raw `content` exists only in `coach_source_versions`,
whose privileges are fully revoked from `anon` and `authenticated` and which has no
member policy. Source-version writes remain service-only.

## Concerns and Remaining Risks

- Full optional Supabase service health remains environment-limited. This does not
  affect the completed database migration and RLS acceptance.

## Commit

NO COMMIT. The workspace has no valid Git metadata, and no Git command was run.
