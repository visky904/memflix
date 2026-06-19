// ── Supabase setup (used for file storage only) ─────────────────────
// 1. Create a free project at https://supabase.com (no card required).
// 2. Go to Storage → create a new bucket, e.g. named "memflix" → set it PUBLIC.
// 3. Go to Project Settings → API → copy your Project URL and anon/public key below.
// 4. Run `npm install @supabase/supabase-js` in your project before deploying.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = "https://psqjxkcinmosnwxzbwsd.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBzcWp4a2Npbm1vc253eHpid3NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE4OTQyMDQsImV4cCI6MjA5NzQ3MDIwNH0.jFUX2EPDcVfcexMfVkuYPZ3u_d-SoKQREiNLf_iDM5w";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Name of the public bucket you created in step 2 above
export const BUCKET = "memflix";