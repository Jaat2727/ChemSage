const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role for admin rights
const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestUsers() {
  console.log("Adding 5 test requests...");
  
  for (let i = 1; i <= 5; i++) {
    const rollNo = `CY${25 - Math.floor(Math.random()*4)}B${Math.floor(100 + Math.random()*899)}`;
    const email = `test_student${Date.now()}_${i}@smail.iitm.ac.in`;
    const password = 'password123';
    const name = `Test Applicant ${i}`;
    
    // 1. Create user using admin API (bypasses rate limits)
    const { data: authData, error: signUpError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true // auto-confirm
    });
    
    if (signUpError) {
      console.error(`Error creating test user ${i}:`, signUpError.message);
      continue;
    }
    
    const userId = authData.user.id;
    
    // 2. Insert into profiles with pending status
    const { error: profileError } = await supabase.from('profiles').insert({
      id: userId,
      roll_no: rollNo,
      name: name,
      programme: 'BS',
      batch_year: 2025,
      status: 'pending',
      role: 'student'
    });
    
    if (profileError) {
      console.error(`Error creating profile for test user ${i}:`, profileError.message);
      continue;
    }
    
    // 3. Add to admin notifications
    try {
      await supabase.from("admin_notifications").insert({
        type: "new_signup",
        message: `New signup: ${name} (${rollNo})`,
        related_user_id: userId,
      });
    } catch {}
    
    console.log(`Successfully added test user ${i}: ${name} (${email})`);
  }
  
  console.log("Done.");
}

addTestUsers();
