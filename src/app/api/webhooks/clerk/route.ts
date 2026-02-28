import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// Clerk webhook — sync user creation/updates to Supabase
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json();
        const { type, data } = payload;

        switch (type) {
            case 'user.created':
            case 'user.updated': {
                const { id, email_addresses, first_name, last_name, public_metadata } = data;
                const email = email_addresses?.[0]?.email_address;
                const role = public_metadata?.role || 'cliente';
                const nombre = [first_name, last_name].filter(Boolean).join(' ') || '';

                const { error } = await supabaseAdmin
                    .from('users')
                    .upsert(
                        {
                            clerk_id: id,
                            email: email,
                            nombre: nombre,
                            role: role,
                        },
                        { onConflict: 'clerk_id' }
                    );

                if (error) {
                    console.error('Error syncing user to Supabase:', error);
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }

                return NextResponse.json({ success: true });
            }

            case 'user.deleted': {
                const { id } = data;
                const { error } = await supabaseAdmin
                    .from('users')
                    .update({ activo: false })
                    .eq('clerk_id', id);

                if (error) {
                    console.error('Error deactivating user:', error);
                    return NextResponse.json({ error: error.message }, { status: 500 });
                }

                return NextResponse.json({ success: true });
            }

            default:
                return NextResponse.json({ message: 'Unhandled event type' }, { status: 200 });
        }
    } catch (error) {
        console.error('Webhook error:', error);
        return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
    }
}
