import { NextRequest, NextResponse } from 'next/server';
import { GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { r2Client, R2_BUCKET } from '@/lib/r2';

export const runtime = 'nodejs';

// 7 days in seconds
const SIGNED_URL_EXPIRY = 60 * 60 * 24 * 7;

/**
 * GET /api/r2-url?key=evidencias/1234567890-abc123.jpg
 *
 * Generates a fresh signed URL for an existing R2 object.
 * Use this when a previously generated signed URL has expired.
 */
export async function GET(req: NextRequest) {
    try {
        const key = req.nextUrl.searchParams.get('key');

        if (!key) {
            return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
        }

        const signedUrl = await getSignedUrl(
            r2Client,
            new GetObjectCommand({ Bucket: R2_BUCKET, Key: key }),
            { expiresIn: SIGNED_URL_EXPIRY },
        );

        return NextResponse.json({ url: signedUrl });
    } catch (err: any) {
        console.error('R2 signed URL error:', err);
        return NextResponse.json({ error: err.message || 'Failed to generate URL' }, { status: 500 });
    }
}
