'use client';

import { Bell, Search, Building2 } from 'lucide-react';
import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { useUser } from '@clerk/nextjs';

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

export function Header({ title = 'Dashboard', subtitle }: HeaderProps) {
    const [showNotifications, setShowNotifications] = useState(false);
    const { role, isCliente } = useRole();
    const { user } = useUser();

    const clientCompany = useMemo(() => {
        if (!isCliente) return null;
        return (user?.publicMetadata as { company?: string })?.company || 'Sin Empresa Asignada';
    }, [isCliente, user]);

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-retarder-gray-200">
            <div className="flex items-center justify-between h-16 px-4 lg:px-8">
                {/* Title section */}
                <div className="ml-12 lg:ml-0 flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-retarder-black">{title}</h1>
                        {isCliente && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-retarder-red/10 rounded-full border border-retarder-red/20 shadow-sm">
                                <Building2 size={10} className="text-retarder-red" />
                                <span className="text-[10px] font-black text-retarder-red uppercase tracking-wider">
                                    {clientCompany}
                                </span>
                            </div>
                        )}
                    </div>
                    {subtitle && (
                        <p className="text-xs text-retarder-gray-500">{subtitle}</p>
                    )}
                </div>

                {/* Right section */}
                <div className="flex items-center gap-3">
                    {/* Search */}
                    <div className="hidden md:flex items-center gap-2 bg-retarder-gray-100 rounded-lg px-3 py-2 w-64">
                        <Search size={16} className="text-retarder-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar órdenes, clientes..."
                            className="bg-transparent border-none outline-none text-sm text-retarder-gray-700 placeholder-retarder-gray-400 w-full"
                        />
                        <kbd className="hidden lg:inline-flex items-center px-1.5 py-0.5 text-[10px] font-medium text-retarder-gray-400 bg-white rounded border border-retarder-gray-200">
                            ⌘K
                        </kbd>
                    </div>

                    {/* Notifications */}
                    <div className="relative">
                        <button
                            onClick={() => setShowNotifications(!showNotifications)}
                            className="relative p-2 rounded-lg hover:bg-retarder-gray-100 transition-colors"
                        >
                            <Bell size={20} className="text-retarder-gray-600" />
                            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-retarder-red rounded-full" />
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-12 w-80 bg-white border border-retarder-gray-200 rounded-xl shadow-xl p-4"
                                >
                                    <h3 className="font-semibold text-sm mb-3">Notificaciones</h3>
                                    <div className="space-y-3">
                                        <NotificationItem
                                            title="Nueva orden recibida"
                                            description="OS-00042 — TRANSPORTES DEL NORTE"
                                            time="Hace 5 min"
                                            color="bg-blue-500"
                                        />
                                        <NotificationItem
                                            title="Pago vencido"
                                            description="Factura FAC-0015 — 32 días sin pago"
                                            time="Hace 1 hora"
                                            color="bg-retarder-red"
                                        />
                                        <NotificationItem
                                            title="Stock bajo"
                                            description="Crucetas — 3 unidades restantes"
                                            time="Hace 3 horas"
                                            color="bg-retarder-yellow"
                                        />
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>

                </div>
            </div>
        </header>
    );
}

function NotificationItem({
    title,
    description,
    time,
    color,
}: {
    title: string;
    description: string;
    time: string;
    color: string;
}) {
    return (
        <div className="flex gap-3 p-2 rounded-lg hover:bg-retarder-gray-50 cursor-pointer transition-colors">
            <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', color)} />
            <div className="min-w-0">
                <p className="text-sm font-medium text-retarder-gray-800 truncate">{title}</p>
                <p className="text-xs text-retarder-gray-500 truncate">{description}</p>
                <p className="text-[10px] text-retarder-gray-400 mt-0.5">{time}</p>
            </div>
        </div>
    );
}
