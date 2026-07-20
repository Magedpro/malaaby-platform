import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { ALLOWED_IMAGE_TYPES, MAX_FILE_SIZE } from '@/lib/constants';


export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ success: false, error: 'لم يتم اختيار أي ملف' }, { status: 400 });
    }

    // 1. Safety Checks (Size & Type)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ success: false, error: 'حجم الملف يتجاوز الحد المسموح (10 ميجابايت)' }, { status: 400 });
    }

    if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
      return NextResponse.json({ success: false, error: 'نوع الملف غير مدعوم. الأنواع المسموحة: JPG, PNG, WEBP' }, { status: 400 });
    }

    // Anti-XSS and safety filename cleaning
    const originalName = file.name || 'image.png';
    const extension = path.extname(originalName).toLowerCase() || '.png';
    const cleanName = `${Date.now()}-${Math.random().toString(36).substring(2, 10)}${extension}`;

    // 2. Production Upload: ImgBB or Supabase Storage Integration
    const imgbbApiKey = process.env.IMGBB_API_KEY;
    if (imgbbApiKey) {
      try {
        const fileBuffer = await file.arrayBuffer();
        const base64File = Buffer.from(fileBuffer).toString('base64');
        const imgbbFormData = new FormData();
        imgbbFormData.append('image', base64File);

        const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${imgbbApiKey}`, {
          method: 'POST',
          body: imgbbFormData,
        });

        const imgbbJson = await imgbbRes.json();
        if (imgbbJson.success && imgbbJson.data?.url) {
          return NextResponse.json({ success: true, url: imgbbJson.data.url });
        } else {
          console.warn('ImgBB upload failed, falling back to next storage option:', imgbbJson);
        }
      } catch (err) {
        console.error('ImgBB upload error:', err);
      }
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    const bucketName = process.env.SUPABASE_STORAGE_BUCKET || 'malaaby-receipts';

    if (supabaseUrl && supabaseServiceRole) {
      try {
        // Ensure bucket exists in Supabase (creates it if missing)
        try {
          await fetch(`${supabaseUrl}/storage/v1/bucket`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceRole}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              id: bucketName,
              name: bucketName,
              public: true,
            }),
          });
        } catch (bucketErr) {
          // Ignore
        }

        const fileBuffer = await file.arrayBuffer();
        const uploadUrl = `${supabaseUrl}/storage/v1/object/${bucketName}/${cleanName}`;

        const uploadRes = await fetch(uploadUrl, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${supabaseServiceRole}`,
            'API-KEY': supabaseServiceRole,
            'Content-Type': file.type,
          },
          body: fileBuffer,
        });

        if (uploadRes.ok) {
          const publicUrl = `${supabaseUrl}/storage/v1/object/public/${bucketName}/${cleanName}`;
          return NextResponse.json({ success: true, url: publicUrl });
        } else {
          const errText = await uploadRes.text();
          console.warn('Supabase Storage upload failed, falling back to local storage:', errText);
        }
      } catch (uploadError) {
        console.error('Supabase upload error, attempting local storage fallback:', uploadError);
      }
    }

    // 3. Local fallback: Save to public/uploads/
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, cleanName);
    fs.writeFileSync(filePath, buffer);

    const publicPath = `/uploads/${cleanName}`;
    return NextResponse.json({ success: true, url: publicPath });

  } catch (error) {
    console.error('Upload API route error:', error);
    return NextResponse.json({ success: false, error: 'حدث خطأ أثناء تحميل الملف' }, { status: 500 });
  }
}
