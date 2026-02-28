'use client';

import { useUser } from '@clerk/nextjs';
import { Rol } from '@/lib/utils/constants';

export function useRole() {
    const { user, isLoaded } = useUser();

    // Default to 'vendedor' as requested if no role is found
    const rawRole = (user?.publicMetadata?.role as string) || 'vendedor';
    const role = rawRole.toLowerCase() as Rol;

    const isAdmin = role === 'admin' || role === 'direccion';
    const isVendedor = role === 'vendedor';
    const isTecnico = role === 'tecnico';
    const isCliente = role === 'cliente';

    return {
        role,
        isLoaded,
        isAdmin,
        isVendedor,
        isTecnico,
        isCliente,
        /** Check if the user has any of the specified roles */
        hasRole: (roles: Rol[]) => roles.includes(role)
    };
}
