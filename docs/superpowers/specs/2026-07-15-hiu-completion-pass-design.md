# HIU Completion Pass Design

## Goal

Finish the remaining high-impact workout-tracking upgrades with five small, private, account-safe improvements that reduce taps, prevent accidental data loss, and keep the app usable in weak gym connectivity.

## Scope

### 1. Quick Finish

The Workout Completion Guard gains a `Skip Remaining` action when one or more active exercises still need a decision. The action marks only those unresolved exercises as skipped. It preserves their last-known weight, reps, sets, and set details so they prefill next time, while existing skipped-volume rules keep them out of the saved workout total.

### 2. Complete Set And Smart Rest

Each active set row gains an explicit `Complete Set` action. A private `Auto-start rest` toggle controls whether completing a set starts the existing rest timer with the selected preset. Completion is a draft-only marker and never changes volume math. Editing a completed set clears its completion marker so stale completion state cannot survive a changed result.

### 3. Recent Exercise History

Active Exercise Focus shows the most recent three saved performances for the selected exercise. Each row includes workout label/date, best working set, total sets, and exercise volume. Empty accounts receive a clear first-session state. This reads existing private history and does not create new stored records.

### 4. Draft Undo

The Log tab keeps one previous snapshot of the workout inputs. An `Undo Last Edit` action restores that snapshot after weight, rep, quality, skip, add-set, remove-set, quick-adjust, or copy operations. Undo applies only to the current private draft and does not alter saved history.

### 5. Installable Offline App Shell

The production app includes a web manifest and service worker. The service worker uses network-first navigation so deployed updates remain visible, and caches the successful app shell/assets for offline reopening. Supabase requests are never cached. A lightweight in-app connection indicator explains whether the user is online or working from the local draft.

## Architecture And Data Safety

- Keep the existing React/Vite architecture and account-scoped draft persistence.
- Reuse `skipped`, `setDetails`, the existing rest timer, and saved history instead of adding parallel data models.
- Store new logger preferences and set-completion markers only inside the existing private draft.
- Do not change weekly volume, PR, streak, goal, public sharing, or Supabase calculations.
- Do not require a Supabase schema update.
- Preserve backward compatibility with drafts that do not contain the new fields.

## Error Handling

- Hide or disable actions that have no valid target.
- Clamp timer and numeric values through existing helpers.
- Treat missing history and legacy set rows as empty/default values.
- Service-worker registration failure must leave the online app fully usable.
- Offline mode must never claim cloud sync succeeded; the existing draft remains local until connectivity returns.

## Verification

Each slice must pass this loop before the next begins:

1. Add a focused verifier and observe it fail for the missing behavior.
2. Implement the smallest compatible change.
3. Run the focused verifier and every existing `scripts/verify-*.cjs` check.
4. Scan touched files for mojibake.
5. Run the Vite production build.
6. Start the built preview temporarily and require an HTTP 200 response.
7. Rebuild `lift-tracker-dist.zip`.

Final verification repeats the complete suite and checks that the built package contains the manifest and service worker.
