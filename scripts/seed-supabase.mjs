// Malaaby — Supabase Seed Script
// Run: node scripts/seed-supabase.mjs

const SUPABASE_URL = 'https://embnhywhpzrkwnjprtgv.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVtYm5oeXdocHpya3duanBydGd2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDQ2NzU1NCwiZXhwIjoyMTAwMDQzNTU0fQ.mLAkeGKn5Lr9rLd5hKF1DtG-qfLAlSf6GRthc5U-YsM';

const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
  'apikey': SERVICE_ROLE_KEY,
  'Prefer': 'resolution=ignore-duplicates',
};

async function insert(table, rows) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
    method: 'POST',
    headers: { ...headers, 'Prefer': 'resolution=ignore-duplicates,return=minimal' },
    body: JSON.stringify(rows),
  });
  if (!res.ok) {
    const err = await res.text();
    console.error(`❌ Failed to insert into ${table}:`, err);
  } else {
    console.log(`✅ Inserted into ${table} (${rows.length} rows)`);
  }
}

const now = new Date().toISOString();

const defaultSchedule = {
  saturday: { open: true, from: '08:00', to: '23:00' },
  sunday:   { open: true, from: '08:00', to: '23:00' },
  monday:   { open: true, from: '08:00', to: '23:00' },
  tuesday:  { open: true, from: '08:00', to: '23:00' },
  wednesday:{ open: true, from: '08:00', to: '23:00' },
  thursday: { open: true, from: '08:00', to: '23:00' },
  friday:   { open: true, from: '08:00', to: '23:00' },
};

// ── Users ────────────────────────────────────────────────
const users = [
  {
    id: 'user-admin',
    email: 'admin@malaaby.com',
    role: 'super_admin',
    data: {
      id: 'user-admin',
      name: 'مدير المنصة',
      email: 'admin@malaaby.com',
      passwordHash: 'fbef8dffdb9796ecc513bb3010230ea5d33c18f8c563955fc01f8f26ac8927d2',
      role: 'super_admin',
      isActive: true,
      createdAt: now,
    },
    created_at: now,
  },
  {
    id: 'user-maged-admin',
    email: 'magedprooo8@gmail.com',
    role: 'super_admin',
    data: {
      id: 'user-maged-admin',
      name: 'Mohamed Maged',
      email: 'magedprooo8@gmail.com',
      passwordHash: '4edd6cd33eb666dbd5b2ddb08e0367b26c8075225ddcccccad90e5c2c6ac1a8d',
      role: 'super_admin',
      phone: '01126947405',
      stadiumSlug: 'abomaged',
      isActive: true,
      createdAt: now,
    },
    created_at: now,
  },
  {
    id: 'user-owner',
    email: 'owner@malaaby.com',
    role: 'owner',
    data: {
      id: 'user-owner',
      name: 'الكابتن خليل',
      email: 'owner@malaaby.com',
      passwordHash: '9eef3ea264356cbd40af087e135c60374398e2ac72778aa9d3179034ba78693b',
      role: 'owner',
      stadiumSlug: 'khalil',
      phone: '01012345678',
      isActive: true,
      createdAt: now,
    },
    created_at: now,
  },
];

// ── Stadiums ─────────────────────────────────────────────
const stadiums = [
  {
    slug: 'khalil',
    owner_id: 'user-owner',
    data: {
      slug: 'khalil',
      ownerId: 'user-owner',
      name: 'ملاعب الغرين فيلد (الخليل)',
      description: 'مجمع رياضي متكامل بأحدث النجيلة الصناعية المعتمدة من الفيفا.',
      phone: '01012345678',
      whatsapp: '+201012345678',
      city: 'القاهرة',
      address: 'شارع التسعين الشمالي، التجمع الخامس',
      googleMapsUrl: 'https://maps.google.com',
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop',
      vodafoneCash: '01012345678',
      instaPay: 'khalil@instapay',
      paymentInstructions: 'يرجى تحويل قيمة الحجز كاملة لتأكيد الحجز، ثم رفع صورة التحويل هنا.',
      subscriptionPlanId: 'plan-pro',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      approvalStatus: 'approved',
      createdAt: now,
    },
    created_at: now,
  },
  {
    slug: 'abomaged',
    owner_id: 'user-maged-admin',
    data: {
      slug: 'abomaged',
      ownerId: 'user-maged-admin',
      name: 'ملعب ابو ماجد',
      phone: '01126947405',
      whatsapp: '01126947405',
      city: 'سوهاج',
      address: 'مركز جرجا شارع مصطفى كامل',
      logo: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop',
      coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop',
      vodafoneCash: '01008432559',
      instaPay: '01008432559',
      paymentInstructions: 'يرجى تحويل قيمة الحجز كاملة لتأكيد الحجز، ثم رفع صورة التحويل هنا.',
      subscriptionPlanId: 'plan-pro',
      subscriptionStatus: 'active',
      subscriptionExpiry: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      approvalStatus: 'approved',
      createdAt: now,
    },
    created_at: now,
  },
];

