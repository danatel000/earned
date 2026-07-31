# Task 2 Independent Review

### Spec Compliance

**Spec compliant.**

- All nine required tables, their specified constraints and foreign keys, the four required indexes, and RLS enablement are present in `supabase/migrations/202607270001_earned_coach_release_1.sql:1`, `:104`, and `:116`.
- Settings, threads, memory, exclusions, and trigger state have authenticated owner-only CRUD policies. Update policies use both `using` and `with check`, preventing ownership transfer (`supabase/migrations/202607270001_earned_coach_release_1.sql:131`, `:157`, `:206`, `:267`, `:293`).
- Message reads and user-message inserts verify both `user_id` ownership and referenced-thread ownership; inserts also require `role = 'user'` (`supabase/migrations/202607270001_earned_coach_release_1.sql:181`, `:191`).
- Thread-bound memory and audit rows verify both row ownership and referenced-thread ownership (`supabase/migrations/202607270001_earned_coach_release_1.sql:206`, `:316`).
- Audit access is read-only for authenticated members, approved registry metadata is selectable, and source-version access is fully revoked. The revoke-first, narrow-grant block also leaves assistant-message writes, audit writes, registry writes, and source-version operations service-only (`supabase/migrations/202607270001_earned_coach_release_1.sql:330`, `:335`, `:342`, `:346`, `:349`, `:351`).
- The pgTAP source creates two users, sets the authenticated JWT subject, and defines 17 assertions including cross-user and mismatched-child cases, assistant-message rejection, audit-write denial, approved-only registry reads, and raw source-version denial (`supabase/tests/coach_rls.sql:5`, `:7`, `:136`, `:140`, `:173`, `:238`, `:250`, `:256`).
- The baseline-to-current package shows `supabase.sql` changed only by an appended block and mirrors the migration in the supplied diff; unrelated preceding content remains unchanged (`.superpowers/sdd/2026-07-27-earned-nvidia-coach-release-1/task-2-review-package.md:12`, `:669`, `:673`, `:685`). Added source and SQL shown in the package are ASCII.

**Cannot verify from diff**

- The migration's successful application to PostgreSQL, SQL-engine acceptance, and actual RLS behavior cannot be verified statically.
- The 17 pgTAP assertions were not executed, so their pass status and exact expected error text remain unverified (`docs/superpowers/reports/task-2-report.md:94`, `:115`).
- Runtime behavior of the deployed `authenticated` and service roles, including `coach-api` reads under RLS and service-only writes, cannot be established from source alone.
- PostgREST's deployed denial of all `coach_source_versions` queries cannot be runtime-verified, although the source-level revoke and absence of an authenticated policy are correct.
- The original failing RED run is recovered from filesystem state rather than directly observed (`docs/superpowers/reports/task-2-report.md:17`). The report records a later source-verifier exit code of 0, but this review did not rerun it (`docs/superpowers/reports/task-2-report.md:77`, `:88`).

### Strengths

- The implementation uses deny-by-default privilege revocation before granting the minimum authenticated operations.
- Child-table policies defend against inconsistent `user_id` and `thread_id` combinations instead of trusting row ownership alone.
- Update policies check both the existing and proposed row, closing ownership-transfer paths.
- The tests deliberately seed mismatched child rows and exercise high-risk negative paths.
- Migration and monolithic schema definitions are mirrored while preserving unrelated baseline SQL.

### Issues

**Critical:** None.

**Important:** None.

**Minor:** None.

### Assessment

**Task quality: Approved.**

The supplied diff is spec compliant and has no static schema or RLS security findings. Approval is for source quality only; live migration, pgTAP, deployed-role, and PostgREST behavior remain explicitly unverified because the required runtime execution did not occur.

### Live Verification Addendum

The appended recovery evidence resolves the prior local-runtime `Cannot Verify` items. The migration executed against local Supabase Postgres with `psql ON_ERROR_STOP`, representative `coach_threads` and `coach_messages` relations were confirmed, and the pgTAP suite completed with exit code 0, plan `1..17`, assertions `ok 1` through `ok 17`, and `finish(0)` (`docs/superpowers/reports/task-2-report.md:102`, `:103`, `:106`, `:107`, `:108`, `:109`, `:113`). This verifies local SQL-engine acceptance and the tested RLS, grant-denial, approved-registry, and raw source-version denial behavior.

The deployed `coach-api` authenticated/service-role integration and PostgREST API-surface behavior remain unverified because the run was database-only and optional Supabase services were excluded. The original RED run also remains recovered filesystem evidence rather than a directly observed execution. These are not Task 2 source or local database/RLS defects.

**Final assessment: Approved.** Task 2 now has both compliant source evidence and successful local migration plus pgTAP 17/17 verification; only deployment-integration and historical-process evidence remain outside the verified scope.
