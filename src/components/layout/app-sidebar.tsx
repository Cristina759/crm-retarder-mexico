'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { UserButton, useUser } from '@clerk/nextjs';
import {
    LayoutDashboard,
    Ticket,
    Building2,
    FileText,
    TrendingUp,
    Package,
    Wrench,
    BarChart3,
    Users,
    Settings,
    ChevronLeft,
    ChevronRight,
    Warehouse,
    Receipt,
    CreditCard,
    ShoppingCart,
    ClipboardCheck,
    Menu,
    X,
} from 'lucide-react';
import { cn, formatUserName } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { Rol } from '@/lib/utils/constants';

interface NavItem {
    label: string;
    href: string;
    icon: React.ReactNode;
    roles?: Rol[];
}

const navGroups: { title: string; items: NavItem[] }[] = [
    {
        title: 'General',
        items: [
            { label: 'Dashboard', href: '/dashboard', icon: <LayoutDashboard size={20} />, roles: ['admin', 'vendedor', 'tecnico'] },
        ],
    },
    {
        title: 'Ventas',
        items: [
            { label: 'Nueva Cotización', href: '/ventas/nueva', icon: <ShoppingCart size={20} />, roles: ['admin', 'vendedor'] },
            { label: 'Mis Cotizaciones', href: '/cotizaciones', icon: <FileText size={20} />, roles: ['admin', 'vendedor', 'cliente'] },
        ],
    },
    {
        title: 'Operaciones',
        items: [
            { label: 'Órdenes de Servicio', href: '/ordenes', icon: <Ticket size={20} />, roles: ['admin', 'vendedor', 'tecnico', 'cliente'] },
            { label: 'Clientes', href: '/clientes', icon: <Building2 size={20} />, roles: ['admin', 'vendedor'] },
        ],
    },
    {
        title: 'Catálogos',
        items: [
            { label: 'Frenos', href: '/catalogos/frenos', icon: <Package size={20} />, roles: ['admin', 'vendedor'] },
            { label: 'Herramientas', href: '/catalogos/refacciones', icon: <Wrench size={20} />, roles: ['admin', 'vendedor'] },
            { label: 'Servicios', href: '/catalogos/servicios', icon: <ClipboardCheck size={20} />, roles: ['admin', 'vendedor'] },
        ],
    },
    {
        title: 'Admin',
        items: [
            { label: 'Facturación', href: '/facturacion', icon: <Receipt size={20} />, roles: ['admin', 'direccion'] },
            { label: 'Usuarios', href: '/configuracion/usuarios', icon: <Users size={20} />, roles: ['admin', 'direccion'] },
        ],
    },
];

const footerNavItems: NavItem[] = [
    { label: 'Configuración', href: '/configuracion/empresa', icon: <Settings size={20} />, roles: ['admin', 'direccion'] },
];

