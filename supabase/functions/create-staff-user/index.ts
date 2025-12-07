import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Create admin client with service role key
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { email, password, full_name, phone, designation, branch_id, role } = await req.json();

    console.log('Creating staff user:', { email, full_name, role });

    // Validate required fields
    if (!email || !password || !full_name) {
      return new Response(
        JSON.stringify({ error: 'Email, password, and full name are required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create user using admin API (doesn't affect current session)
    const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        full_name,
      },
    });

    if (createError) {
      console.error('Error creating user:', createError);
      return new Response(
        JSON.stringify({ error: createError.message }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('User created:', userData.user?.id);

    // Wait for trigger to create staff profile
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Update staff profile with additional info
    if (phone || designation || branch_id) {
      const { error: updateError } = await supabaseAdmin
        .from('staff_profiles')
        .update({
          phone: phone || null,
          designation: designation || null,
          branch_id: branch_id === 'none' ? null : branch_id || null,
        })
        .eq('user_id', userData.user!.id);

      if (updateError) {
        console.error('Error updating profile:', updateError);
      }
    }

    // Assign role if provided
    if (role) {
      const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
        user_id: userData.user!.id,
        role: role,
      });

      if (roleError) {
        console.error('Error assigning role:', roleError);
      }
    }

    console.log('Staff user created successfully');

    return new Response(
      JSON.stringify({ success: true, user_id: userData.user?.id }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    console.error('Unexpected error:', error);
    const message = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
