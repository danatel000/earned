const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const sql=fs.readFileSync(path.resolve(__dirname,"..","supabase.sql"),"utf8");
const requiredTables=[
  "coach_settings","coach_threads","coach_messages","coach_memory_items",
  "coach_data_exclusions","coach_trigger_states","coach_audit_events",
  "coach_source_registry","coach_source_versions",
];
for(const table of requiredTables){
  assert.match(sql,new RegExp(`create table if not exists public\\.${table}`));
  assert.match(sql,new RegExp(`alter table public\\.${table} enable row level security`));
}
assert.match(sql,/auth\.uid\(\) = user_id/);
assert.doesNotMatch(sql,/public\.coach_audit_events for insert[\s\S]*auth\.uid\(\) = user_id/i);
