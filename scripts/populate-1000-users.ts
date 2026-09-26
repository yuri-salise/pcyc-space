import postgres from 'postgres';
import crypto from 'crypto';

const databaseUrl = process.env.DATABASE_URL || process.env.DIRECT_URL;
if (!databaseUrl) {
  console.error('❌ Missing DATABASE_URL / DIRECT_URL in environment.');
  process.exit(1);
}

const sql = postgres(databaseUrl, { prepare: false });

// Realistic Filipino First Names
const maleFirstNames = [
  'Joshua', 'Caleb', 'Daniel', 'David', 'Samuel', 'Timothy', 'Jonathan', 'Nathan',
  'Benjamin', 'Matthew', 'Mark', 'Luke', 'John', 'Aaron', 'Isaiah', 'Emmanuel',
  'Joseph', 'Michael', 'Gabriel', 'Elijah', 'Stephen', 'Paul', 'Silas', 'Philip',
  'Titus', 'Andrew', 'Jesse', 'Josiah', 'Gideon', 'Ezekiel', 'Joel', 'Noah',
  'Christian', 'Angelo', 'Rafael', 'Jericho', 'Ephraim', 'Levi', 'Seth', 'Micah',
  'Jethro', 'Adrian', 'Kenneth', 'Justin', 'Bryan', 'Mark Anthony', 'John Paul',
  'Dominic', 'Vincent', 'Francis', 'Patrick', 'Alden', 'Kyle', 'Ian', 'Jerome'
];

const femaleFirstNames = [
  'Hannah', 'Sarah', 'Rebecca', 'Rachel', 'Leah', 'Miriam', 'Deborah', 'Ruth',
  'Esther', 'Abigail', 'Mary', 'Martha', 'Lydia', 'Dorcas', 'Phoebe', 'Priscilla',
  'Tabitha', 'Naomi', 'Chloe', 'Joanna', 'Lois', 'Eunice', 'Faith', 'Grace',
  'Joy', 'Hope', 'Angelica', 'Bea', 'Camille', 'Danielle', 'Eunice', 'Francesca',
  'Gillian', 'Hazel', 'Irene', 'Jasmin', 'Kristine', 'Lorena', 'Mae', 'Nicole',
  'Patricia', 'Rhea', 'Sophia', 'Trina', 'Vanessa', 'Ysabel', 'Zoe', 'Maria',
  'Bernadette', 'Clarissa', 'Denise', 'Katrina', 'Mariel', 'Rochelle', 'Samantha'
];

// Realistic Filipino Middle & Last Names
const middleNames = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
  'Tomas', 'Ramos', 'Flores', 'Gonzales', 'Villanueva', 'Castro', 'Rivera', 'Corpuz',
  'Aguilar', 'Navarro', 'Morales', 'Mercado', 'Manalo', 'Salazar', 'Valenzuela',
  'Del Rosario', 'De Leon', 'San Jose', 'Magbanua', 'Alcantara', 'Aquino', 'Soriano'
];

const lastNames = [
  'Santos', 'Reyes', 'Cruz', 'Bautista', 'Ocampo', 'Garcia', 'Mendoza', 'Torres',
  'Tomas', 'Ramos', 'Flores', 'Gonzales', 'Villanueva', 'Castro', 'Rivera', 'Corpuz',
  'Aguilar', 'Navarro', 'Morales', 'Mercado', 'Manalo', 'Salazar', 'Valenzuela',
  'Del Rosario', 'De Leon', 'San Jose', 'Magbanua', 'Alcantara', 'Aquino', 'Soriano',
  'Pascual', 'Tolentino', 'Evangelista', 'Dela Cruz', 'Dela Rosa', 'Santiago',
  'Custodio', 'Villafuerte', 'Macaraeg', 'Dimatulac', 'Perez', 'Sanchez', 'Castillo',
  'Fernandez', 'Gomez', 'Hernandez', 'Diaz', 'Alvarez', 'Velasco', 'Guinto', 'Ilagan'
];

const emailDomains = [
  'gmail.com', 'yahoo.com', 'outlook.com', 'pcyc.ph', 'icloud.com', 'proton.me'
];

