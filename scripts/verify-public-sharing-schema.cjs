const fs = require("fs");
const path = require("path");

const sqlPath = path.join(__dirname, "..", "supabase.sql");
const sql = fs.readFileSync(sqlPath, "utf8").toLowerCase();

const required = [
  "create table if not exists public.public_profiles",
  "create table if not exists public.public_workout_posts",
  "create table if not exists public.public_post_likes",
  "create table if not exists public.public_follows",
  "create table if not exists public.public_post_comments",
  "create table if not exists public.public_post_reactions",
  "create table if not exists public.public_notifications",
  "alter table public.public_profiles enable row level security",
  "alter table public.public_workout_posts enable row level security",
  "alter table public.public_post_likes enable row level security",
  "alter table public.public_follows enable row level security",
  "alter table public.public_post_comments enable row level security",
  "alter table public.public_post_reactions enable row level security",
  "alter table public.public_notifications enable row level security",
  "public_follows_no_self_follow",
  "public_follows_follower_idx",
  "public_follows_following_idx",
  "public_post_comments_body_length",
  "public_post_reactions_allowed_reaction",
  "public_notifications_allowed_type",
  "profiles can read shared profiles",
  "profiles owner can upsert own profile",
  "posts can read shared workout summaries",
  "posts owner can upsert own workout summaries",
  "likes can read shared post likes",
  "likes owner can create own likes",
  "likes owner can delete own likes",
  "follows can read public follows",
  "follows owner can create own follows",
  "follows owner can delete own follows",
  "comments can read public post comments",
  "comments owner can create own comments",
  "comments owner can update own comments",
  "comments owner can delete own comments",
  "reactions can read public post reactions",
  "reactions owner can upsert own reactions",
  "reactions owner can update own reactions",
  "reactions owner can delete own reactions",
  "notifications owner can read own notifications",
  "notifications actor can create notifications",
  "notifications owner can update own notifications",
  "notifications owner can delete own notifications",
];

const missing = required.filter(fragment => !sql.includes(fragment));

if (missing.length) {
  console.error("Missing public sharing schema fragments:");
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log("Public sharing schema fragments verified.");