export function AppSidebar() {
    const pathname = usePathname();
    const [collapsed, setCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { role, isLoaded } = useRole();
    const { user } = useUser();

    const sidebarContent = (
        <div className="flex flex-col h-full">
            {/* Logo */}
            <Link
                href="/dashboard"
                className={cn(
                    'flex items-center gap-3 px-4 py-5 border-b border-retarder-gray-200 transition-colors hover:bg-retarder-gray-50',
                    collapsed && 'justify-center px-2'
                )}
            >
                <div className="relative w-10 h-10 flex-shrink-0">
                    <Image
                        src="/logo-retarder.png"
                        alt="Retarder Mexico Logo"
                        fill
                        className="object-contain"
                    />
                </div>
                {!collapsed && (
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="overflow-hidden"
                    >
                        <p className="font-extrabold text-sm text-retarder-black leading-tight tracking-tight">RETARDER</p>
                        <p className="text-[10px] text-retarder-yellow-600 font-bold leading-tight uppercase tracking-widest">MÉXICO</p>
                    </motion.div>
                )}
            </Link>

            {/* Navigation */}
            <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-6">
                {navGroups.map((group) => {
                    // Filter items within group
                    const visibleItems = group.items.filter(item =>
                        !item.roles || item.roles.includes(role as Rol)
                    );

                    if (visibleItems.length === 0) return null;

                    return (
                        <div key={group.title}>
                            {!collapsed && (
                                <p className="px-3 mb-2 text-[10px] font-semibold uppercase tracking-wider text-retarder-gray-400">
                                    {group.title}
                                </p>
                            )}
                            <div className="space-y-0.5">
                                {visibleItems.map((item) => {
                                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                                    return (
                                        <Link
                                            key={item.href}
                                            href={item.href}
                                            onClick={() => setMobileOpen(false)}
                                            className={cn(
                                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                                isActive
                                                    ? 'bg-retarder-red text-white shadow-md shadow-retarder-red/20'
                                                    : 'text-retarder-gray-600 hover:bg-retarder-gray-100 hover:text-retarder-black',
                                                collapsed && 'justify-center px-2'
                                            )}
                                            title={collapsed ? item.label : undefined}
                                        >
                                            <span className={cn(isActive && 'text-white')}>
                                                {item.icon}
                                            </span>
                                            {!collapsed && <span>{item.label}</span>}
                                        </Link>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </nav>

            {/* Footer Navigation (Configuración) */}
            <div className="px-2 pb-4">
                {footerNavItems.filter(item => !item.roles || item.roles.includes(role as Rol)).map((item) => {
                    const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            onClick={() => setMobileOpen(false)}
                            className={cn(
                                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200',
                                isActive
                                    ? 'bg-retarder-red text-white shadow-md shadow-retarder-red/20'
                                    : 'text-retarder-gray-600 hover:bg-retarder-gray-100 hover:text-retarder-black',
                                collapsed && 'justify-center px-2'
                            )}
                            title={collapsed ? item.label : undefined}
                        >
                            <span className={cn(isActive && 'text-white')}>
                                {item.icon}
                            </span>
                            {!collapsed && <span>{item.label}</span>}
                        </Link>
                    );
                })}
            </div>

            {/* Collapse toggle — desktop only */}
            <div className="hidden lg:block border-t border-retarder-gray-200 p-2 space-y-2">
                <div className={cn(
                    "flex items-center gap-3 px-3 py-2 rounded-lg bg-retarder-gray-50 border border-retarder-gray-100",
                    collapsed && "justify-center px-0 bg-transparent border-none"
                )}>
                    <UserButton afterSignOutUrl="/sign-in" />
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="text-xs font-bold text-retarder-black truncate max-w-[120px]">
                                {formatUserName(user?.fullName) || 'Mi Cuenta'}
                            </span>
                            <span className="text-[9px] font-medium text-retarder-red uppercase tracking-tighter">
                                {isLoaded ? role : '...'}
                            </span>
                        </div>
                    )}
                </div>
                <button
                    onClick={() => setCollapsed(!collapsed)}
                    className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-retarder-gray-500 hover:bg-retarder-gray-100 hover:text-retarder-black transition-colors text-sm"
                >
                    {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
                    {!collapsed && <span>Colapsar</span>}
                </button>
            </div>
        </div>
    );

    return (
        <>
            {/* Mobile hamburger */}
            <button
                onClick={() => setMobileOpen(true)}
                className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-lg bg-white shadow-md border border-retarder-gray-200"
                aria-label="Abrir menú"
            >
                <Menu size={20} />
            </button>

            {/* Mobile overlay */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setMobileOpen(false)}
                            className="lg:hidden fixed inset-0 bg-black/40 z-40"
                        />
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: 'spring', damping: 25, stiffness: 250 }}
                            className="lg:hidden fixed left-0 top-0 bottom-0 w-[280px] bg-white z-50 shadow-2xl"
                        >
                            <button
                                onClick={() => setMobileOpen(false)}
                                className="absolute top-4 right-4 p-1 rounded-md hover:bg-retarder-gray-100"
                                aria-label="Cerrar menú"
                            >
                                <X size={18} />
                            </button>
                            {sidebarContent}
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>

            {/* Desktop sidebar */}
            <motion.aside
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="hidden lg:flex flex-col bg-white border-r border-retarder-gray-200 h-screen sticky top-0 overflow-hidden"
            >
                {sidebarContent}
            </motion.aside>
        </>
    );
}