// Default Bcrypt Hash for dummy test users: "Password123!"
const DEFAULT_ENCRYPTED_PASSWORD =
  '$2a$10$wN9aW66JcK4Y4g/421xJ7u5K.eO8g8JpT8u3L.1N0F4o2qR9yH1uS';

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRandomDate(startYear: number, endYear: number): Date {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

function generatePhoneNumber(): string {
  const prefixes = ['917', '918', '920', '922', '995', '905', '906', '915', '927', '935', '977'];
  const prefix = getRandomItem(prefixes);
  const suffix = String(getRandomInt(1000000, 9999999));
  return `+63${prefix}${suffix}`;
}

async function populateUsers() {
  console.log('🚀 Starting population of 1,000 realistic PCYC members and administrators...\n');

  try {
    // 1. Fetch available Ecclesias from DB
    const ecclesiaRows = await sql`
      SELECT name, region, city FROM public.ecclesias ORDER BY order_index;
    `;
    const ecclesiaNames =
      ecclesiaRows.length > 0
        ? ecclesiaRows.map((e) => e.name)
        : [
            'Manila Ecclesia',
            'Quezon City Ecclesia',
            'Cebu Ecclesia',
            'Davao Ecclesia',
            'Iloilo Ecclesia',
            'Bacolod Ecclesia',
            'Baguio Ecclesia',
            'Batangas Ecclesia',
            'Laguna Ecclesia',
            'Cavite Ecclesia',
          ];

    console.log(`📍 Found ${ecclesiaNames.length} verified Philippine Ecclesias.`);

    // 2. Check current profile count
    const [{ count: initialCount }] = await sql`SELECT count(*)::int FROM public.profiles;`;
    console.log(`📊 Current user profile count in DB: ${initialCount}`);

    const TARGET_NEW_USERS = 1000;
    console.log(`🌱 Generating ${TARGET_NEW_USERS} unique users with realistic Christadelphian profiles...`);

    const authUsersToInsert: any[] = [];
    const profilesToInsert: any[] = [];
    const usedEmails = new Set<string>();

    // Load existing emails to avoid collisions
    const existingEmails = await sql`SELECT email FROM public.profiles;`;
    existingEmails.forEach((row) => usedEmails.add(row.email.toLowerCase()));

    for (let i = 1; i <= TARGET_NEW_USERS; i++) {
      const isMale = Math.random() < 0.5;
      const firstName = isMale ? getRandomItem(maleFirstNames) : getRandomItem(femaleFirstNames);
      const middleName = getRandomItem(middleNames);
      const lastName = getRandomItem(lastNames);

      // Determine designation: 45% Brother, 45% Sister, 10% Friend
      let designation: 'BROTHER' | 'SISTER' | 'FRIEND';
      const randDesig = Math.random();
      if (randDesig < 0.45) {
        designation = isMale ? 'BROTHER' : 'SISTER';
      } else if (randDesig < 0.90) {
        designation = isMale ? 'BROTHER' : 'SISTER';
      } else {
        designation = 'FRIEND';
      }

      // Baptism date (only for Brothers & Sisters)
      const baptismDate =
        designation !== 'FRIEND'
          ? getRandomDate(2008, 2025).toISOString().split('T')[0]
          : null;

      // Determine role: 98% MEMBER, 1.5% ADMIN, 0.5% SUPERADMIN
      let role: 'MEMBER' | 'ADMIN' | 'SUPERADMIN' = 'MEMBER';
      if (designation !== 'FRIEND') {
        const randRole = Math.random();
        if (randRole < 0.005) {
          role = 'SUPERADMIN';
        } else if (randRole < 0.02) {
          role = 'ADMIN';
        }
      }

      // Status: 97.5% ACTIVE, 1.5% SUSPENDED, 1% ANONYMIZED
      let status: 'ACTIVE' | 'SUSPENDED' | 'ANONYMIZED' = 'ACTIVE';
      let isAnonymized = false;
      const randStatus = Math.random();
      if (randStatus < 0.01) {
        status = 'ANONYMIZED';
        isAnonymized = true;
      } else if (randStatus < 0.025) {
        status = 'SUSPENDED';
      }

      const ecclesia = getRandomItem(ecclesiaNames);
      const phoneNumber = generatePhoneNumber();

      // Generate unique email
      const emailClean = `${firstName.toLowerCase().replace(/\s+/g, '.')}.${lastName.toLowerCase().replace(/\s+/g, '')}`;
      let candidateEmail = `${emailClean}${getRandomInt(10, 999)}@${getRandomItem(emailDomains)}`;
      let attempts = 0;
      while (usedEmails.has(candidateEmail.toLowerCase()) && attempts < 20) {
        candidateEmail = `${emailClean}${getRandomInt(1000, 99999)}@${getRandomItem(emailDomains)}`;
        attempts++;
      }
      usedEmails.add(candidateEmail.toLowerCase());

      const userId = crypto.randomUUID();
      const createdAt = getRandomDate(2023, 2026);
      const updatedAt = new Date(createdAt.getTime() + getRandomInt(1000, 86400000));
      const lastActiveAt =
        Math.random() < 0.8
          ? new Date(Date.now() - getRandomInt(0, 30 * 24 * 60 * 60 * 1000))
          : null;

      // auth.users row
      authUsersToInsert.push({
        id: userId,
        email: candidateEmail,
        encrypted_password: DEFAULT_ENCRYPTED_PASSWORD,
        email_confirmed_at: createdAt,
        created_at: createdAt,
        updatedAt: updatedAt,
        aud: 'authenticated',
        role: 'authenticated',
        raw_app_meta_data: JSON.stringify({ provider: 'email', providers: ['email'] }),
        raw_user_meta_data: JSON.stringify({
          firstName: isAnonymized ? 'Anonymized' : firstName,
          lastName: isAnonymized ? 'User' : lastName,
          role,
          designation,
          ecclesia,
        }),
      });

      // public.profiles row
      profilesToInsert.push({
        id: userId,
        email: candidateEmail,
        firstName: isAnonymized ? 'Anonymized' : firstName,
        middleName: isAnonymized ? null : middleName,
        lastName: isAnonymized ? 'User' : lastName,
        designation,
        baptismDate,
        ecclesia,
        phoneNumber: isAnonymized ? null : phoneNumber,
        avatarUrl: null,
        role,
        status,
        isAnonymized,
        lastActiveAt,
        createdAt,
        updatedAt,
      });
    }

    console.log(`💾 Inserting ${authUsersToInsert.length} users into auth.users in batches of 100...`);
    const BATCH_SIZE = 100;

    for (let i = 0; i < authUsersToInsert.length; i += BATCH_SIZE) {
      const authBatch = authUsersToInsert.slice(i, i + BATCH_SIZE);
      const profilesBatch = profilesToInsert.slice(i, i + BATCH_SIZE);

      // 1. Insert into auth.users
      for (const u of authBatch) {
        await sql`
          INSERT INTO auth.users (
            id, email, encrypted_password, email_confirmed_at, 
            created_at, updated_at, aud, role, 
            raw_app_meta_data, raw_user_meta_data
          ) VALUES (
            ${u.id}, ${u.email}, ${u.encrypted_password}, ${u.email_confirmed_at},
            ${u.created_at}, ${u.updatedAt}, ${u.aud}, ${u.role},
            ${u.raw_app_meta_data}::jsonb, ${u.raw_user_meta_data}::jsonb
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }

      // 2. Insert into public.profiles
      for (const p of profilesBatch) {
        await sql`
          INSERT INTO public.profiles (
            id, email, first_name, middle_name, last_name,
            designation, baptism_date, ecclesia, phone_number,
            avatar_url, role, status, is_anonymized,
            last_active_at, created_at, updated_at
          ) VALUES (
            ${p.id}, ${p.email}, ${p.firstName}, ${p.middleName}, ${p.lastName},
            ${p.designation}, ${p.baptismDate}, ${p.ecclesia}, ${p.phoneNumber},
            ${p.avatarUrl}, ${p.role}, ${p.status}, ${p.isAnonymized},
            ${p.lastActiveAt}, ${p.createdAt}, ${p.updatedAt}
          ) ON CONFLICT (id) DO NOTHING;
        `;
      }

      console.log(`  ✅ Batch ${Math.floor(i / BATCH_SIZE) + 1} / ${Math.ceil(authUsersToInsert.length / BATCH_SIZE)} committed (${Math.min(i + BATCH_SIZE, authUsersToInsert.length)} users).`);
    }

    // 3. Final Verification
    const [{ count: finalCount }] = await sql`SELECT count(*)::int FROM public.profiles;`;
    const [{ count: brotherCount }] = await sql`SELECT count(*)::int FROM public.profiles WHERE designation = 'BROTHER';`;
    const [{ count: sisterCount }] = await sql`SELECT count(*)::int FROM public.profiles WHERE designation = 'SISTER';`;
    const [{ count: friendCount }] = await sql`SELECT count(*)::int FROM public.profiles WHERE designation = 'FRIEND';`;
    const [{ count: adminCount }] = await sql`SELECT count(*)::int FROM public.profiles WHERE role IN ('ADMIN', 'SUPERADMIN');`;

    console.log('\n🎉 Population Completed Successfully!');
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
    console.log(`👥 Total User Profiles in Database: ${finalCount}`);
    console.log(`   • Brothers:     ${brotherCount}`);
    console.log(`   • Sisters:      ${sisterCount}`);
    console.log(`   • Friends:      ${friendCount}`);
    console.log(`   • Admin/Staff:  ${adminCount}`);
    console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`);

    await sql.end();
  } catch (error: any) {
    console.error('❌ Failed during user population:', error);
    await sql.end();
    process.exit(1);
  }
}

populateUsers();
