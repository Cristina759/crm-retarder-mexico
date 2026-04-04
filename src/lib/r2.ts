import { S3Client } from '@aws-sdk/client-s3';

// Cloudflare R2 client — API compatible with S3
export const r2Client = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
        accessKeyId: process.env.R2_ACCESS_KEY_ID!,
        secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
});

export const R2_BUCKET = process.env.R2_BUCKET_NAME!;

// Public URL base — R2 custom domain or public bucket URL
// Format: https://<account-id>.r2.cloudflarestorage.com/<bucket>/<key>
export function getR2PublicUrl(key: string): string {
    const endpoint = process.env.R2_ENDPOINT!.replace(/\/$/, '');
    const bucket = process.env.R2_BUCKET_NAME!;
    return `${endpoint}/${bucket}/${key}`;
}
