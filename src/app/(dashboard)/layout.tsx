'use client';

import { AppSidebar } from '@/components/layout/app-sidebar';
import { Header } from '@/components/layout/header';
import { useRole } from '@/hooks/useRole';
import { usePathname, redirect } from 'next/navigation';
import { useEffect } from 'react';
import { Rol } from '@/lib/utils/constants';

// Define which roles have access to which route prefixes
const ROUTE_PERMISSIONS: Record<string, Rol[]> = {
    '/ventas/nueva': ['admin', 'vendedor'],
    '/clientes': ['admin', 'vendedor'],
    '/facturacion': ['admin', 'direccion'],
    '/cobranza': ['admin', 'direccion'],
    '/catalogos': ['admin', 'vendedor', 'direccion'],
    '/configuracion': ['admin', 'direccion'],
};

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { role, isLoaded } = useRole();
    const pathname = usePathname();

    useEffect(() => {
        if (!isLoaded) return;

        // Check permissions
        for (const [route, allowedRoles] of Object.entries(ROUTE_PERMISSIONS)) {
            if (pathname.startsWith(route)) {
                if (!allowedRoles.includes(role)) {
                    // Redirect to dashboard if unauthorized
                    redirect('/dashboard');
                }
            }
        }
    }, [pathname, role, isLoaded]);

    if (!isLoaded) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-retarder-gray-50">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-retarder-red"></div>
            </div>
        );
    }

    return (
        <div className="flex min-h-screen bg-retarder-gray-50">
            <AppSidebar />
            <div className="flex-1 flex flex-col min-w-0">
                <Header />
                <main className="flex-1 p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
