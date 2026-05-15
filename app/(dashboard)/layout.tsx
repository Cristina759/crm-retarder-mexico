'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { UserButton, useUser } from '@clerk/nextjs';
import {
  LayoutDashboard, ShoppingCart, Wrench, FileText, ClipboardList,
  TrendingUp, ClipboardCheck, Settings, ChevronLeft, Receipt, FileMinus, Building2,
  ChevronDown, Hammer, Package, Users, RefreshCw, Menu, X as CloseIcon, Download
} from 'lucide-react';
import { useState, useEffect } from 'react';
import InstallPWA from '@/components/InstallPWA';

const NAV_SECTIONS = [
  {
    label: 'GENERAL',
    items: [
      { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
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
      { href: '/oportunidades',   label: 'Pipeline Comercial', icon: TrendingUp     },
      { href: '/ordenes-servicio', label: 'Órdenes de Servicio', icon: ClipboardCheck },
      { href: '/clientes',        label: 'Clientes',           icon: Building2      },
    ],
  },
  {
    label: 'ADMIN',
    items: [
      { href: '/facturacion',    label: 'Facturación',    icon: Receipt   },
      { href: '/notas-credito',  label: 'Notas de Crédito', icon: FileMinus },
      { href: '/usuarios',       label: 'Usuarios / Personal', icon: Users },
      { href: '/configuracion',  label: 'Configuración',  icon: Settings  },
    ],
  },
];

const HERRAMIENTAS_ITEMS = [
  { href: '/catalogo-mano-de-obra',  label: 'Catálogo Mano de Obra',  icon: Hammer  },
  { href: '/catalogo-refacciones',   label: 'Catálogo Refacciones',   icon: Package },
];

function TipoCambioSidebar({ collapsed }: { collapsed: boolean }) {
  const [tc, setTc] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchTC = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/tipo-cambio-dof');
      const data = await res.json();
      if (data.tipoCambio) setTc(data.tipoCambio);
    } catch {
      setTc(17.2400);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTC();
  }, []);

  if (collapsed) return null;

  return (
    <div className="mx-2 mb-4 p-3 bg-blue-900/40 rounded-2xl border border-blue-800/50">
      <div className="flex items-center justify-between mb-1">
        <p className="text-[10px] font-bold text-blue-300 uppercase tracking-widest">USD / MXN</p>
        <button onClick={fetchTC} disabled={loading} className="text-blue-400 hover:text-white transition-colors">
          <RefreshCw size={10} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>
      <p className="text-lg font-black text-white leading-none">
        ${tc ? tc.toFixed(4) : '—'}
      </p>
      <p className="text-[9px] text-blue-400 mt-1 font-medium italic">Sincronizado con DOF</p>
    </div>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname  = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [herramientasOpen, setHerramientasOpen] = useState(
    HERRAMIENTAS_ITEMS.some(i => pathname.startsWith(i.href))
  );
  const { user }  = useUser();
  const rol       = (user?.publicMetadata?.role as string) ?? '';
  const esTecnico = rol === 'tecnico';

  const navSections = esTecnico
    ? [{ label: 'OPERACIONES', items: [{ href: '/ordenes-servicio', label: 'Órdenes de Servicio', icon: ClipboardCheck }] }]
    : NAV_SECTIONS.filter(s => s.label !== 'ADMIN' || rol === 'admin' || rol === 'administrativo');

  const showHerramientas = !esTecnico && (rol === 'admin' || rol === 'administrativo');

  // Cerrar móvil al cambiar de ruta
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  const SidebarContent = (
    <aside className={`flex flex-col bg-[#0f2d55] transition-all duration-200 h-full ${collapsed ? 'w-16' : 'w-60'}`}>
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-4 border-b border-blue-900 ${collapsed ? 'justify-center' : ''}`}>
        <Image src="/logo.png" alt="Retarder México" width={44} height={44}
          className="flex-shrink-0 rounded-full"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
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
      <nav className="flex-1 overflow-y-auto py-4 space-y-5 px-2 custom-scrollbar">
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
                    <Link href={item.href} title={collapsed ? item.label : undefined}
                      className={`flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                        active ? 'bg-yellow-400 text-[#0f2d55] font-bold' : 'text-white hover:bg-blue-800'
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

        {showHerramientas && (
          <div>
            {!collapsed && (
              <p className="text-[10px] font-bold text-white opacity-60 uppercase tracking-widest px-2 mb-1">
                HERRAMIENTAS
              </p>
            )}
            <ul className="space-y-0.5">
              <li>
                <button
                  onClick={() => setHerramientasOpen(v => !v)}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-colors text-white hover:bg-blue-800 ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? 'Catálogos' : undefined}
                >
                  <Wrench size={17} className="flex-shrink-0" />
                  {!collapsed && (
                    <>
                      <span className="flex-1 truncate text-left">Catálogos</span>
                      <ChevronDown size={13} className={`transition-transform ${herramientasOpen ? 'rotate-180' : ''}`} />
                    </>
                  )}
                </button>
                {herramientasOpen && !collapsed && (
                  <ul className="mt-0.5 ml-4 space-y-0.5 border-l border-blue-700 pl-2">
                    {HERRAMIENTAS_ITEMS.map(item => {
                      const active = pathname.startsWith(item.href);
                      const Icon   = item.icon;
                      return (
                        <li key={item.href}>
                          <Link href={item.href}
                            className={`flex items-center gap-2.5 px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              active ? 'bg-yellow-400 text-[#0f2d55] font-bold' : 'text-blue-200 hover:bg-blue-800 hover:text-white'
                            }`}
                          >
                            <Icon size={14} className="flex-shrink-0" />
                            <span className="truncate">{item.label}</span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </li>
            </ul>
          </div>
        )}
        <TipoCambioSidebar collapsed={collapsed} />
      </nav>

      {/* Footer */}
      <div className="border-t border-blue-900 px-3 py-3 space-y-3">
        {!collapsed && <InstallPWA />}
        {!collapsed && (
          <div className="flex items-center gap-2 px-1">
            <UserButton />
            <div className="min-w-0">
              <p className="text-xs font-semibold text-white truncate">{user?.firstName ?? 'Usuario'}</p>
              <p className="text-[10px] text-blue-300 capitalize">{rol || '—'}</p>
            </div>
          </div>
        )}
        {collapsed && <div className="flex justify-center"><UserButton /></div>}
        <button onClick={() => setCollapsed(x => !x)}
          className="hidden lg:flex w-full items-center justify-center gap-1.5 text-[11px] text-blue-300 hover:text-white transition-colors py-1"
        >
          <ChevronLeft size={13} className={`transition-transform ${collapsed ? 'rotate-180' : ''}`} />
          {!collapsed && 'Colapsar'}
        </button>
      </div>
    </aside>
  );

  return (
    <div className="h-screen bg-gray-100 flex overflow-hidden relative">
      {/* Sidebar Desktop */}
      <div className="hidden lg:flex h-full">
        {SidebarContent}
      </div>

      {/* Mobile Drawer (Overlay) */}
      <div className={`fixed inset-0 z-50 lg:hidden transition-opacity duration-300 ${mobileOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
        <div className={`absolute inset-y-0 left-0 transition-transform duration-300 ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          {SidebarContent}
          <button 
            onClick={() => setMobileOpen(false)}
            className="absolute top-4 right-[-48px] p-2 text-white hover:text-yellow-400"
          >
            <CloseIcon size={24} />
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden">
        {/* Header Móvil */}
        <header className="lg:hidden h-14 bg-[#0f2d55] border-b border-blue-900 flex items-center justify-between px-4 shrink-0">
          <div className="flex items-center gap-2">
            <Image src="/logo.png" alt="Logo" width={32} height={32} className="rounded-full" />
            <span className="text-white font-black text-sm tracking-tighter italic">RETARDER</span>
          </div>
          <button 
            onClick={() => setMobileOpen(true)}
            className="p-2 text-white hover:bg-blue-800 rounded-xl"
          >
            <Menu size={20} />
          </button>
        </header>

        <main className="flex-1 overflow-y-auto p-4 lg:p-6 custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
