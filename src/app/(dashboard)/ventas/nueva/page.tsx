'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Package, Wrench, ClipboardCheck, ArrowRight } from 'lucide-react';

const TIPOS_COTIZACION = [
    {
        title: 'Frenos (Retarders)',
        description: 'Cotiza retarders electromagnéticos e hidráulicos con precios en USD/MXN, incluye cardanes, soportería y material eléctrico.',
        icon: <Package size={32} />,
        href: '/ventas/frenos',
        gradient: 'from-red-500 to-red-700',
        bgLight: 'bg-red-50',
        borderColor: 'border-red-200',
        hoverBorder: 'hover:border-red-400',
        iconBg: 'bg-red-100 text-red-600',
    },
    {
        title: 'Refacciones',
        description: 'Cotiza refacciones individuales: cardanes, crucetas, hules, tornillería, placas y más — con precios actualizados.',
        icon: <Wrench size={32} />,
        href: '/ventas/refacciones',
        gradient: 'from-blue-500 to-blue-700',
        bgLight: 'bg-blue-50',
        borderColor: 'border-blue-200',
        hoverBorder: 'hover:border-blue-400',
        iconBg: 'bg-blue-100 text-blue-600',
    },
    {
        title: 'Servicios',
        description: 'Cotiza mano de obra: instalación, mantenimiento preventivo/correctivo, diagnóstico y servicios técnicos especializados.',
        icon: <ClipboardCheck size={32} />,
        href: '/ventas/servicios',
        gradient: 'from-emerald-500 to-emerald-700',
        bgLight: 'bg-emerald-50',
        borderColor: 'border-emerald-200',
        hoverBorder: 'hover:border-emerald-400',
        iconBg: 'bg-emerald-100 text-emerald-600',
    },
];

export default function NuevaCotizacionPage() {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-bold text-retarder-black">Nueva Cotización</h2>
                <p className="text-sm text-retarder-gray-500 mt-1">
                    Selecciona el tipo de cotización que deseas crear
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {TIPOS_COTIZACION.map((tipo, index) => (
                    <Link key={tipo.href} href={tipo.href}>
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className={`group relative overflow-hidden rounded-2xl border-2 ${tipo.borderColor} ${tipo.hoverBorder} ${tipo.bgLight} p-6 cursor-pointer transition-all duration-300 hover:shadow-xl hover:-translate-y-1`}
                        >
                            {/* Gradient accent bar */}
                            <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${tipo.gradient}`} />

                            {/* Icon */}
                            <div className={`w-14 h-14 rounded-xl ${tipo.iconBg} flex items-center justify-center mb-4`}>
                                {tipo.icon}
                            </div>

                            {/* Content */}
                            <h3 className="text-lg font-bold text-retarder-black mb-2">
                                {tipo.title}
                            </h3>
                            <p className="text-sm text-retarder-gray-600 leading-relaxed mb-4">
                                {tipo.description}
                            </p>

                            {/* CTA */}
                            <div className="flex items-center gap-2 text-sm font-semibold text-retarder-red group-hover:gap-3 transition-all">
                                <span>Cotizar ahora</span>
                                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                            </div>
                        </motion.div>
                    </Link>
                ))}
            </div>

            {/* Quick tip */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.4 }}
                className="bg-retarder-gray-50 rounded-xl border border-retarder-gray-200 p-4 flex items-start gap-3"
            >
                <div className="w-8 h-8 rounded-lg bg-retarder-gray-200 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="text-sm">💡</span>
                </div>
                <div>
                    <p className="text-sm font-semibold text-retarder-black">Tip</p>
                    <p className="text-xs text-retarder-gray-500">
                        Las cotizaciones aceptadas se pueden convertir automáticamente en Órdenes de Servicio desde la sección &quot;Mis Cotizaciones&quot;.
                    </p>
                </div>
            </motion.div>
        </div>
    );
}
