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

    // Validate IITM email
    if (!email.endsWith('@smail.iitm.ac.in')) {
      return NextResponse.json({ error: "Only @smail.iitm.ac.in emails are allowed." }, { status: 403 });
    }

    // 0. Check if roll number is in registered whitelist
    const { data: registered, error: rollError } = await supabaseAdmin
      .from('registered_rollnos')
      .select('name, programme, batch_year')
      .eq('roll_no', rollNo)
      .single();

    const isApproved = !rollError && registered;
    // All signups require admin approval — whitelist only used for data integrity
    const initialStatus = 'pending';

    const finalName = isApproved ? registered.name : name;
    const finalProgramme = isApproved ? registered.programme : programme;
    const finalBatchYear = isApproved ? registered.batch_year : batch_year;

    // 1. Check if user already exists in auth.users BEFORE attempting creation
    const { data: existingUsers } = await supabaseAdmin.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
      // User already exists in auth.users — check if they have a profile
      const { data: existingProfile } = await supabaseAdmin
        .from('profiles')
        .select('id, status')
        .eq('id', existingUser.id)
        .single();

      if (existingProfile) {
        // Both auth.users AND profile exist — user is already fully registered
        if (existingProfile.status === 'pending') {
          return NextResponse.json({
            error: "Your account is already created and waiting for admin approval. Please sign in instead."
          }, { status: 409 });
        }
        return NextResponse.json({
          error: "This email is already registered. Please sign in instead."
        }, { status: 409 });
      }

      // ORPHAN: auth.users exists but profile is missing — repair it
      const meta = existingUser.user_metadata || {};
      const rName = meta.name || finalName;
      const rRoll = meta.rollNo || rollNo;
      const rProg = meta.programme || finalProgramme;
      const rBatch = meta.batch_year || finalBatchYear;

      // Update password if user is re-signing up (they may have forgotten it)
      await supabaseAdmin.auth.admin.updateUserById(existingUser.id, {
        password,
        email_confirm: true,
        user_metadata: {
          name: rName,
          rollNo: rRoll,
          programme: rProg,
          batch_year: rBatch
        }
      });

      const { error: repairError } = await supabaseAdmin.from('profiles').insert({
        id: existingUser.id,
        roll_no: rRoll,
        name: rName,
        programme: rProg,
        batch_year: parseInt(String(rBatch)) || 2024,
        status: initialStatus,
        role: 'student'
      });

      if (repairError) {
        console.error('[REPAIR] Failed to recreate profile:', repairError);
        return NextResponse.json({ error: "Failed to repair account. Contact admin." }, { status: 500 });
      }

      // Log the re-signup
      try {
        await supabaseAdmin.from('admin_audit_logs').insert({
          action_type: 'Signup (Re-request after rejection)',
          target_type: 'Profile',
          target_id: existingUser.id,
          details: { roll_no: rRoll, email, reason: "User re-signed up after previous rejection or orphaned profile" }
        });

        // Notify admins about the new pending request
        const { data: admins } = await supabaseAdmin.from('profiles').select('id').eq('role', 'admin');
        if (admins && admins.length > 0) {
          const notifications = admins.map(admin => ({
            user_id: admin.id,
            title: "New Student Signup (Re-request)",
            type: 'Admin',
            message: `Re-signup request pending approval: ${rName} (${rRoll})`,
          }));
          await supabaseAdmin.from('notifications').insert(notifications);
        }
      } catch {}

      return NextResponse.json({ success: true, userId: existingUser.id });
    }

    // 2. No existing user — create fresh
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name: finalName,
        rollNo,
        programme: finalProgramme,
        batch_year: finalBatchYear
      }
    });

    if (signUpError) {
      console.error('[SIGNUP] Auth creation failed:', signUpError.message);
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 3. Create profile
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      roll_no: rollNo,
      name: finalName,
      programme: finalProgramme,
      batch_year: finalBatchYear,
      status: initialStatus,
      role: 'student'
    });

    if (profileError) {
      // Rollback: delete the auth user if profile creation fails
      const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(userId);
      if (deleteError) {
        console.error(`[CRITICAL] Orphan created: auth.users ${userId} has no profile. Rollback failed:`, deleteError);
      }
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 4. Log and notify admins
    try {
      await supabaseAdmin.from('admin_audit_logs').insert({
        action_type: 'Signup (Pending Approval)',
        target_type: 'Profile',
        target_id: userId,
        details: { roll_no: rollNo, email, in_whitelist: isApproved }
      });

      // Notify all admins about new pending signup
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

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    const error = err as Error;
    console.error('[SIGNUP] Unexpected error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
