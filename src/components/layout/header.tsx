'use client';

import { Bell, Search, Building2, Check, CheckCheck } from 'lucide-react';
import { useState, useMemo, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useRole } from '@/hooks/useRole';
import { useUser } from '@clerk/nextjs';
import { createClient } from '@/lib/supabase/client';

const supabase = createClient();

interface HeaderProps {
    title?: string;
    subtitle?: string;
}

interface Notification {
    id: string;
    clerk_user_id: string | null;
    titulo: string;
    mensaje: string;
    leida: boolean;
    tipo: 'info' | 'success' | 'warning' | 'error';
    link_url: string | null;
    created_at: string;
}

const TIPO_COLORS = {
    info: 'bg-blue-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    error: 'bg-retarder-red',
};

function formatTimeAgo(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    if (diff < 0) return 'Justo ahora';

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `Hace ${days} d`;
    if (hours > 0) return `Hace ${hours} h`;
    if (minutes > 0) return `Hace ${minutes} m`;
    return 'Justo ahora';
}

export function Header({ title = 'Dashboard', subtitle }: HeaderProps) {
    const [showNotifications, setShowNotifications] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const { isCliente } = useRole();
    const { user } = useUser();

    const fetchNotifications = useCallback(async () => {
        if (!user?.id) return;

        try {
            const { data, error } = await supabase
                .from('notificaciones')
                .select('*')
                .eq('leida', false)
                .or(`clerk_user_id.eq.${user.id},clerk_user_id.is.null`)
                .order('created_at', { ascending: false })
                .limit(20);

            if (!error && data) {
                setNotifications(data);
            }
        } catch (error) {
            console.error('Error fetching real notifications:', error);
        }
    }, [user?.id]);

    useEffect(() => {
        if (!user?.id) return;

        fetchNotifications();

        const channel = supabase.channel('realtime_notifs_' + user.id)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'notificaciones'
            }, (payload) => {
                const newNotif = payload.new as Notification;
                if (newNotif.clerk_user_id === user.id || newNotif.clerk_user_id === null) {
                    setNotifications(prev => [newNotif, ...prev]);
                }
            })
            .on('postgres_changes', {
                event: 'UPDATE',
                schema: 'public',
                table: 'notificaciones'
            }, (payload) => {
                const updated = payload.new as Notification;
                if (updated.leida) {
                    setNotifications(prev => prev.filter(n => n.id !== updated.id));
                }
            })
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user?.id, fetchNotifications]);

    const markAsRead = async (e: React.MouseEvent, id: string) => {
        e.stopPropagation();
        setNotifications(prev => prev.filter(n => n.id !== id));
        await supabase.from('notificaciones').update({ leida: true }).eq('id', id);
    };

    const markAllAsRead = async () => {
        const ids = notifications.map(n => n.id);
        setNotifications([]);
        if (ids.length > 0) {
            await supabase.from('notificaciones').update({ leida: true }).in('id', ids);
        }
    };

    const clientCompany = useMemo(() => {
        if (!isCliente) return null;
        return (user?.publicMetadata as { company?: string })?.company || 'Sin Empresa Asignada';
    }, [isCliente, user]);

    return (
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-retarder-gray-200">
            <div className="flex items-center justify-between h-16 px-4 lg:px-8">
                {/* Title section */}
                <div className="ml-14 lg:ml-0 flex flex-col">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-bold text-retarder-black">{title}</h1>
                        {isCliente && (
                            <div className="flex items-center gap-1.5 px-2 py-0.5 bg-retarder-red/10 rounded-full border border-retarder-red/20 shadow-sm">
                                <Building2 size={10} className="text-retarder-red" />
                                <span className="text-[10px] font-black text-retarder-red uppercase tracking-wider truncate max-w-[120px] sm:max-w-[200px]">
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
                            {notifications.length > 0 && (
                                <span className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-retarder-red border-2 border-white rounded-full animate-pulse" />
                            )}
                        </button>

                        <AnimatePresence>
                            {showNotifications && (
                                <motion.div
                                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    exit={{ opacity: 0, y: 8, scale: 0.95 }}
                                    transition={{ duration: 0.15 }}
                                    className="absolute right-0 top-12 w-80 bg-white border border-retarder-gray-200 rounded-xl shadow-xl p-4 max-h-[80vh] flex flex-col"
                                >
                                    <div className="flex items-center justify-between mb-3 border-b border-retarder-gray-100 pb-2 shrink-0">
                                        <h3 className="font-semibold text-sm">Notificaciones ({notifications.length})</h3>
                                        {notifications.length > 0 && (
                                            <button
                                                onClick={markAllAsRead}
                                                className="text-[10px] flex items-center gap-1 font-bold text-retarder-gray-400 hover:text-blue-600 transition-colors"
                                                title="Marcar todas como leídas"
                                            >
                                                <CheckCheck size={14} /> Leídas
                                            </button>
                                        )}
                                    </div>
                                    <div className="space-y-1 overflow-y-auto pr-1 kanban-scroll flex-1 -mr-2">
                                        {notifications.length > 0 ? (
                                            notifications.map(n => (
                                                <div key={n.id} className="group flex gap-3 p-2.5 rounded-lg hover:bg-retarder-gray-50 transition-colors relative">
                                                    <div className={cn('w-2 h-2 rounded-full mt-1.5 flex-shrink-0', TIPO_COLORS[n.tipo] || 'bg-blue-500')} />
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-xs font-bold text-retarder-gray-800 break-words">{n.titulo}</p>
                                                        <p className="text-[10px] text-retarder-gray-500 break-words mt-0.5 leading-snug">{n.mensaje}</p>
                                                        <p className="text-[9px] font-mono text-retarder-gray-400 mt-1">{formatTimeAgo(n.created_at)}</p>
                                                    </div>
                                                    <button
                                                        onClick={(e) => markAsRead(e, n.id)}
                                                        className="absolute right-2 top-2 p-1.5 rounded-lg text-retarder-gray-300 hover:text-blue-600 hover:bg-blue-50 opacity-0 group-hover:opacity-100 transition-all focus:opacity-100"
                                                        title="Marcar leída"
                                                    >
                                                        <Check size={14} />
                                                    </button>
                                                </div>
                                            ))
                                        ) : (
                                            <p className="text-xs text-retarder-gray-400 text-center py-6">Estás al día.<br />No hay notificaciones nuevas.</p>
                                        )}
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
