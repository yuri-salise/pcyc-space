import { createClient } from '@supabase/supabase-js';

const REQUIRED_BUCKETS = [
  { id: 'merch', public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'] },
  { id: 'events', public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg'] },
  { id: 'receipts', public: true, fileSizeLimit: 5242880, allowedMimeTypes: ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf'] },
];

async function setupBuckets() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

  if (!supabaseUrl || !serviceKey) {
    console.error('❌ Missing Supabase URL or Service Role Key in environment.');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Connecting to Supabase Storage at: ${supabaseUrl}`);

  const { data: existingBuckets, error: listErr } = await supabase.storage.listBuckets();
  if (listErr) {
    console.error('Failed to list existing buckets:', listErr);
    process.exit(1);
  }

  const existingBucketIds = new Set(existingBuckets.map((b) => b.id));

  for (const bucket of REQUIRED_BUCKETS) {
    if (existingBucketIds.has(bucket.id)) {
      console.log(`ℹ️ Bucket "${bucket.id}" already exists.`);
      // Ensure it is public
      await supabase.storage.updateBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });
      console.log(`✅ Bucket "${bucket.id}" updated as PUBLIC.`);
    } else {
      const { error } = await supabase.storage.createBucket(bucket.id, {
        public: bucket.public,
        fileSizeLimit: bucket.fileSizeLimit,
        allowedMimeTypes: bucket.allowedMimeTypes,
      });

      if (error) {
        console.error(`❌ Failed to create bucket "${bucket.id}":`, error.message);
      } else {
        console.log(`🎉 Successfully created public bucket "${bucket.id}"!`);
      }
    }
  }

  // Verify
  const { data: finalBuckets } = await supabase.storage.listBuckets();
  console.log('\nFinal Supabase Storage Buckets:');
  finalBuckets?.forEach((b) => {
    console.log(` - Bucket: "${b.id}" (Public: ${b.public})`);
  });
}

setupBuckets().catch(console.error);
