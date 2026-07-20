import fs from 'fs';
import path from 'path';
import { spawnSync } from 'child_process';
import {
  User, Stadium, Field, Booking,
  SubscriptionPlan, Notification, SupportTicket,
  ActivityLog, City, PlatformSettings, TimeSlot,
} from './types';
import { generateId, timeToMinutes } from './utils';
import { supabase } from './supabase';

const DB_PATH = path.join(process.cwd(), 'data', 'db.json');
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;

let memoryDbCache: any = null;

// ── Local/Remote JSON DB Helper functions ─────────────────────────────────────

function ensureDb(): void {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify(defaultDb(), null, 2), 'utf-8');
  }
}

function defaultDb() {
  const now = new Date().toISOString();
  const defaultSchedule = {
    saturday: { open: true, from: '08:00', to: '23:00' },
    sunday: { open: true, from: '08:00', to: '23:00' },
    monday: { open: true, from: '08:00', to: '23:00' },
    tuesday: { open: true, from: '08:00', to: '23:00' },
    wednesday: { open: true, from: '08:00', to: '23:00' },
    thursday: { open: true, from: '08:00', to: '23:00' },
    friday: { open: true, from: '08:00', to: '23:00' },
  };

  return {
    users: [
      {
        id: 'user-admin',
        name: 'مدير المنصة',
        email: 'admin@malaaby.com',
        passwordHash: 'fbef8dffdb9796ecc513bb3010230ea5d33c18f8c563955fc01f8f26ac8927d2',
        role: 'super_admin',
        isActive: true,
        createdAt: now,
      },
      {
        id: 'user-maged-admin',
        name: 'Mohamed Maged',
        email: 'magedprooo8@gmail.com',
        passwordHash: '4edd6cd33eb666dbd5b2ddb08e0367b26c8075225ddcccccad90e5c2c6ac1a8d', // Hash of 1231362002Mm
        role: 'super_admin',
        phone: '01126947405',
        stadiumSlug: 'abomaged',
        isActive: true,
        createdAt: now,
      },
      {
        id: 'user-owner',
        name: 'الكابتن خليل',
        email: 'owner@malaaby.com',
        passwordHash: '9eef3ea264356cbd40af087e135c60374398e2ac72778aa9d3179034ba78693b',
        role: 'owner',
        stadiumSlug: 'khalil',
        phone: '01012345678',
        isActive: true,
        createdAt: now,
      }
    ],
    stadiums: [
      {
        slug: 'khalil',
        ownerId: 'user-owner',
        name: 'ملاعب الغرين فيلد (الخليل)',
        description: 'مجمع رياضي متكامل بأحدث النجيلة الصناعية المعتمدة من الفيفا، متوفر إضاءة ليلية قوية ومقاعد للمشاهدين وكافتيريا متكاملة.',
        phone: '01012345678',
        whatsapp: '+201012345678',
        city: 'القاهرة',
        address: 'شارع التسعين الشمالي، التجمع الخامس، بجوار الجامعة الأمريكية',
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
      {
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
      }
    ],
    fields: [
      {
        id: 'field-1',
        stadiumSlug: 'khalil',
        name: 'الملعب الرئيسي (خماسي)',
        description: 'ملعب خماسي ممتاز مغطى بنجيلة ترتان ممتازة ومناسب للمباريات السريعة والمثيرة.',
        pricePerHour: 150,
        bookingDuration: 60,
        openingTime: '08:00',
        closingTime: '23:00',
        coverImage: 'https://images.unsplash.com/photo-1568194157720-8eae79728929?w=600&h=400&fit=crop',
        status: 'available',
        workingDays: defaultSchedule,
        createdAt: now,
      },
      {
        id: 'field-2',
        stadiumSlug: 'khalil',
        name: 'الملعب الاحترافي (سباعي)',
        description: 'ملعب سباعي واسع ومفتوح للمباريات الكبيرة مع عشب طبيعي ممتاز وكشافات ليلية ممتازة.',
        pricePerHour: 250,
        bookingDuration: 90,
        openingTime: '08:00',
        closingTime: '23:00',
        coverImage: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&h=400&fit=crop',
        status: 'available',
        workingDays: defaultSchedule,
        createdAt: now,
      }
    ],
    bookings: [],
    subscriptionPlans: [
      {
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
      {
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
      {
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
    ],
    notifications: [],
    supportTickets: [],
    activityLogs: [],
    cities: [
      'القاهرة', 'الجيزة', 'الإسكندرية', 'المنصورة', 'طنطا',
      'الزقازيق', 'الإسماعيلية', 'بورسعيد', 'السويس', 'المنيا',
      'أسيوط', 'سوهاج', 'الأقصر', 'أسوان', 'شرم الشيخ',
      'الغردقة', 'دمياط', 'الفيوم', 'بني سويف', 'قنا',
    ].map((name, i) => ({ id: `city-${i + 1}`, name, isActive: true, createdAt: now })),
    platformSettings: {
      platformName: 'ملعبي',
      platformNameEn: 'Malaaby',
      supportEmail: 'Magedprooo8@gmail.com',
      supportWhatsApp: '+201126947405',
      ownerApprovalRequired: false,
      maintenanceMode: false,
      updatedAt: now,
    },
  };
}

function readDb() {
  ensureDb();
  if (memoryDbCache) return memoryDbCache;

  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const code = `
        fetch("${REDIS_URL}/get/malaaby_db", {
          headers: { Authorization: "Bearer ${REDIS_TOKEN}" }
        })
        .then(r => r.json())
        .then(data => {
          if (data && data.result) console.log(data.result);
          else console.log("null");
        })
        .catch(err => process.exit(1));
      `;
      const result = spawnSync('node', ['-e', code], { encoding: 'utf-8' });
      if (result.status === 0 && result.stdout.trim() && result.stdout.trim() !== 'null') {
        memoryDbCache = JSON.parse(result.stdout.trim());
        return memoryDbCache;
      }
    } catch (e) {
      console.error('Remote DB read failed:', e);
    }
  }

  const raw = fs.readFileSync(DB_PATH, 'utf-8');
  memoryDbCache = JSON.parse(raw);
  return memoryDbCache;
}

function writeDb(db: any) {
  ensureDb();
  memoryDbCache = db;

  if (REDIS_URL && REDIS_TOKEN) {
    try {
      const code = `
        const fs = require('fs');
        const dbString = fs.readFileSync(0, 'utf-8');
        fetch("${REDIS_URL}/set/malaaby_db", {
          method: "POST",
          headers: { Authorization: "Bearer ${REDIS_TOKEN}" },
          body: dbString
        })
        .then(r => r.json())
        .then(data => process.exit(0))
        .catch(err => process.exit(1));
      `;
      const result = spawnSync('node', ['-e', code], {
        input: JSON.stringify(db),
        encoding: 'utf-8'
      });
      if (result.status === 0) return;
    } catch (e) {
      console.error('Remote DB write failed:', e);
    }
  }

  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
}

// ── Supabase Postgres mapping helpers ─────────────────────────────────────────

type Row<T> = { data: T };

function rows<T>(res: { data: Row<T>[] | null; error: any }): T[] {
  if (res.error) throw res.error;
  return (res.data ?? []).map((r) => r.data);
}

function one<T>(res: { data: Row<T> | null; error: any }): T | undefined {
  if (res.error) throw res.error;
  return res.data ? res.data.data : undefined;
}

// ── Users ─────────────────────────────────────────────────────────────────────

export const Users = {
  findAll: async (): Promise<User[]> => {
    if (supabase) return rows<User>(await supabase.from('users').select('data'));
    return readDb().users;
  },

  findById: async (id: string): Promise<User | undefined> => {
    if (supabase) return one<User>(await supabase.from('users').select('data').eq('id', id).maybeSingle());
    return readDb().users.find((u: any) => u.id === id);
  },

  findByEmail: async (email: string): Promise<User | undefined> => {
    if (supabase) return one<User>(await supabase.from('users').select('data').ilike('email', email).maybeSingle());
    return readDb().users.find((u: any) => u.email.toLowerCase() === email.toLowerCase());
  },

  findSuperAdmin: async (): Promise<User | undefined> => {
    if (supabase) return one<User>(await supabase.from('users').select('data').eq('role', 'super_admin').maybeSingle());
    return readDb().users.find((u: any) => u.role === 'super_admin');
  },

  create: async (user: Omit<User, 'id' | 'createdAt'>): Promise<User> => {
    const newUser: User = { ...user, id: generateId(), createdAt: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('users').insert({
        id: newUser.id, email: newUser.email, role: newUser.role,
        data: newUser, created_at: newUser.createdAt,
      });
      if (error) throw error;
    } else {
      const db = readDb();
      db.users.push(newUser);
      writeDb(db);
    }
    return newUser;
  },

  update: async (id: string, updates: Partial<User>): Promise<User | null> => {
    if (supabase) {
      const current = await Users.findById(id);
      if (!current) return null;
      const merged: User = { ...current, ...updates };
      const { error } = await supabase.from('users')
        .update({ email: merged.email, role: merged.role, data: merged })
        .eq('id', id);
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      const idx = db.users.findIndex((u: any) => u.id === id);
      if (idx === -1) return null;
      db.users[idx] = { ...db.users[idx], ...updates };
      writeDb(db);
      return db.users[idx];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (supabase) {
      const { error, count } = await supabase.from('users').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      return (count ?? 0) > 0;
    } else {
      const db = readDb();
      const idx = db.users.findIndex((u: any) => u.id === id);
      if (idx === -1) return false;
      db.users.splice(idx, 1);
      writeDb(db);
      return true;
    }
  },
};

// ── Stadiums ──────────────────────────────────────────────────────────────────

export const Stadiums = {
  findAll: async (): Promise<Stadium[]> => {
    if (supabase) return rows<Stadium>(await supabase.from('stadiums').select('data'));
    return readDb().stadiums;
  },

  findBySlug: async (slug: string): Promise<Stadium | undefined> => {
    if (supabase) return one<Stadium>(await supabase.from('stadiums').select('data').eq('slug', slug).maybeSingle());
    return readDb().stadiums.find((s: any) => s.slug === slug);
  },

  findByOwner: async (ownerId: string): Promise<Stadium | undefined> => {
    if (supabase) return one<Stadium>(await supabase.from('stadiums').select('data').eq('owner_id', ownerId).maybeSingle());
    return readDb().stadiums.find((s: any) => s.ownerId === ownerId);
  },

  slugExists: async (slug: string): Promise<boolean> => {
    if (supabase) {
      const { count, error } = await supabase.from('stadiums').select('slug', { count: 'exact', head: true }).eq('slug', slug);
      if (error) throw error;
      return (count ?? 0) > 0;
    }
    return readDb().stadiums.some((s: any) => s.slug === slug);
  },

  create: async (stadium: Omit<Stadium, 'createdAt'>): Promise<Stadium> => {
    const newStadium: Stadium = { ...stadium, createdAt: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('stadiums').insert({
        slug: newStadium.slug, owner_id: newStadium.ownerId,
        data: newStadium, created_at: newStadium.createdAt,
      });
      if (error) throw error;
    } else {
      const db = readDb();
      db.stadiums.push(newStadium);
      writeDb(db);
    }
    return newStadium;
  },

  update: async (slug: string, updates: Partial<Stadium>): Promise<Stadium | null> => {
    if (supabase) {
      const current = await Stadiums.findBySlug(slug);
      if (!current) return null;
      const merged: Stadium = { ...current, ...updates };
      const { error } = await supabase.from('stadiums').update({ owner_id: merged.ownerId, data: merged }).eq('slug', slug);
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      const idx = db.stadiums.findIndex((s: any) => s.slug === slug);
      if (idx === -1) return null;
      db.stadiums[idx] = { ...db.stadiums[idx], ...updates };
      writeDb(db);
      return db.stadiums[idx];
    }
  },

  delete: async (slug: string): Promise<boolean> => {
    if (supabase) {
      const { error, count } = await supabase.from('stadiums').delete({ count: 'exact' }).eq('slug', slug);
      if (error) throw error;
      return (count ?? 0) > 0;
    } else {
      const db = readDb();
      const idx = db.stadiums.findIndex((s: any) => s.slug === slug);
      if (idx === -1) return false;
      db.stadiums.splice(slug, 1);
      writeDb(db);
      return true;
    }
  },
};

// ── Fields ────────────────────────────────────────────────────────────────────

export const Fields = {
  findAll: async (): Promise<Field[]> => {
    if (supabase) return rows<Field>(await supabase.from('fields').select('data'));
    return readDb().fields;
  },

  findById: async (id: string): Promise<Field | undefined> => {
    if (supabase) return one<Field>(await supabase.from('fields').select('data').eq('id', id).maybeSingle());
    return readDb().fields.find((f: any) => f.id === id);
  },

  findByStadium: async (stadiumSlug: string): Promise<Field[]> => {
    if (supabase) return rows<Field>(await supabase.from('fields').select('data').eq('stadium_slug', stadiumSlug));
    return readDb().fields.filter((f: any) => f.stadiumSlug === stadiumSlug);
  },

  countByStadium: async (stadiumSlug: string): Promise<number> => {
    if (supabase) {
      const { count, error } = await supabase.from('fields').select('id', { count: 'exact', head: true }).eq('stadium_slug', stadiumSlug);
      if (error) throw error;
      return count ?? 0;
    }
    return readDb().fields.filter((f: any) => f.stadiumSlug === stadiumSlug).length;
  },

  create: async (field: Omit<Field, 'id' | 'createdAt'>): Promise<Field> => {
    const newField: Field = { ...field, id: generateId(), createdAt: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('fields').insert({
        id: newField.id, stadium_slug: newField.stadiumSlug,
        data: newField, created_at: newField.createdAt,
      });
      if (error) throw error;
    } else {
      const db = readDb();
      db.fields.push(newField);
      writeDb(db);
    }
    return newField;
  },

  update: async (id: string, updates: Partial<Field>): Promise<Field | null> => {
    if (supabase) {
      const current = await Fields.findById(id);
      if (!current) return null;
      const merged: Field = { ...current, ...updates };
      const { error } = await supabase.from('fields').update({ stadium_slug: merged.stadiumSlug, data: merged }).eq('id', id);
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      const idx = db.fields.findIndex((f: any) => f.id === id);
      if (idx === -1) return null;
      db.fields[idx] = { ...db.fields[idx], ...updates };
      writeDb(db);
      return db.fields[idx];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (supabase) {
      const { error, count } = await supabase.from('fields').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      return (count ?? 0) > 0;
    } else {
      const db = readDb();
      const idx = db.fields.findIndex((f: any) => f.id === id);
      if (idx === -1) return false;
      db.fields.splice(idx, 1);
      writeDb(db);
      return true;
    }
  },
};

// ── Bookings ──────────────────────────────────────────────────────────────────

export const Bookings = {
  findAll: async (): Promise<Booking[]> => {
    if (supabase) return rows<Booking>(await supabase.from('bookings').select('data'));
    return readDb().bookings;
  },

  findById: async (id: string): Promise<Booking | undefined> => {
    if (supabase) return one<Booking>(await supabase.from('bookings').select('data').eq('id', id).maybeSingle());
    return readDb().bookings.find((b: any) => b.id === id);
  },

  findByStadium: async (stadiumSlug: string): Promise<Booking[]> => {
    if (supabase) {
      return rows<Booking>(
        await supabase.from('bookings').select('data')
          .eq('stadium_slug', stadiumSlug)
          .order('created_at', { ascending: false })
      );
    }
    return readDb().bookings
      .filter((b: any) => b.stadiumSlug === stadiumSlug)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findByField: async (fieldId: string): Promise<Booking[]> => {
    if (supabase) return rows<Booking>(await supabase.from('bookings').select('data').eq('field_id', fieldId));
    return readDb().bookings.filter((b: any) => b.fieldId === fieldId);
  },

  findByFieldAndDate: async (fieldId: string, date: string): Promise<Booking[]> => {
    if (supabase) {
      return rows<Booking>(
        await supabase.from('bookings').select('data')
          .eq('field_id', fieldId).eq('date', date)
          .in('status', ['confirmed', 'pending'])
      );
    }
    return readDb().bookings.filter(
      (b: any) =>
        b.fieldId === fieldId &&
        b.date === date &&
        (b.status === 'confirmed' || b.status === 'pending')
    );
  },

  hasConflict: async (
    fieldId: string, date: string, startTime: string, endTime: string, excludeId?: string
  ): Promise<boolean> => {
    const existing = await Bookings.findByFieldAndDate(fieldId, date);
    for (const b of existing) {
      if (excludeId && b.id === excludeId) continue;
      if (startTime < b.endTime && endTime > b.startTime) return true;
    }
    return false;
  },

  create: async (booking: Omit<Booking, 'id' | 'createdAt' | 'updatedAt'>): Promise<Booking> => {
    const now = new Date().toISOString();
    const newBooking: Booking = { ...booking, id: generateId(), createdAt: now, updatedAt: now };
    if (supabase) {
      const { error } = await supabase.from('bookings').insert({
        id: newBooking.id, field_id: newBooking.fieldId, stadium_slug: newBooking.stadiumSlug,
        date: newBooking.date, start_time: newBooking.startTime, end_time: newBooking.endTime,
        status: newBooking.status, data: newBooking, created_at: newBooking.createdAt,
      });
      if (error) throw error;
    } else {
      const db = readDb();
      db.bookings.push(newBooking);
      writeDb(db);
    }
    return newBooking;
  },

  update: async (id: string, updates: Partial<Booking>): Promise<Booking | null> => {
    if (supabase) {
      const current = await Bookings.findById(id);
      if (!current) return null;
      const merged: Booking = { ...current, ...updates, updatedAt: new Date().toISOString() };
      const { error } = await supabase.from('bookings').update({
        field_id: merged.fieldId, stadium_slug: merged.stadiumSlug,
        date: merged.date, start_time: merged.startTime, end_time: merged.endTime,
        status: merged.status, data: merged,
      }).eq('id', id);
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      const idx = db.bookings.findIndex((b: any) => b.id === id);
      if (idx === -1) return null;
      db.bookings[idx] = { ...db.bookings[idx], ...updates, updatedAt: new Date().toISOString() };
      writeDb(db);
      return db.bookings[idx];
    }
  },

  getStadiumStats: async (stadiumSlug: string) => {
    const bookings = await Bookings.findByStadium(stadiumSlug);
    const today = new Date().toISOString().split('T')[0];
    const currentMonth = new Date().toISOString().slice(0, 7);

    const todayBookings = bookings.filter((b) => b.date === today);
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');
    const pendingBookings = bookings.filter((b) => b.status === 'pending');
    const cancelledBookings = bookings.filter((b) => b.status === 'cancelled' || b.status === 'rejected');
    const monthlyBookings = bookings.filter((b) => b.date.startsWith(currentMonth));

    return {
      todayBookings: todayBookings.length,
      pendingBookings: pendingBookings.length,
      confirmedBookings: confirmedBookings.length,
      cancelledBookings: cancelledBookings.length,
      todayRevenue: todayBookings.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0),
      monthlyRevenue: monthlyBookings.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0),
      recentBookings: bookings.slice(0, 10),
    };
  },
};

// ── Time Slots ────────────────────────────────────────────────────────────────

export async function generateTimeSlots(field: Field, date: string): Promise<TimeSlot[]> {
  const slots: TimeSlot[] = [];
  if (field.blockedDates?.includes(date)) return [];

  const existingBookings = await Bookings.findByFieldAndDate(field.id, date);
  const duration = field.bookingDuration;

  let currentMinutes = timeToMinutes(field.openingTime);
  const closeMinutes = timeToMinutes(field.closingTime === '00:00' ? '24:00' : field.closingTime);

  while (currentMinutes + duration <= closeMinutes) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;
    const endMinutes = currentMinutes + duration;
    const endH = Math.floor(endMinutes / 60);
    const endM = endMinutes % 60;

    const startTime = `${String(startH).padStart(2, '0')}:${String(startM).padStart(2, '0')}`;
    const endTime = `${String(endH % 24).padStart(2, '0')}:${String(endM).padStart(2, '0')}`;

    let status: TimeSlot['status'] = 'available';
    let bookingId: string | undefined;

    for (const b of existingBookings) {
      if (startTime < b.endTime && endTime > b.startTime) {
        status = b.status === 'confirmed' ? 'booked' : 'pending';
        bookingId = b.id;
        break;
      }
    }

    slots.push({
      startTime,
      endTime,
      status,
      bookingId,
      amount: (field.pricePerHour * duration) / 60,
    });

    currentMinutes += duration;
  }

  return slots;
}

// ── Subscription Plans ────────────────────────────────────────────────────────

export const SubscriptionPlans = {
  findAll: async (): Promise<SubscriptionPlan[]> => {
    if (supabase) return rows<SubscriptionPlan>(await supabase.from('subscription_plans').select('data'));
    return readDb().subscriptionPlans;
  },

  findById: async (id: string): Promise<SubscriptionPlan | undefined> => {
    if (supabase) return one<SubscriptionPlan>(await supabase.from('subscription_plans').select('data').eq('id', id).maybeSingle());
    return readDb().subscriptionPlans.find((p: any) => p.id === id);
  },

  create: async (plan: Omit<SubscriptionPlan, 'id' | 'createdAt'>): Promise<SubscriptionPlan> => {
    const newPlan: SubscriptionPlan = { ...plan, id: generateId(), createdAt: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('subscription_plans').insert({ id: newPlan.id, data: newPlan, created_at: newPlan.createdAt });
      if (error) throw error;
    } else {
      const db = readDb();
      db.subscriptionPlans.push(newPlan);
      writeDb(db);
    }
    return newPlan;
  },

  update: async (id: string, updates: Partial<SubscriptionPlan>): Promise<SubscriptionPlan | null> => {
    if (supabase) {
      const current = await SubscriptionPlans.findById(id);
      if (!current) return null;
      const merged: SubscriptionPlan = { ...current, ...updates };
      const { error } = await supabase.from('subscription_plans').update({ data: merged }).eq('id', id);
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      const idx = db.subscriptionPlans.findIndex((p: any) => p.id === id);
      if (idx === -1) return null;
      db.subscriptionPlans[idx] = { ...db.subscriptionPlans[idx], ...updates };
      writeDb(db);
      return db.subscriptionPlans[idx];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (supabase) {
      const { error, count } = await supabase.from('subscription_plans').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      return (count ?? 0) > 0;
    } else {
      const db = readDb();
      const idx = db.subscriptionPlans.findIndex((p: any) => p.id === id);
      if (idx === -1) return false;
      db.subscriptionPlans.splice(idx, 1);
      writeDb(db);
      return true;
    }
  },
};

// ── Notifications ─────────────────────────────────────────────────────────────

export const Notifications = {
  findByStadium: async (stadiumSlug: string): Promise<Notification[]> => {
    if (supabase) {
      return rows<Notification>(
        await supabase.from('notifications').select('data')
          .eq('stadium_slug', stadiumSlug)
          .order('created_at', { ascending: false })
      );
    }
    return readDb().notifications
      .filter((n: any) => n.stadiumSlug === stadiumSlug)
      .sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  unreadCount: async (stadiumSlug: string): Promise<number> => {
    if (supabase) {
      const { count, error } = await supabase.from('notifications').select('id', { count: 'exact', head: true }).eq('stadium_slug', stadiumSlug).eq('is_read', false);
      if (error) throw error;
      return count ?? 0;
    }
    return readDb().notifications.filter((n: any) => n.stadiumSlug === stadiumSlug && !n.isRead).length;
  },

  create: async (notification: Omit<Notification, 'id' | 'createdAt'>): Promise<Notification> => {
    const newNotif: Notification = { ...notification, id: generateId(), createdAt: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('notifications').insert({
        id: newNotif.id, stadium_slug: newNotif.stadiumSlug, is_read: newNotif.isRead,
        data: newNotif, created_at: newNotif.createdAt,
      });
      if (error) throw error;
    } else {
      const db = readDb();
      db.notifications.push(newNotif);
      writeDb(db);
    }
    return newNotif;
  },

  markAllRead: async (stadiumSlug: string): Promise<void> => {
    if (supabase) {
      const { data: unread, error: readErr } = await supabase.from('notifications').select('id, data').eq('stadium_slug', stadiumSlug).eq('is_read', false);
      if (readErr) throw readErr;
      await Promise.all((unread ?? []).map((r) =>
        supabase.from('notifications')
          .update({ is_read: true, data: { ...(r.data as Notification), isRead: true } })
          .eq('id', (r as { id: string }).id)
      ));
    } else {
      const db = readDb();
      db.notifications.forEach((n: any) => { if (n.stadiumSlug === stadiumSlug) n.isRead = true; });
      writeDb(db);
    }
  },

  markRead: async (id: string): Promise<void> => {
    if (supabase) {
      const { data: row, error: readErr } = await supabase.from('notifications').select('data').eq('id', id).maybeSingle();
      if (readErr) throw readErr;
      if (!row) return;
      const { error } = await supabase.from('notifications')
        .update({ is_read: true, data: { ...(row.data as Notification), isRead: true } })
        .eq('id', id);
      if (error) throw error;
    } else {
      const db = readDb();
      const n = db.notifications.find((n: any) => n.id === id);
      if (n) { n.isRead = true; writeDb(db); }
    }
  },
};

// ── Support Tickets ───────────────────────────────────────────────────────────

export const SupportTickets = {
  findAll: async (): Promise<SupportTicket[]> => {
    if (supabase) return rows<SupportTicket>(await supabase.from('support_tickets').select('data').order('created_at', { ascending: false }));
    return readDb().supportTickets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  findById: async (id: string): Promise<SupportTicket | undefined> => {
    if (supabase) return one<SupportTicket>(await supabase.from('support_tickets').select('data').eq('id', id).maybeSingle());
    return readDb().supportTickets.find((t: any) => t.id === id);
  },

  findByStadium: async (stadiumSlug: string): Promise<SupportTicket[]> => {
    if (supabase) return rows<SupportTicket>(await supabase.from('support_tickets').select('data').eq('stadium_slug', stadiumSlug));
    return readDb().supportTickets.filter((t: any) => t.stadiumSlug === stadiumSlug);
  },

  create: async (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'replies'>): Promise<SupportTicket> => {
    const now = new Date().toISOString();
    const newTicket: SupportTicket = { ...ticket, id: generateId(), replies: [], createdAt: now, updatedAt: now };
    if (supabase) {
      const { error } = await supabase.from('support_tickets').insert({
        id: newTicket.id, stadium_slug: newTicket.stadiumSlug,
        data: newTicket, created_at: newTicket.createdAt,
      });
      if (error) throw error;
    } else {
      const db = readDb();
      db.supportTickets.push(newTicket);
      writeDb(db);
    }
    return newTicket;
  },

  update: async (id: string, updates: Partial<SupportTicket>): Promise<SupportTicket | null> => {
    if (supabase) {
      const current = await SupportTickets.findById(id);
      if (!current) return null;
      const merged: SupportTicket = { ...current, ...updates, updatedAt: new Date().toISOString() };
      const { error } = await supabase.from('support_tickets').update({ stadium_slug: merged.stadiumSlug, data: merged }).eq('id', id);
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      const idx = db.supportTickets.findIndex((t: any) => t.id === id);
      if (idx === -1) return null;
      db.supportTickets[idx] = { ...db.supportTickets[idx], ...updates, updatedAt: new Date().toISOString() };
      writeDb(db);
      return db.supportTickets[idx];
    }
  },
};

// ── Activity Logs ─────────────────────────────────────────────────────────────

export const ActivityLogs = {
  findAll: async (limit = 100): Promise<ActivityLog[]> => {
    if (supabase) return rows<ActivityLog>(await supabase.from('activity_logs').select('data').order('created_at', { ascending: false }).limit(limit));
    return readDb().activityLogs.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, limit);
  },

  log: async (entry: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void> => {
    const newLog: ActivityLog = { ...entry, id: generateId(), createdAt: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('activity_logs').insert({ id: newLog.id, data: newLog, created_at: newLog.createdAt });
      if (error) throw error;
    } else {
      const db = readDb();
      db.activityLogs.push(newLog);
      if (db.activityLogs.length > 1000) db.activityLogs = db.activityLogs.slice(-1000);
      writeDb(db);
    }
  },
};

// ── Cities ────────────────────────────────────────────────────────────────────

export const Cities = {
  findAll: async (): Promise<City[]> => {
    if (supabase) return rows<City>(await supabase.from('cities').select('data').eq('is_active', true));
    return readDb().cities.filter((c: any) => c.isActive);
  },

  findAllAdmin: async (): Promise<City[]> => {
    if (supabase) return rows<City>(await supabase.from('cities').select('data'));
    return readDb().cities;
  },

  create: async (name: string): Promise<City> => {
    const city: City = { id: generateId(), name, isActive: true, createdAt: new Date().toISOString() };
    if (supabase) {
      const { error } = await supabase.from('cities').insert({ id: city.id, is_active: city.isActive, data: city, created_at: city.createdAt });
      if (error) throw error;
    } else {
      const db = readDb();
      db.cities.push(city);
      writeDb(db);
    }
    return city;
  },

  update: async (id: string, updates: Partial<City>): Promise<City | null> => {
    if (supabase) {
      const { data: row, error: readErr } = await supabase.from('cities').select('data').eq('id', id).maybeSingle();
      if (readErr) throw readErr;
      if (!row) return null;
      const merged: City = { ...(row.data as City), ...updates };
      const { error } = await supabase.from('cities').update({ is_active: merged.isActive, data: merged }).eq('id', id);
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      const idx = db.cities.findIndex((c: any) => c.id === id);
      if (idx === -1) return null;
      db.cities[idx] = { ...db.cities[idx], ...updates };
      writeDb(db);
      return db.cities[idx];
    }
  },

  delete: async (id: string): Promise<boolean> => {
    if (supabase) {
      const { error, count } = await supabase.from('cities').delete({ count: 'exact' }).eq('id', id);
      if (error) throw error;
      return (count ?? 0) > 0;
    } else {
      const db = readDb();
      const idx = db.cities.findIndex((c: any) => c.id === id);
      if (idx === -1) return false;
      db.cities.splice(idx, 1);
      writeDb(db);
      return true;
    }
  },
};

// ── Platform Settings ─────────────────────────────────────────────────────────

export const PlatformSettingsDB = {
  get: async (): Promise<PlatformSettings> => {
    if (supabase) {
      const { data, error } = await supabase.from('platform_settings').select('data').eq('id', 1).maybeSingle();
      if (error) throw error;
      return data!.data as PlatformSettings;
    }
    return readDb().platformSettings;
  },

  update: async (updates: Partial<PlatformSettings>): Promise<PlatformSettings> => {
    if (supabase) {
      const current = await PlatformSettingsDB.get();
      const merged: PlatformSettings = { ...current, ...updates, updatedAt: new Date().toISOString() };
      const { error } = await supabase.from('platform_settings').upsert({ id: 1, data: merged });
      if (error) throw error;
      return merged;
    } else {
      const db = readDb();
      db.platformSettings = { ...db.platformSettings, ...updates, updatedAt: new Date().toISOString() };
      writeDb(db);
      return db.platformSettings;
    }
  },
};

// ── Admin Stats ───────────────────────────────────────────────────────────────

export async function getAdminStats() {
  const today = new Date().toISOString().split('T')[0];
  const currentMonth = new Date().toISOString().slice(0, 7);

  if (supabase) {
    const [stadiums, fieldsCountRes, bookings] = await Promise.all([
      Stadiums.findAll(),
      supabase.from('fields').select('id', { count: 'exact', head: true }),
      Bookings.findAll(),
    ]);
    if (fieldsCountRes.error) throw fieldsCountRes.error;

    const owners = stadiums;
    const activeOwners = owners.filter((s) => s.isActive && s.subscriptionStatus === 'active');
    const suspendedOwners = owners.filter((s) => !s.isActive);
    const pendingOwners = owners.filter((s) => s.approvalStatus === 'pending');

    const todayBookings = bookings.filter((b) => b.date === today);
    const monthlyBookings = bookings.filter((b) => b.date.startsWith(currentMonth));
    const confirmedBookings = bookings.filter((b) => b.status === 'confirmed');

    const totalRevenue = confirmedBookings.reduce((s, b) => s + b.amount, 0);
    const monthlyRevenue = monthlyBookings.filter((b) => b.status === 'confirmed').reduce((s, b) => s + b.amount, 0);

    return {
      totalOwners: owners.length,
      activeOwners: activeOwners.length,
      suspendedOwners: suspendedOwners.length,
      pendingOwners: pendingOwners.length,
      totalFields: fieldsCountRes.count ?? 0,
      totalBookings: bookings.length,
      todayBookings: todayBookings.length,
      monthlyBookings: monthlyBookings.length,
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions: owners.filter((s) => s.subscriptionStatus === 'active').length,
      expiredSubscriptions: owners.filter((s) => s.subscriptionStatus === 'expired').length,
    };
  } else {
    const db = readDb();
    const owners = db.stadiums;
    const activeOwners = owners.filter((s: any) => s.isActive && s.subscriptionStatus === 'active');
    const suspendedOwners = owners.filter((s: any) => !s.isActive);
    const pendingOwners = owners.filter((s: any) => s.approvalStatus === 'pending');

    const todayBookings = db.bookings.filter((b: any) => b.date === today);
    const monthlyBookings = db.bookings.filter((b: any) => b.date.startsWith(currentMonth));
    const confirmedBookings = db.bookings.filter((b: any) => b.status === 'confirmed');

    const totalRevenue = confirmedBookings.reduce((s: any, b: any) => s + b.amount, 0);
    const monthlyRevenue = monthlyBookings.filter((b: any) => b.status === 'confirmed').reduce((s: any, b: any) => s + b.amount, 0);

    return {
      totalOwners: owners.length,
      activeOwners: activeOwners.length,
      suspendedOwners: suspendedOwners.length,
      pendingOwners: pendingOwners.length,
      totalFields: db.fields.length,
      totalBookings: db.bookings.length,
      todayBookings: todayBookings.length,
      monthlyBookings: monthlyBookings.length,
      totalRevenue,
      monthlyRevenue,
      activeSubscriptions: owners.filter((s: any) => s.subscriptionStatus === 'active').length,
      expiredSubscriptions: owners.filter((s: any) => s.subscriptionStatus === 'expired').length,
    };
  }
}