// ── Fields ───────────────────────────────────────────────
const fields = [
  {
    id: 'field-1',
    stadium_slug: 'khalil',
    data: {
      id: 'field-1',
      stadiumSlug: 'khalil',
      name: 'الملعب الرئيسي (خماسي)',
      description: 'ملعب خماسي ممتاز مغطى بنجيلة ترتان.',
      pricePerHour: 150,
      bookingDuration: 60,
      openingTime: '08:00',
      closingTime: '23:00',
      coverImage: 'https://images.unsplash.com/photo-1568194157720-8eae79728929?w=600&h=400&fit=crop',
      status: 'available',
      workingDays: defaultSchedule,
      createdAt: now,
    },
    created_at: now,
  },
  {
    id: 'field-2',
    stadium_slug: 'khalil',
    data: {
      id: 'field-2',
      stadiumSlug: 'khalil',
      name: 'الملعب الاحترافي (سباعي)',
      description: 'ملعب سباعي واسع ومفتوح للمباريات الكبيرة.',
      pricePerHour: 250,
      bookingDuration: 90,
      openingTime: '08:00',
      closingTime: '23:00',
      coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop',
      status: 'available',
      workingDays: defaultSchedule,
      createdAt: now,
    },
    created_at: now,
  },
  {
    id: 'field-3',
    stadium_slug: 'abomaged',
    data: {
      id: 'field-3',
      stadiumSlug: 'abomaged',
      name: 'الملعب الرئيسي',
      description: 'ملعب خماسي بنجيلة صناعية ممتازة.',
      pricePerHour: 100,
      bookingDuration: 60,
      openingTime: '08:00',
      closingTime: '23:00',
      coverImage: 'https://images.unsplash.com/photo-1568194157720-8eae79728929?w=600&h=400&fit=crop',
      status: 'available',
      workingDays: defaultSchedule,
      createdAt: now,
    },
    created_at: now,
  },
];

// ── Subscription Plans ───────────────────────────────────
const plans = [
  {
    id: 'plan-basic',
    data: {
      id: 'plan-basic',
      name: 'أساسي',
      nameEn: 'Basic',
      description: 'مثالي لملعب واحد',
      price: 99,
      yearlyPrice: 999,
      maxFields: 1,
      features: ['ملعب واحد', 'لوحة تحكم أساسية', 'إدارة الحجوزات', 'دعم عادي'],
      isActive: true,
      isPopular: false,
      createdAt: now,
    },
    created_at: now,
  },
  {
    id: 'plan-pro',
    data: {
      id: 'plan-pro',
      name: 'برو',
      nameEn: 'Pro',
      description: 'للملاعب المتوسطة',
      price: 199,
      yearlyPrice: 1999,
      maxFields: 5,
      features: ['حتى 5 ملاعب', 'تقارير متقدمة', 'تقويم تفاعلي', 'دعم ذو أولوية', 'إحصائيات الإيرادات'],
      isActive: true,
      isPopular: true,
      createdAt: now,
    },
    created_at: now,
  },
  {
    id: 'plan-premium',
    data: {
      id: 'plan-premium',
      name: 'بريميوم',
      nameEn: 'Premium',
      description: 'للملاعب الكبرى',
      price: 349,
      yearlyPrice: 3499,
      maxFields: -1,
      features: ['ملاعب غير محدودة', 'تقارير كاملة', 'تكاملات مستقبلية', 'دعم مخصص', 'API للتطبيقات'],
      isActive: true,
      isPopular: false,
      createdAt: now,
    },
    created_at: now,
  },
];

// ── Cities ───────────────────────────────────────────────
const cityNames = [
  'القاهرة','الجيزة','الإسكندرية','المنصورة','طنطا',
  'الزقازيق','الإسماعيلية','بورسعيد','السويس','المنيا',
  'أسيوط','سوهاج','الأقصر','أسوان','شرم الشيخ',
  'الغردقة','دمياط','الفيوم','بني سويف','قنا',
];
const cities = cityNames.map((name, i) => ({
  id: `city-${i + 1}`,
  is_active: true,
  data: { id: `city-${i + 1}`, name, isActive: true, createdAt: now },
  created_at: now,
}));

// ── Platform Settings ────────────────────────────────────
const platformSettings = [{
  id: 1,
  data: {
    platformName: 'ملعبي',
    platformNameEn: 'Malaaby',
    supportEmail: 'support@malaaby.com',
    supportWhatsApp: '+201126947405',
    ownerApprovalRequired: false,
    maintenanceMode: false,
    updatedAt: now,
  },
}];

// ── Run Seed ─────────────────────────────────────────────
console.log('🌱 Starting Malaaby Supabase Seed...\n');

await insert('users', users);
await insert('stadiums', stadiums);
await insert('fields', fields);
await insert('subscription_plans', plans);
await insert('cities', cities);
await insert('platform_settings', platformSettings);

console.log('\n🎉 Seed complete! Your Supabase database is ready.');
console.log('\n📋 Test accounts:');
console.log('   Super Admin: magedprooo8@gmail.com / 1231362002Mm');
console.log('   Owner Demo:  owner@malaaby.com / owner123');
console.log('   Public page: http://localhost:3000/abomaged');
