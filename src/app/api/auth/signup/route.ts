import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const body = await request.json();
    const { email, password, name, rollNo, programme, batch_year } = body;

    if (!email.endsWith('@smail.iitm.ac.in')) {
      return NextResponse.json({ error: "Only @smail.iitm.ac.in emails are allowed." }, { status: 403 });
    }

    // 0. Check if roll number is in registered list
    const { data: registered, error: rollError } = await supabaseAdmin
      .from('registered_rollnos')
      .select('name, programme, batch_year')
      .eq('roll_no', rollNo)
      .single();
      
    // Determine status based on whitelist
    const isApproved = !rollError && registered;
    const initialStatus = isApproved ? 'active' : 'pending';

    // Use registered data if available to ensure integrity, otherwise use user input
    const finalName = isApproved ? registered.name : name;
    const finalProgramme = isApproved ? registered.programme : programme;
    const finalBatchYear = isApproved ? registered.batch_year : batch_year;

    // 1. Create user using admin API
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: false, // Require email verification link
      user_metadata: {
        name: finalName,
        rollNo,
        programme: finalProgramme,
        batch_year: finalBatchYear
      }
    });

    let userId = authData?.user?.id;

    // Handle orphan user auto-repair
    if (signUpError && signUpError.message.toLowerCase().includes("already been registered")) {
      const { data: listUsers, error: listError } = await supabaseAdmin.auth.admin.listUsers();
      if (!listError && listUsers) {
        const existingUser = listUsers.users.find(u => u.email === email);
        if (existingUser) {
          userId = existingUser.id;
          
          // Check if profile exists
          const { data: profile } = await supabaseAdmin.from('profiles').select('id').eq('id', userId).single();
          if (!profile) {
            // Recreate profile
            const meta = existingUser.user_metadata || {};
            const rName = meta.name || finalName;
            const rRoll = meta.rollNo || rollNo;
            const rProg = meta.programme || finalProgramme;
            const rBatch = meta.batch_year || finalBatchYear;
            
            await supabaseAdmin.from('profiles').insert({
              id: userId,
              roll_no: rRoll,
              name: rName,
              programme: rProg,
              batch_year: parseInt(rBatch as string) || 2024,
              status: initialStatus, 
              role: 'student',
              email: email
            });

            // Log auto repair event
            await supabaseAdmin.from('admin_audit_logs').insert({
              action_type: 'User Repair (System Auto-Repair)',
              target_type: 'Profile',
              target_id: userId,
              details: { roll_no: rRoll, reason: "Orphaned profile reconstructed on signup" }
            });

            return NextResponse.json({ success: true, userId, message: "Account recovered. Please check your email to verify if needed, or simply log in." });
          }
        }
      }
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    } else if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    if (!userId) {
       return NextResponse.json({ error: "Failed to create user" }, { status: 400 });
    }

    // 2. Insert into profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      roll_no: rollNo,
      name: finalName,
      programme: finalProgramme,
      batch_year: finalBatchYear,
      status: initialStatus,
      role: 'student',
      email: email
    });

    if (profileError) {
      // Rollback user creation if profile creation fails
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error(`[CRITICAL] Failed to rollback user creation for ${email}. Error:`, deleteError);
      }
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Log event and Notify if pending
    if (initialStatus === 'active') {
       await supabaseAdmin.from('admin_audit_logs').insert({
          action_type: 'Signup (Auto-Approved)',
          target_type: 'Profile',
          target_id: userId,
          details: { roll_no: rollNo, email: email }
       });
    } else {
       await supabaseAdmin.from('admin_audit_logs').insert({
          action_type: 'Signup (Pending)',
          target_type: 'Profile',
          target_id: userId,
          details: { roll_no: rollNo, email: email }
       });

       try {
         const { data: admins } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
         if (admins && admins.length > 0) {
           const notifications = admins.map(admin => ({
             user_id: admin.id,
             title: "New Student Signup",
             type: 'Admin',
             message: `New signup request pending approval: ${finalName} (${rollNo})`,
           }));
           await supabaseAdmin.from('notifications').insert(notifications);
         }
       } catch {}
    }

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
