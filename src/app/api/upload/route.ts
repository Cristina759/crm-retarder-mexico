import { NextRequest, NextResponse } from 'next/server';
import { PutObjectCommand } from '@aws-sdk/client-s3';
import { r2Client, R2_BUCKET, getR2PublicUrl } from '@/lib/r2';

export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const folder = (formData.get('folder') as string) || 'evidencias';

        if (!file) {
            return NextResponse.json({ error: 'No file provided' }, { status: 400 });
        }

        // Max 10MB
        if (file.size > 10 * 1024 * 1024) {
            return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 400 });
        }

        const ext = file.name.split('.').pop() || 'bin';
        const key = `${folder}/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

        const buffer = Buffer.from(await file.arrayBuffer());

        await r2Client.send(
            new PutObjectCommand({
                Bucket: R2_BUCKET,
                Key: key,
                Body: buffer,
                ContentType: file.type || 'application/octet-stream',
                CacheControl: 'public, max-age=31536000',
            })
        );

        const url = getR2PublicUrl(key);
        return NextResponse.json({ url, key });
    } catch (err: any) {
        console.error('R2 upload error:', err);
        return NextResponse.json({ error: err.message || 'Upload failed' }, { status: 500 });
    }
}
