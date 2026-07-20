import { NextRequest, NextResponse } from 'next/server';
import { Users, Stadiums } from '@/lib/db';
import { generateId } from '@/lib/utils';
import { createSession, hashPassword } from '@/lib/auth';
import { validateRegister } from '@/lib/validations';
import { ActivityLogs } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // 1. Validation
    const validation = validateRegister(body);
    if (!validation.valid) {
      return NextResponse.json({ success: false, errors: validation.errors }, { status: 400 });
    }

    const {
      name, email, password, phone,
      stadiumName, slug, city, address,
      logo, coverImage, vodafoneCash, instaPay,
    } = body;

    const cleanEmail = email.toLowerCase().trim();
    const cleanSlug = slug.toLowerCase().trim();

    // 2. Check for duplicate Email
    const existingUser = await Users.findByEmail(cleanEmail);
    if (existingUser) {
      return NextResponse.json({
        success: false,
        errors: { email: 'البريد الإلكتروني مسجل بالفعل، يرجى تسجيل الدخول' }
      }, { status: 409 });
    }

    // 3. Check for duplicate Slug
    const existingStadium = await Stadiums.findBySlug(cleanSlug);
    if (existingStadium) {
      return NextResponse.json({
        success: false,
        errors: { slug: 'رابط الملعب محجوز بالفعل، اختر رابطاً آخر' }
      }, { status: 409 });
    }

    // 4. Create User & Stadium
    const passwordHash = await hashPassword(password);
    const userId = generateId();
    const now = new Date().toISOString();

    const user = await Users.create({
      name: name.trim(),
      email: cleanEmail,
      passwordHash,
      role: 'owner',
      stadiumSlug: cleanSlug,
      phone: phone.trim(),
      isActive: true,
    });

    const stadium = await Stadiums.create({
      slug: cleanSlug,
      ownerId: user.id,
      name: stadiumName.trim(),
      phone: phone.trim(),
      city: city.trim(),
      address: (address || '').trim(),
      logo: logo || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=100&h=100&fit=crop',
      coverImage: coverImage || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&h=400&fit=crop',
      vodafoneCash: vodafoneCash || '',
      instaPay: instaPay || '',
      paymentInstructions: 'يرجى تحويل قيمة الحجز كاملة لتأكيد الحجز، ثم رفع صورة التحويل هنا.',
      subscriptionStatus: 'trial', // Default 7-day trial
      subscriptionPlanId: 'plan-basic',
      subscriptionExpiry: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
      isActive: true,
      approvalStatus: 'approved', // Auto-approved by default in settings
    });

    // 5. Create session cookie
    await createSession({
      userId: user.id,
      role: user.role,
      stadiumSlug: cleanSlug,
      name: user.name,
      email: user.email,
    });

    // 6. Log activity
    ActivityLogs.log({
      action: 'owner_registration',
      performedBy: user.id,
      performedByName: user.name,
      targetId: stadium.slug,
      targetType: 'stadium',
      details: { stadiumName: stadium.name },
    });

    return NextResponse.json({
      success: true,
      data: {
        user: { id: user.id, name: user.name, email: user.email, role: user.role },
        stadium: { name: stadium.name, slug: stadium.slug }
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Registration API error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ غير متوقع أثناء التسجيل' }, { status: 500 });
  }
}
