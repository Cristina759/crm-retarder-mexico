'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  Loader2, AlertCircle, ArrowLeft, Building2, Users, Phone, Mail,
  MapPin, ClipboardCheck, FileText, Receipt, FileMinus, Pencil,
  X, Check, ChevronRight, TrendingUp, Calendar,
} from 'lucide-react';
import { obtenerClienteDetalle, actualizarCliente, type ClienteDetalle } from '@/app/actions/clientes';

// ── Helpers ───────────────────────────────────────────────────────────────────
function fmtMXN(n: number | null) {
  if (!n) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}
function getInitials(nombre: string | null) {
  if (!nombre) return '?';
  const words = nombre.split(' ').filter(w => w.length > 2);
  return (words.slice(0, 2).map(w => w[0]).join('') || nombre[0]).toUpperCase();
}

const ESTADO_OS_CFG: Record<string, { label: string; color: string }> = {
  tecnico_asignado:        { label: 'Técnico asignado',     color: 'bg-gray-100 text-gray-600' },
  servicio_programado:     { label: 'Programado',           color: 'bg-blue-100 text-blue-700' },
  tecnico_en_contacto:     { label: 'En contacto',          color: 'bg-indigo-100 text-indigo-700' },
  servicio_en_proceso:     { label: 'En proceso',           color: 'bg-yellow-100 text-yellow-700' },
  servicio_concluido:      { label: 'Concluido',            color: 'bg-green-100 text-green-700' },
  documentacion_entregada: { label: 'Doc. entregada',       color: 'bg-purple-100 text-purple-700' },
  facturado:               { label: 'Facturado',            color: 'bg-orange-100 text-orange-700' },
  pagado:                  { label: 'Pagado',               color: 'bg-emerald-100 text-emerald-700' },
};
const ESTADO_COT_CFG: Record<string, { label: string; color: string }> = {
  borrador:  { label: 'Borrador',  color: 'bg-gray-100 text-gray-500' },
  enviada:   { label: 'Enviada',   color: 'bg-blue-100 text-blue-700' },
  aceptada:  { label: 'Aceptada', color: 'bg-green-100 text-green-700' },
  rechazada: { label: 'Rechazada', color: 'bg-red-100 text-red-600' },
  vencida:   { label: 'Vencida',   color: 'bg-yellow-100 text-yellow-700' },
};

// ── Field editable ────────────────────────────────────────────────────────────
function EditField({ label, value, onChange, placeholder }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
      <input
        value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400 bg-white"
      />
    </div>
  );
}

