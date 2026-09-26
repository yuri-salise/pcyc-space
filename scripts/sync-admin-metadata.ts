import { createClient } from '@supabase/supabase-js';

async function syncAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  const supabaseAdmin = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: { users }, error } = await supabaseAdmin.auth.admin.listUsers();
  if (error) {
    console.error('Error listing users:', error);
    return;
  }

  const adminUser = users.find((u) => u.email === 'admin@pcyc.ph');
  if (adminUser) {
    console.log('Found admin user:', adminUser.id);
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(
      adminUser.id,
      {
        user_metadata: {
          ...adminUser.user_metadata,
          role: 'SUPERADMIN',
        },
        app_metadata: {
          ...adminUser.app_metadata,
          role: 'SUPERADMIN',
        },
      }
    );

    if (updateErr) {
      console.error('Failed to update admin metadata:', updateErr);
    } else {
      console.log('✅ Admin user metadata updated with role: SUPERADMIN');
    }
  }
}

syncAdmin().catch(console.error);
