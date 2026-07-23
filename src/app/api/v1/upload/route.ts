import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
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

    // 2. Cloudflare R2 Upload (Priority 1)
    const r2AccountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
    const r2AccessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
    const r2SecretAccessKey = process.env.CLOUDFLARE_R2_SECRET_ACCESS_KEY;
    const r2BucketName = process.env.CLOUDFLARE_R2_BUCKET_NAME || 'malaaby-uploads';
    const r2PublicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL; // e.g. https://cdn.malaaby.online or https://pub-xxx.r2.dev

    if (r2AccountId && r2AccessKeyId && r2SecretAccessKey) {
      try {
        const fileBuffer = Buffer.from(await file.arrayBuffer());
        const s3Client = new S3Client({
          region: 'auto',
          endpoint: `https://${r2AccountId}.r2.cloudflarestorage.com`,
          credentials: {
            accessKeyId: r2AccessKeyId,
            secretAccessKey: r2SecretAccessKey,
          },
        });

        await s3Client.send(
          new PutObjectCommand({
            Bucket: r2BucketName,
            Key: cleanName,
            Body: fileBuffer,
            ContentType: file.type,
          })
        );

        const finalUrl = r2PublicUrl
          ? `${r2PublicUrl.replace(/\/$/, '')}/${cleanName}`
          : `https://${r2BucketName}.${r2AccountId}.r2.cloudflarestorage.com/${cleanName}`;

        console.log(`☁️ [Cloudflare R2]: Successfully uploaded ${cleanName}`);
        return NextResponse.json({ success: true, url: finalUrl });
      } catch (r2Err) {
        console.error('☁️ [Cloudflare R2 Upload Error]:', r2Err);
      }
    }

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
