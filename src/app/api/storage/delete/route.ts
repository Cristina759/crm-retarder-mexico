import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const STORAGE_BUCKET = 'documentos';

export async function POST(request: NextRequest) {
    try {
        const { filePath } = await request.json();

        if (!filePath || typeof filePath !== 'string') {
            return NextResponse.json(
                { error: 'filePath es requerido' },
                { status: 400 }
            );
        }

        // Validate the path starts with 'expedientes/' to prevent arbitrary deletions
        if (!filePath.startsWith('expedientes/')) {
            return NextResponse.json(
                { error: 'Ruta de archivo no válida' },
                { status: 400 }
            );
        }

        console.log('[API DELETE] Deleting file with admin:', filePath);

        const { data, error } = await supabaseAdmin.storage
            .from(STORAGE_BUCKET)
            .remove([filePath]);

        if (error) {
            console.error('[API DELETE] Supabase error:', error);
            return NextResponse.json(
                { error: error.message },
                { status: 500 }
            );
        }

        console.log('[API DELETE] Success:', data);

        return NextResponse.json({ success: true, data });
    } catch (err: any) {
        console.error('[API DELETE] Unexpected error:', err);
        return NextResponse.json(
            { error: err.message || 'Error interno del servidor' },
            { status: 500 }
        );
    }
}
