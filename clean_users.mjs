import { createClient } from "@supabase/supabase-js";
import 'dotenv/config';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  console.log("Fetching all users...");
  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error("Error fetching users:", error);
    return;
  }

  const { data: profiles, error: profileError } = await supabaseAdmin.from('profiles').select('id');
  if (profileError) {
    console.error("Error fetching profiles:", profileError);
    return;
  }

  const profileIds = new Set(profiles.map(p => p.id));
  
  for (const user of users) {
    if (!profileIds.has(user.id)) {
      console.log(`Orphaned user found: ${user.email} (ID: ${user.id}). Deleting...`);
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);
      if (deleteError) {
        console.error(`Failed to delete ${user.email}:`, deleteError);
      } else {
        console.log(`Successfully deleted ${user.email}`);
      }
    }
  }
  console.log("Cleanup complete.");
}

run();
