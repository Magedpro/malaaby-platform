import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { Users, Stadiums, ActivityLogs } from '@/lib/db';
import { hashPassword } from '@/lib/auth';
import { isValidEmail } from '@/lib/utils';

// GET all owners
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const { searchParams } = request.nextUrl;
    const query = searchParams.get('query')?.toLowerCase() || '';

    const allUsers = await Users.findAll();
    const ownerUsers = allUsers.filter(u => u.role === 'owner');

    const owners = await Promise.all(
      ownerUsers.map(async (u) => {
        const stadium = u.stadiumSlug ? await Stadiums.findBySlug(u.stadiumSlug) : null;
        return {
          id: u.id, name: u.name, email: u.email,
          phone: u.phone, isActive: u.isActive,
          stadiumSlug: u.stadiumSlug,
          stadiumName: stadium?.name || '',
          city: stadium?.city || '',
          subscriptionStatus: stadium?.subscriptionStatus || '',
          subscriptionExpiry: stadium?.subscriptionExpiry || '',
          approvalStatus: stadium?.approvalStatus || '',
          createdAt: u.createdAt,
        };
      })
    );

    const filtered = owners.filter(o =>
      !query ||
      o.name.toLowerCase().includes(query) ||
      o.email.toLowerCase().includes(query) ||
      o.stadiumName.toLowerCase().includes(query)
    );

    return NextResponse.json({ success: true, data: filtered });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في جلب بيانات الملاك' }, { status: 500 });
  }
}

// POST create new owner
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    if (!session || session.role !== 'super_admin') {
      return NextResponse.json({ success: false, error: 'غير مصرح' }, { status: 403 });
    }

    const body = await request.json();
    const { name, email, password, phone, stadiumName, slug, city, subscriptionStatus, subscriptionExpiry } = body;

    if (!name || !email || !password || !stadiumName || !slug) {
      return NextResponse.json({ success: false, error: 'جميع الحقول الأساسية مطلوبة' }, { status: 400 });
    }

    if (await Users.findByEmail(email)) {
      return NextResponse.json({ success: false, errors: { email: 'البريد مسجل مسبقاً' } }, { status: 409 });
    }

    if (await Stadiums.slugExists(slug)) {
      return NextResponse.json({ success: false, errors: { slug: 'الرابط محجوز' } }, { status: 409 });
    }

    const passwordHash = await hashPassword(password);
    const user = await Users.create({ name, email, passwordHash, role: 'owner', stadiumSlug: slug, phone: phone || '', isActive: true });
    const stadium = await Stadiums.create({
      slug, ownerId: user.id, name: stadiumName, phone: phone || '',
      city: city || 'القاهرة', address: '',
      subscriptionStatus: subscriptionStatus || 'trial',
      subscriptionExpiry: subscriptionExpiry || new Date(Date.now() + 7 * 86400000).toISOString(),
      isActive: true, approvalStatus: 'approved',
    });

    ActivityLogs.log({ action: 'admin_create_owner', performedBy: session.userId, performedByName: session.name, targetId: user.id, targetType: 'user' });

    return NextResponse.json({ success: true, data: { user, stadium } }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ success: false, error: 'خطأ في إنشاء الحساب' }, { status: 500 });
  }
}
