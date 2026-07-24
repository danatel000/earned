import { createClient } from "@supabase/supabase-js";

const supabaseUrl = "https://lwgmpinnuzqzyrymkrfj.supabase.co";
const supabaseAnonKey = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx3Z21waW5udXpxenlyeW1rcmZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODMwMjE5MTgsImV4cCI6MjA5ODU5NzkxOH0.3scDzekOkWgx9xwBROh-7_xUyEs_KeKeFnQSYGwDpRA";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