// ── Sección de información editable ──────────────────────────────────────────
function SeccionInfo({ cliente, onUpdated }: { cliente: ClienteDetalle; onUpdated: (c: ClienteDetalle) => void }) {
  const [editando, setEditando] = useState(false);
  const [saving,   setSaving]   = useState(false);

  const [nombreComercial, setNombreComercial] = useState(cliente.nombre_comercial ?? '');
  const [razonSocial,     setRazonSocial]     = useState(cliente.razon_social ?? '');
  const [rfc,             setRfc]             = useState(cliente.rfc ?? '');
  const [sucursal,        setSucursal]        = useState(cliente.sucursal ?? '');
  const [c1nombre, setC1nombre] = useState(cliente.contacto1_nombre ?? cliente.persona_encargada ?? '');
  const [c1cargo,  setC1cargo]  = useState(cliente.contacto1_cargo ?? '');
  const [c2nombre, setC2nombre] = useState(cliente.contacto2_nombre ?? '');
  const [c2cargo,  setC2cargo]  = useState(cliente.contacto2_cargo ?? '');
  const [tel1, setTel1] = useState(cliente.telefono ?? '');
  const [tel2, setTel2] = useState(cliente.telefono2 ?? '');
  const [tel3, setTel3] = useState(cliente.telefono3 ?? '');
  const [em1,  setEm1]  = useState(cliente.email ?? '');
  const [em2,  setEm2]  = useState(cliente.email2 ?? '');
  const [dir,  setDir]  = useState(cliente.direccion_fiscal ?? '');
  const [ciu,  setCiu]  = useState(cliente.ciudad ?? '');
  const [est,  setEst]  = useState(cliente.estado ?? '');
  const [cp,   setCp]   = useState(cliente.cp ?? '');

  const handleSave = async () => {
    setSaving(true);
    const datos = {
      nombre_comercial: nombreComercial || null, razon_social: razonSocial || null,
      rfc: rfc || null, sucursal: sucursal || null,
      contacto1_nombre: c1nombre || null, contacto1_cargo: c1cargo || null,
      contacto2_nombre: c2nombre || null, contacto2_cargo: c2cargo || null,
      telefono: tel1 || null, telefono2: tel2 || null, telefono3: tel3 || null,
      email: em1 || null, email2: em2 || null,
      direccion_fiscal: dir || null, ciudad: ciu || null, estado: est || null, cp: cp || null,
    };
    await actualizarCliente(cliente.id, datos);
    onUpdated({ ...cliente, ...datos });
    setSaving(false);
    setEditando(false);
  };

  const telefonos = [tel1, tel2, tel3].filter(Boolean);
  const emails    = [em1, em2].filter(Boolean);

  if (!editando) return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6">
      <div className="flex items-start justify-between mb-5">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[#0f2d55] flex items-center justify-center flex-shrink-0">
            <span className="text-lg font-black text-white">{getInitials(cliente.nombre_comercial)}</span>
          </div>
          <div>
            <h2 className="text-lg font-black text-[#0f2d55]">{cliente.nombre_comercial ?? '—'}</h2>
            {cliente.razon_social && <p className="text-xs text-gray-400 mt-0.5">{cliente.razon_social}</p>}
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {cliente.rfc && <span className="text-[10px] font-mono bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">{cliente.rfc}</span>}
              {cliente.sucursal && <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded-lg flex items-center gap-1"><MapPin size={8}/>{cliente.sucursal}</span>}
            </div>
          </div>
        </div>
        <button onClick={() => setEditando(true)} className="flex items-center gap-1.5 px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
          <Pencil size={12}/> Editar
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Contactos */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1"><Users size={10}/>Contactos</p>
          {(cliente.contacto1_nombre || cliente.persona_encargada) && (
            <div className="border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-bold mb-1">PRINCIPAL</p>
              <p className="text-sm font-semibold text-gray-800">{cliente.contacto1_nombre || cliente.persona_encargada}</p>
              {cliente.contacto1_cargo && <p className="text-xs text-gray-400">{cliente.contacto1_cargo}</p>}
            </div>
          )}
          {cliente.contacto2_nombre && (
            <div className="border border-gray-100 rounded-xl p-3">
              <p className="text-[10px] text-gray-400 font-bold mb-1">SUCURSAL</p>
              <p className="text-sm font-semibold text-gray-800">{cliente.contacto2_nombre}</p>
              {cliente.contacto2_cargo && <p className="text-xs text-gray-400">{cliente.contacto2_cargo}</p>}
            </div>
          )}
          {!cliente.contacto1_nombre && !cliente.persona_encargada && !cliente.contacto2_nombre && (
            <p className="text-xs text-gray-300 italic">Sin contactos registrados</p>
          )}
        </div>

        {/* Teléfonos y correos */}
        <div className="space-y-3">
          <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1"><Phone size={10}/>Comunicación</p>
          {telefonos.length > 0 ? telefonos.map((t, i) => (
            <div key={i} className="flex items-center gap-2">
              <Phone size={12} className="text-gray-300 flex-shrink-0"/>
              <span className="text-sm text-gray-700">{t}</span>
            </div>
          )) : <p className="text-xs text-gray-300 italic">Sin teléfonos</p>}
          <div className="pt-1 border-t border-gray-100"/>
          {emails.length > 0 ? emails.map((e, i) => (
            <div key={i} className="flex items-center gap-2">
              <Mail size={12} className="text-gray-300 flex-shrink-0"/>
              <span className="text-sm text-gray-600 truncate">{e}</span>
            </div>
          )) : <p className="text-xs text-gray-300 italic">Sin correos</p>}
        </div>

        {/* Ubicación */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1"><MapPin size={10}/>Ubicación</p>
          {cliente.direccion_fiscal && <p className="text-sm text-gray-700">{cliente.direccion_fiscal}</p>}
          {(cliente.ciudad || cliente.estado) && (
            <p className="text-sm text-gray-600">{[cliente.ciudad, cliente.estado, cliente.cp].filter(Boolean).join(', ')}</p>
          )}
          {!cliente.direccion_fiscal && !cliente.ciudad && <p className="text-xs text-gray-300 italic">Sin dirección</p>}
        </div>
      </div>
    </div>
  );

  // Modo edición
  return (
    <div className="bg-white rounded-2xl border border-yellow-300 p-6 space-y-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-black text-[#0f2d55]">Editando ficha</p>
        <div className="flex gap-2">
          <button onClick={() => setEditando(false)} className="px-3 py-1.5 border border-gray-200 rounded-xl text-xs font-semibold text-gray-600 hover:bg-gray-50">Cancelar</button>
          <button onClick={handleSave} disabled={saving} className="px-3 py-1.5 bg-[#0f2d55] text-white rounded-xl text-xs font-bold flex items-center gap-1 disabled:opacity-50">
            {saving ? <Loader2 size={12} className="animate-spin"/> : <Check size={12}/>} Guardar
          </button>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <EditField label="Nombre comercial *" value={nombreComercial} onChange={setNombreComercial}/>
        <EditField label="Razón social" value={razonSocial} onChange={setRazonSocial}/>
        <EditField label="RFC" value={rfc} onChange={setRfc} placeholder="CDI110311L86"/>
        <EditField label="Sucursal" value={sucursal} onChange={setSucursal} placeholder="Ej. TIZAPA"/>
      </div>
      <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Contacto principal</p>
          <EditField label="Nombre" value={c1nombre} onChange={setC1nombre}/>
          <EditField label="Cargo" value={c1cargo} onChange={setC1cargo} placeholder="Ej. Gerente de compras"/>
        </div>
        <div className="space-y-3">
          <p className="text-[10px] font-bold text-gray-400 uppercase">Contacto sucursal</p>
          <EditField label="Nombre" value={c2nombre} onChange={setC2nombre}/>
          <EditField label="Cargo" value={c2cargo} onChange={setC2cargo} placeholder="Ej. Jefe de mantenimiento"/>
        </div>
      </div>
      <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <EditField label="Teléfono 1" value={tel1} onChange={setTel1}/>
        <EditField label="Teléfono 2" value={tel2} onChange={setTel2}/>
        <EditField label="Teléfono 3" value={tel3} onChange={setTel3}/>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <EditField label="Correo 1" value={em1} onChange={setEm1}/>
        <EditField label="Correo 2" value={em2} onChange={setEm2}/>
      </div>
      <div className="border-t border-gray-100 pt-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="md:col-span-2"><EditField label="Dirección" value={dir} onChange={setDir}/></div>
        <EditField label="C.P." value={cp} onChange={setCp}/>
        <EditField label="Ciudad" value={ciu} onChange={setCiu}/>
        <EditField label="Estado" value={est} onChange={setEst}/>
      </div>
    </div>
  );
}

// ── Página ────────────────────────────────────────────────────────────────────
export default function ClienteDetallePage() {
  const { id } = useParams<{ id: string }>();
  const router  = useRouter();
  const [cliente,  setCliente]  = useState<ClienteDetalle | null>(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState<string | null>(null);
  const [tab,      setTab]      = useState<'os' | 'cots' | 'facturas'>('os');

  useEffect(() => {
    obtenerClienteDetalle(id).then(({ data, error: e }) => {
      if (e || !data) setError(e ?? 'Error');
      else setCliente(data);
      setLoading(false);
    });
  }, [id]);

  if (loading) return <div className="flex items-center justify-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-[#0f2d55]"/></div>;
  if (error || !cliente) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-8 h-8 text-red-500"/>
      <p className="text-red-600 font-semibold">{error}</p>
      <button onClick={() => router.back()} className="text-sm text-gray-500 underline">Volver</button>
    </div>
  );

  // KPIs
  const totalFacturado = cliente.ordenes.reduce((s, o) => s + (o.monto_factura ?? 0), 0);
  const totalNC        = cliente.notas_credito.reduce((s, n) => s + n.monto, 0);
  const cotAceptadas   = cliente.cotizaciones.filter(c => c.estado === 'aceptada');

  // Órdenes facturadas (para tab facturas)
  const osFacturadas = cliente.ordenes.filter(o => ['facturado','pagado'].includes(o.estado));

  return (
    <div className="space-y-5 pb-10">
      {/* Nav */}
      <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#0f2d55] transition-colors">
        <ArrowLeft size={15}/> Volver a Clientes
      </button>

      {/* Ficha editable */}
      <SeccionInfo cliente={cliente} onUpdated={setCliente}/>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Órdenes de servicio', value: cliente.ordenes.length,    icon: ClipboardCheck, color: 'text-[#0f2d55]', bg: 'bg-blue-50' },
          { label: 'Cotizaciones',        value: cliente.cotizaciones.length, icon: FileText,       color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Total facturado',     value: fmtMXN(totalFacturado),    icon: Receipt,        color: 'text-green-600',  bg: 'bg-green-50' },
          { label: 'Notas de crédito',    value: fmtMXN(totalNC),           icon: FileMinus,      color: 'text-red-500',    bg: 'bg-red-50' },
        ].map(k => (
          <div key={k.label} className={`${k.bg} rounded-2xl border border-white p-4 flex items-center gap-3`}>
            <k.icon size={20} className={k.color}/>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wide leading-tight">{k.label}</p>
              <p className={`text-lg font-black ${k.color}`}>{k.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs historial */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        {/* Tab bar */}
        <div className="flex border-b border-gray-100">
          {([
            { id: 'os',       label: 'Órdenes de Servicio', count: cliente.ordenes.length,       icon: ClipboardCheck },
            { id: 'cots',     label: 'Cotizaciones',         count: cliente.cotizaciones.length,  icon: FileText },
            { id: 'facturas', label: 'Facturación',          count: osFacturadas.length,          icon: Receipt },
          ] as const).map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                tab === t.id
                  ? 'border-yellow-400 text-[#0f2d55]'
                  : 'border-transparent text-gray-400 hover:text-gray-600'
              }`}
            >
              <t.icon size={14}/>
              {t.label}
              {t.count > 0 && (
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-full ${tab === t.id ? 'bg-yellow-100 text-yellow-700' : 'bg-gray-100 text-gray-500'}`}>
                  {t.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab: Órdenes */}
        {tab === 'os' && (
          <div>
            {cliente.ordenes.length === 0 ? (
              <p className="text-center py-16 text-sm text-gray-400">Sin órdenes de servicio</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">OS</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Técnico</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monto</th>
                    <th className="px-4 py-3"/>
                  </tr>
                </thead>
                <tbody>
                  {cliente.ordenes.map((o, i) => {
                    const cfg = ESTADO_OS_CFG[o.estado] ?? { label: o.estado, color: 'bg-gray-100 text-gray-500' };
                    return (
                      <tr key={o.id} className={`${i !== 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50 transition-colors`}>
                        <td className="px-4 py-3">
                          <p className="text-sm font-bold text-[#0f2d55]">{o.numero_os_manual || o.numero}</p>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500">{(o.tecnico as { nombre: string } | null)?.nombre ?? '—'}</span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar size={10}/>{fmtFecha(o.created_at)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <span className="text-sm font-bold text-gray-700">{fmtMXN(o.monto_factura)}</span>
                        </td>
                        <td className="px-4 py-3 text-right">
                          <a href={`/ordenes-servicio/${o.id}`} className="p-1.5 rounded-lg hover:bg-blue-50 inline-flex transition-colors">
                            <ChevronRight size={14} className="text-gray-400"/>
                          </a>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Cotizaciones */}
        {tab === 'cots' && (
          <div>
            {cliente.cotizaciones.length === 0 ? (
              <p className="text-center py-16 text-sm text-gray-400">Sin cotizaciones</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Folio</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Tipo</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {cliente.cotizaciones.map((c, i) => {
                    const cfg = ESTADO_COT_CFG[c.estado ?? ''] ?? { label: c.estado ?? '—', color: 'bg-gray-100 text-gray-500' };
                    return (
                      <tr key={c.id} className={`${i !== 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50`}>
                        <td className="px-4 py-3"><span className="text-sm font-bold text-[#0f2d55] font-mono">{c.folio ?? '—'}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-gray-500 capitalize">{c.tipo ?? '—'}</span></td>
                        <td className="px-4 py-3"><span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span></td>
                        <td className="px-4 py-3"><span className="text-xs text-gray-500">{fmtFecha(c.created_at)}</span></td>
                        <td className="px-4 py-3 text-right"><span className="text-sm font-bold text-gray-700">{fmtMXN(c.total_mxn)}</span></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        )}

        {/* Tab: Facturación */}
        {tab === 'facturas' && (
          <div>
            {osFacturadas.length === 0 ? (
              <p className="text-center py-16 text-sm text-gray-400">Sin facturas registradas</p>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">No. Factura</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">OS</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Estado</th>
                    <th className="text-left px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Fecha</th>
                    <th className="text-right px-4 py-3 text-[10px] font-bold text-gray-400 uppercase tracking-wider">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {osFacturadas.map((o, i) => (
                    <tr key={o.id} className={`${i !== 0 ? 'border-t border-gray-100' : ''} hover:bg-gray-50`}>
                      <td className="px-4 py-3"><span className="text-sm font-bold font-mono text-gray-700">{o.numero_factura ?? '—'}</span></td>
                      <td className="px-4 py-3"><span className="text-sm text-[#0f2d55] font-semibold">{o.numero_os_manual || o.numero}</span></td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${o.estado === 'pagado' ? 'bg-emerald-100 text-emerald-700' : 'bg-orange-100 text-orange-700'}`}>
                          {o.estado_facturacion ?? o.estado}
                        </span>
                      </td>
                      <td className="px-4 py-3"><span className="text-xs text-gray-500">{fmtFecha(o.created_at)}</span></td>
                      <td className="px-4 py-3 text-right"><span className="text-sm font-bold text-green-700">{fmtMXN(o.monto_factura)}</span></td>
                    </tr>
                  ))}
                </tbody>
                {totalNC > 0 && (
                  <tfoot>
                    <tr className="border-t-2 border-gray-200 bg-red-50">
                      <td colSpan={4} className="px-4 py-3 text-xs font-bold text-red-600">Notas de crédito ({cliente.notas_credito.length})</td>
                      <td className="px-4 py-3 text-right text-sm font-black text-red-600">- {fmtMXN(totalNC)}</td>
                    </tr>
                    <tr className="bg-gray-50">
                      <td colSpan={4} className="px-4 py-3 text-xs font-black text-[#0f2d55] uppercase tracking-wider">Neto cobrado</td>
                      <td className="px-4 py-3 text-right text-base font-black text-[#0f2d55]">{fmtMXN(totalFacturado - totalNC)}</td>
                    </tr>
                  </tfoot>
                )}
              </table>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
