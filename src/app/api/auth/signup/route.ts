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

    // Check if roll number exists in registered_rollnos for auto-activation
    const { data: isRegistered } = await supabaseAdmin
      .from("registered_rollnos")
      .select("roll_no")
      .eq("roll_no", rollNo)
      .maybeSingle();

    const status = isRegistered ? "active" : "pending";

    // 2. Insert into profiles
    const { error: profileError } = await supabaseAdmin.from('profiles').insert({
      id: userId,
      roll_no: rollNo,
      name: name,
      programme: programme,
      batch_year: batch_year,
      status: status,
      role: 'student'
    });

    if (profileError) {
      // Rollback user creation if profile creation fails
      await supabaseAdmin.auth.admin.deleteUser(userId);
      return NextResponse.json({ error: profileError.message }, { status: 400 });
    }

    // 3. Add admin notification
    try {
      await supabaseAdmin.from("admin_notifications").insert({
        type: "new_signup",
        message: `New signup: ${name} (${rollNo})`,
        related_user_id: userId,
      });
    } catch {}

    return NextResponse.json({ success: true, userId });
  } catch (err) {
    const error = err as Error;
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
