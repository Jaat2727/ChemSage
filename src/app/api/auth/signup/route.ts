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

    // 0. Verify roll number is registered before allowing signup
    const { data: registered, error: rollError } = await supabaseAdmin
      .from('registered_rollnos')
      .select('name, programme, batch_year')
      .eq('roll_no', rollNo)
      .single();
      
    if (rollError) {
      return NextResponse.json({ error: "This roll number is not registered for ChemSAGE. Contact an admin." }, { status: 403 });
    }

    // Use registered data to ensure integrity
    const finalName = registered.name || name;
    const finalProgramme = registered.programme || programme;
    const finalBatchYear = registered.batch_year || batch_year;

    // 1. Create user using admin API (bypasses rate limits and email verification)
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // This skips sending confirmation email
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    const userId = authData.user.id;

    // 2. Insert into profiles with pending status
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      roll_no: rollNo,
      name: finalName,
      programme: finalProgramme,
      batch_year: finalBatchYear,
      status: 'pending',
      role: 'student'
    });

    if (profileError) {
      // Rollback user creation if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Add admin notification
    try {
      const { data: admins } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('role', 'admin');
        
      if (admins && admins.length > 0) {
        const notifications = admins.map(admin => ({
          user_id: admin.id,
          title: "New Student Signup",
          type: 'Admin',
          message: `New signup request pending approval: ${name} (${rollNo})`,
        }));
        await supabaseAdmin.from('notifications').insert(notifications);
      }
    } catch {}

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
