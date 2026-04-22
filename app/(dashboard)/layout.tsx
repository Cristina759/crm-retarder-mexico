'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  LayoutDashboard, ShoppingCart, Wrench, FileText, ClipboardList,
  TrendingUp, ClipboardCheck, Settings, ChevronLeft, Receipt, FileMinus, Building2,
} from 'lucide-react';
import { useState } from 'react';

const NAV_SECTIONS = [
  {
    label: 'GENERAL',
    items: [
      { href: '/dashboard',             label: 'Dashboard',               icon: LayoutDashboard },
    ],
  },
  {
    label: 'VENTAS',
    items: [
      { href: '/cotizador-frenos',      label: 'Cotizador de Frenos',      icon: ShoppingCart  },
      { href: '/cotizador-refacciones', label: 'Cotizador de Refacciones', icon: Wrench        },
      { href: '/cotizador-servicios',   label: 'Cotizador de Servicios',   icon: FileText      },
      { href: '/cotizaciones',          label: 'Mis Cotizaciones',         icon: ClipboardList },
    ],
  },
  {
    label: 'OPERACIONES',
    items: [
      { href: '/oportunidades',         label: 'Pipeline Comercial',       icon: TrendingUp     },
      { href: '/ordenes-servicio',      label: 'Ordenes de Servicio',      icon: ClipboardCheck },
      { href: '/clientes',              label: 'Clientes',                 icon: Building2      },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { href: '/facturacion',           label: 'Facturación',              icon: Receipt        },
      { href: '/notas-credito',         label: 'Notas de Crédito',         icon: FileMinus      },
      { href: '/configuracion',         label: 'Configuración',            icon: Settings       },
    ],
  },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname   = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const { user }   = useUser();
  const rol        = (user?.publicMetadata?.role as string) ?? '';
  const esTecnico  = rol === 'tecnico';

  const navSections = esTecnico
    ? [{ label: 'OPERACIONES', items: [{ href: '/ordenes-servicio', label: 'Ordenes de Servicio', icon: ClipboardCheck }] }]
    : NAV_SECTIONS.filter(s => s.label !== 'ADMIN' || rol === 'admin' || rol === 'administrativo');

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className={`flex flex-col bg-[#0f2d55] transition-all duration-200 flex-shrink-0 h-full ${
        collapsed ? 'w-16' : 'w-60'
      }`}>

        {/* Logo */}
        <div className={`flex items-center gap-3 px-4 py-4 border-b border-blue-900 ${collapsed ? 'justify-center' : ''}`}>
          <Image
            src="/logo.png"
            alt="Retarder México"
            width={44}
            height={44}
            className="flex-shrink-0 rounded-full"
            onError={(e) => {
              // fallback si no existe el archivo
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {!collapsed && (
            <div className="leading-tight">
              <p className="text-white text-sm tracking-wide">
                <span className="font-black">R</span><span className="font-semibold">ETARDER</span>
              </p>
              <p className="text-yellow-400 text-[11px] font-bold uppercase tracking-widest">México</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2">
          {navSections.map(section => (
            <div key={section.label}>
              {!collapsed && (
                <p className="text-[10px] font-bold text-white opacity-60 uppercase tracking-widest px-2 mb-1">
                  {section.label}
                </p>
              )}
              <ul className="space-y-0.5">
                {section.items.map(item => {
                  const active = pathname === item.href || pathname.startsWith(item.href + '/');
                  const Icon   = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        title={collapsed ? item.label : undefined}
                        className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                          active
                            ? 'bg-yellow-400 text-[#0f2d55] font-bold'
                            : 'text-white hover:bg-blue-800'
                        } ${collapsed ? 'justify-center' : ''}`}
                      >
                        <Icon size={17} className="flex-shrink-0" />
                        {!collapsed && <span className="truncate">{item.label}</span>}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Footer: usuario + colapsar */}
        <div className="border-t border-blue-900 px-3 py-3 space-y-2">
          {!collapsed && (
            <div className="flex items-center gap-2 px-1">
              <UserButton />
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.firstName ?? 'Usuario'}</p>
                <p className="text-[10px] text-blue-300 capitalize">{rol || '—'}</p>
              </div>
            </div>
          )}
          {collapsed && (
            <div className="flex justify-center">
              <UserButton />
            </div>
          )}
          <button
            onClick={() => setCollapsed(x => !x)}
            className="w-full flex items-center justify-center gap-1.5 text-[11px] text-blue-300 hover:text-white transition-colors py-1"
          >
            <ChevronLeft size={13} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
            {!collapsed && 'Colapsar'}
          </button>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 min-w-0 overflow-y-auto">
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
