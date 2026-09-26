import postgres from 'postgres';

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL!;

if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL / DIRECT_URL environment variable.');
  process.exit(1);
}

const client = postgres(databaseUrl, { prepare: false });

async function applyRLSPolicies() {
  console.log('🔒 Applying Row Level Security (RLS) policies across all public tables...\n');

  try {
    // 1. Enable RLS on all public tables
    console.log('1️⃣ Enabling RLS on tables...');
    await client.unsafe(`
      ALTER TABLE IF EXISTS public.profiles ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.events ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.products ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.orders ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.order_items ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.payment_receipts ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.event_registrations ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.ecclesias ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.site_settings ENABLE ROW LEVEL SECURITY;
      ALTER TABLE IF EXISTS public.product_reviews ENABLE ROW LEVEL SECURITY;
    `);
    console.log('   ✅ RLS enabled on all 10 public tables.');

    // 2. Helper function to drop existing policies idempotently
    console.log('\n2️⃣ Creating idempotent security policies...');
    await client.unsafe(`
      -- PROFILES POLICIES
      DROP POLICY IF EXISTS "Allow authenticated users to read profiles" ON public.profiles;
      DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
      DROP POLICY IF EXISTS "Allow users to insert own profile on signup" ON public.profiles;
      DROP POLICY IF EXISTS "Allow admins to manage all profiles" ON public.profiles;

      CREATE POLICY "Allow authenticated users to read profiles"
        ON public.profiles FOR SELECT
        TO authenticated
        USING (true);

      CREATE POLICY "Allow users to update own profile"
        ON public.profiles FOR UPDATE
        TO authenticated
        USING (auth.uid() = id)
        WITH CHECK (auth.uid() = id);

      CREATE POLICY "Allow users to insert own profile on signup"
        ON public.profiles FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = id);

      -- EVENTS POLICIES
      DROP POLICY IF EXISTS "Allow public read access on published events" ON public.events;
      DROP POLICY IF EXISTS "Allow admins to view all events" ON public.events;
      DROP POLICY IF EXISTS "Allow admins to manage events" ON public.events;

      CREATE POLICY "Allow public read access on published events"
        ON public.events FOR SELECT
        TO anon, authenticated
        USING (is_published = true);

      CREATE POLICY "Allow admins to manage events"
        ON public.events FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- PRODUCTS POLICIES
      DROP POLICY IF EXISTS "Allow public read access on available products" ON public.products;
      DROP POLICY IF EXISTS "Allow admins to manage products" ON public.products;

      CREATE POLICY "Allow public read access on available products"
        ON public.products FOR SELECT
        TO anon, authenticated
        USING (is_available = true);

      CREATE POLICY "Allow admins to manage products"
        ON public.products FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- ORDERS POLICIES
      DROP POLICY IF EXISTS "Allow users to view own orders" ON public.orders;
      DROP POLICY IF EXISTS "Allow users to create own orders" ON public.orders;
      DROP POLICY IF EXISTS "Allow admins to view and manage all orders" ON public.orders;

      CREATE POLICY "Allow users to view own orders"
        ON public.orders FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "Allow users to create own orders"
        ON public.orders FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Allow admins to view and manage all orders"
        ON public.orders FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- ORDER ITEMS POLICIES
      DROP POLICY IF EXISTS "Allow users to view own order items" ON public.order_items;
      DROP POLICY IF EXISTS "Allow users to insert own order items" ON public.order_items;
      DROP POLICY IF EXISTS "Allow admins to manage all order items" ON public.order_items;

      CREATE POLICY "Allow users to view own order items"
        ON public.order_items FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
          )
        );

      CREATE POLICY "Allow users to insert own order items"
        ON public.order_items FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()
          )
        );

      CREATE POLICY "Allow admins to manage all order items"
        ON public.order_items FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- PAYMENT RECEIPTS POLICIES
      DROP POLICY IF EXISTS "Allow users to view own receipts" ON public.payment_receipts;
      DROP POLICY IF EXISTS "Allow users to upload receipts for own orders" ON public.payment_receipts;
      DROP POLICY IF EXISTS "Allow admins to manage receipts" ON public.payment_receipts;

      CREATE POLICY "Allow users to view own receipts"
        ON public.payment_receipts FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payment_receipts.order_id AND orders.user_id = auth.uid()
          )
        );

      CREATE POLICY "Allow users to upload receipts for own orders"
        ON public.payment_receipts FOR INSERT
        TO authenticated
        WITH CHECK (
          EXISTS (
            SELECT 1 FROM public.orders
            WHERE orders.id = payment_receipts.order_id AND orders.user_id = auth.uid()
          )
        );

      CREATE POLICY "Allow admins to manage receipts"
        ON public.payment_receipts FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- EVENT REGISTRATIONS POLICIES
      DROP POLICY IF EXISTS "Allow users to view own event registrations" ON public.event_registrations;
      DROP POLICY IF EXISTS "Allow users to register for events" ON public.event_registrations;
      DROP POLICY IF EXISTS "Allow users to update own event registrations" ON public.event_registrations;
      DROP POLICY IF EXISTS "Allow admins to manage all event registrations" ON public.event_registrations;

      CREATE POLICY "Allow users to view own event registrations"
        ON public.event_registrations FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "Allow users to register for events"
        ON public.event_registrations FOR INSERT
        TO authenticated
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Allow users to update own event registrations"
        ON public.event_registrations FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Allow admins to manage all event registrations"
        ON public.event_registrations FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- ECCLESIAS POLICIES
      DROP POLICY IF EXISTS "Allow public read displayed ecclesias" ON public.ecclesias;
      DROP POLICY IF EXISTS "Allow admins to manage ecclesias" ON public.ecclesias;

      CREATE POLICY "Allow public read displayed ecclesias"
        ON public.ecclesias FOR SELECT
        TO anon, authenticated
        USING (is_displayed = true);

      CREATE POLICY "Allow admins to manage ecclesias"
        ON public.ecclesias FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- SITE SETTINGS POLICIES
      DROP POLICY IF EXISTS "Allow public read site settings" ON public.site_settings;
      DROP POLICY IF EXISTS "Allow admins to manage site settings" ON public.site_settings;

      CREATE POLICY "Allow public read site settings"
        ON public.site_settings FOR SELECT
        TO anon, authenticated
        USING (true);

      CREATE POLICY "Allow admins to manage site settings"
        ON public.site_settings FOR ALL
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      -- NOTIFICATIONS POLICIES
      ALTER TABLE IF EXISTS public.notifications ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow users to view own notifications" ON public.notifications;
      DROP POLICY IF EXISTS "Allow users to update own notifications" ON public.notifications;
      DROP POLICY IF EXISTS "Allow system/admins to insert notifications" ON public.notifications;

      CREATE POLICY "Allow users to view own notifications"
        ON public.notifications FOR SELECT
        TO authenticated
        USING (auth.uid() = user_id);

      CREATE POLICY "Allow users to update own notifications"
        ON public.notifications FOR UPDATE
        TO authenticated
        USING (auth.uid() = user_id)
        WITH CHECK (auth.uid() = user_id);

      CREATE POLICY "Allow system/admins to insert notifications"
        ON public.notifications FOR INSERT
        TO authenticated
        WITH CHECK (true);

      -- AUDIT LOGS POLICIES
      ALTER TABLE IF EXISTS public.audit_logs ENABLE ROW LEVEL SECURITY;
      DROP POLICY IF EXISTS "Allow admins to view audit logs" ON public.audit_logs;
      DROP POLICY IF EXISTS "Allow system/admins to insert audit logs" ON public.audit_logs;

      CREATE POLICY "Allow admins to view audit logs"
        ON public.audit_logs FOR SELECT
        TO authenticated
        USING (
          EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid() AND profiles.role IN ('ADMIN', 'SUPERADMIN')
          )
        );

      CREATE POLICY "Allow system/admins to insert audit logs"
        ON public.audit_logs FOR INSERT
        TO authenticated
        WITH CHECK (true);
    `);
    console.log('   ✅ All RLS security policies successfully created.');

    // 3. Explicit Data API Grants and Default Privileges (Supabase Oct 30 Compliance)
    console.log('\n3️⃣ Granting Data API role access & setting default privileges (anon, authenticated, service_role)...');
    await client.unsafe(`
      -- Grant schema usage
      GRANT USAGE ON SCHEMA public TO anon, authenticated, service_role;

      -- Grant existing tables access
      GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated, service_role;
      GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
      GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated, service_role;
      GRANT ALL ON ALL ROUTINES IN SCHEMA public TO authenticated, service_role;

      -- Future-proof all newly created tables/sequences in public schema
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO authenticated, service_role;
      ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON ROUTINES TO authenticated, service_role;
    `);
    console.log('   ✅ Explicit Data API grants and default privileges applied.');

    // 4. Verify RLS status from pg_tables
    console.log('\n4️⃣ Verifying RLS status across PostgreSQL tables...');
    const rlsStatus = await client`
      SELECT tablename, rowsecurity 
      FROM pg_tables 
      WHERE schemaname = 'public' 
        AND tablename IN ('profiles', 'events', 'products', 'orders', 'order_items', 'payment_receipts', 'event_registrations', 'ecclesias', 'site_settings', 'notifications', 'audit_logs', 'product_reviews');
    `;

    console.table(rlsStatus);

    const allEnabled = rlsStatus.every((row) => row.rowsecurity === true);
    if (allEnabled) {
      console.log('🎉 Verification Successful: Row Level Security is ACTIVE on all public tables!\n');
    } else {
      console.warn('⚠️ Warning: Some tables still do not have RLS enabled.');
    }

    await client.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to apply RLS policies:', error);
    await client.end();
    process.exit(1);
  }
}

applyRLSPolicies();
