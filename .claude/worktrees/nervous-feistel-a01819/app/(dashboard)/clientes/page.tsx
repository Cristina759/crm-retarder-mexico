'use client';

import { useEffect, useState } from 'react';
import {
  Loader2, AlertCircle, Users, Search, Building2, Phone, Mail,
  MapPin, ClipboardCheck, Pencil, X, Check, ChevronRight, Plus, ChevronDown,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { obtenerClientes, actualizarCliente, crearCliente, type ClienteRow } from '@/app/actions/clientes';

// ── Colores por sucursal ──────────────────────────────────────────────────────
const SUCURSAL_COLORS: Record<string, string> = {
  TIZAPA:               'bg-amber-100 text-amber-800',
  MILPILLAS:            'bg-blue-100 text-blue-800',
  CAPELA:               'bg-purple-100 text-purple-800',
  NAICA:                'bg-rose-100 text-rose-800',
  VELARDEÑA:            'bg-green-100 text-green-800',
  SAUCITO:              'bg-cyan-100 text-cyan-800',
  CIENEGA:              'bg-indigo-100 text-indigo-800',
  PRINCIPAL:            'bg-gray-100 text-gray-700',
  HERMOSILLO:           'bg-orange-100 text-orange-800',
  BANAMICHI:            'bg-teal-100 text-teal-800',
  TASPANA:              'bg-lime-100 text-lime-800',
  PARRAL:               'bg-red-100 text-red-700',
  CHIHUAHUA:            'bg-sky-100 text-sky-800',
  DURANGO:              'bg-yellow-100 text-yellow-800',
  TORREON:              'bg-pink-100 text-pink-800',
  ACAPULCO:             'bg-emerald-100 text-emerald-800',
  CDMX:                 'bg-slate-100 text-slate-700',
  SABINAS:              'bg-violet-100 text-violet-800',
  MANZANILLO:           'bg-blue-100 text-blue-700',
  'SAN JULIAN':         'bg-orange-100 text-orange-700',
  'CENTRAL DE ABASTOS': 'bg-gray-100 text-gray-600',
};

function getSucursalColor(s: string | null) {
  if (!s) return 'bg-gray-100 text-gray-500';
  const key = s.toUpperCase().split('/')[0].trim();
  return SUCURSAL_COLORS[key] ?? 'bg-gray-100 text-gray-600';
}

function getInitials(nombre: string | null) {
  if (!nombre) return '?';
  const words = nombre.split(' ').filter(w => w.length > 2);
  return (words.slice(0, 2).map(w => w[0]).join('') || nombre[0]).toUpperCase();
}

// ── Inputs del modal ──────────────────────────────────────────────────────────
function Field({ label, value, onChange, placeholder, type = 'text' }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400 bg-white"
      />
    </div>
  );
}

// ── Modal de edición ──────────────────────────────────────────────────────────
function ModalEdicion({ cliente, onClose, onSaved }: {
  cliente: ClienteRow;
  onClose: () => void;
  onSaved: (updated: ClienteRow) => void;
}) {
  const [saving, setSaving] = useState(false);

  // Campos
  const [nombreComercial, setNombreComercial] = useState(cliente.nombre_comercial ?? '');
  const [razonSocial,     setRazonSocial]     = useState(cliente.razon_social ?? '');
  const [rfc,             setRfc]             = useState(cliente.rfc ?? '');
  const [sucursal,        setSucursal]        = useState(cliente.sucursal ?? '');
  // Contacto 1
  const [c1nombre, setC1nombre] = useState(cliente.contacto1_nombre ?? cliente.persona_encargada ?? '');
  const [c1cargo,  setC1cargo]  = useState(cliente.contacto1_cargo ?? '');
  // Contacto 2
  const [c2nombre, setC2nombre] = useState(cliente.contacto2_nombre ?? '');
  const [c2cargo,  setC2cargo]  = useState(cliente.contacto2_cargo ?? '');
  // Teléfonos
  const [tel1, setTel1] = useState(cliente.telefono ?? '');
  const [tel2, setTel2] = useState(cliente.telefono2 ?? '');
  const [tel3, setTel3] = useState(cliente.telefono3 ?? '');
  // Emails
  const [em1, setEm1] = useState(cliente.email ?? '');
  const [em2, setEm2] = useState(cliente.email2 ?? '');
  // Ubicación
  const [direccion, setDireccion] = useState(cliente.direccion_fiscal ?? '');
  const [ciudad,    setCiudad]    = useState(cliente.ciudad ?? '');
  const [estado,    setEstado]    = useState(cliente.estado ?? '');
  const [cp,        setCp]        = useState(cliente.cp ?? '');

  const handleSave = async () => {
    setSaving(true);
    const datos: Partial<ClienteRow> = {
      nombre_comercial:  nombreComercial || null,
      razon_social:      razonSocial     || null,
      rfc:               rfc             || null,
      sucursal:          sucursal        || null,
      contacto1_nombre:  c1nombre        || null,
      contacto1_cargo:   c1cargo         || null,
      contacto2_nombre:  c2nombre        || null,
      contacto2_cargo:   c2cargo         || null,
      telefono:          tel1            || null,
      telefono2:         tel2            || null,
      telefono3:         tel3            || null,
      email:             em1             || null,
      email2:            em2             || null,
      direccion_fiscal:  direccion       || null,
      ciudad:            ciudad          || null,
      estado:            estado          || null,
      cp:                cp              || null,
    };
    const { error } = await actualizarCliente(cliente.id, datos);
    if (!error) {
      onSaved({ ...cliente, ...datos });
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
      <div className="bg-white h-full w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-[#0f2d55] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 flex items-center justify-center">
              <span className="text-sm font-black text-white">{getInitials(cliente.nombre_comercial)}</span>
            </div>
            <div>
              <p className="text-sm font-black text-white leading-tight truncate max-w-[260px]">
                {cliente.nombre_comercial ?? 'Cliente'}
              </p>
              {cliente.sucursal && (
                <p className="text-[10px] text-blue-200">{cliente.sucursal}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Body — scroll */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">

          {/* Empresa */}
          <section>
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Building2 size={11} /> Datos de la empresa
            </p>
            <div className="space-y-3">
              <Field label="Nombre comercial *" value={nombreComercial} onChange={setNombreComercial} placeholder="Ej. CONSTRUCCIONES DIECO" />
              <Field label="Razón social" value={razonSocial} onChange={setRazonSocial} placeholder="Ej. CONSTRUCCIONES DIECO SA DE CV" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="RFC" value={rfc} onChange={setRfc} placeholder="CDI110311L86" />
                <Field label="Sucursal / Unidad" value={sucursal} onChange={setSucursal} placeholder="Ej. TIZAPA" />
              </div>
            </div>
          </section>

          {/* Contactos */}
          <section>
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Users size={11} /> Contactos
            </p>
            <div className="space-y-4">
              {/* Contacto 1 */}
              <div className="border border-gray-100 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-gray-400">CONTACTO PRINCIPAL</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre" value={c1nombre} onChange={setC1nombre} placeholder="Ej. EDGAR ESQUIVEL" />
                  <Field label="Cargo / Rol" value={c1cargo} onChange={setC1cargo} placeholder="Ej. Gerente de compras" />
                </div>
              </div>
              {/* Contacto 2 */}
              <div className="border border-gray-100 rounded-xl p-3 space-y-3">
                <p className="text-[10px] font-bold text-gray-400">CONTACTO SUCURSAL</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Nombre" value={c2nombre} onChange={setC2nombre} placeholder="Ej. JUAN CORONA" />
                  <Field label="Cargo / Rol" value={c2cargo} onChange={setC2cargo} placeholder="Ej. Jefe de mantenimiento" />
                </div>
              </div>
            </div>
          </section>

          {/* Teléfonos */}
          <section>
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Phone size={11} /> Teléfonos (hasta 3)
            </p>
            <div className="space-y-3">
              <Field label="Teléfono 1" value={tel1} onChange={setTel1} placeholder="Ej. 492-124-1687" />
              <Field label="Teléfono 2" value={tel2} onChange={setTel2} placeholder="Ej. 492-124-1688" />
              <Field label="Teléfono 3" value={tel3} onChange={setTel3} placeholder="Ej. 55-1234-5678" />
            </div>
          </section>

          {/* Correos */}
          <section>
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest mb-3 flex items-center gap-2">
              <Mail size={11} /> Correos electrónicos (hasta 2)
            </p>
            <div className="space-y-3">
              <Field label="Correo 1" value={em1} onChange={setEm1} placeholder="contacto@empresa.com" type="email" />
              <Field label="Correo 2" value={em2} onChange={setEm2} placeholder="facturacion@empresa.com" type="email" />
            </div>
          </section>

          {/* Ubicación */}
          <section>
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest mb-3 flex items-center gap-2">
              <MapPin size={11} /> Ubicación
            </p>
            <div className="space-y-3">
              <Field label="Dirección" value={direccion} onChange={setDireccion} placeholder="Calle, Colonia, No." />
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <Field label="Ciudad" value={ciudad} onChange={setCiudad} placeholder="Ej. Fresnillo" />
                </div>
                <Field label="C.P." value={cp} onChange={setCp} placeholder="99100" />
              </div>
              <Field label="Estado" value={estado} onChange={setEstado} placeholder="Ej. ZACATECAS" />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button
            onClick={onClose}
            className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !nombreComercial}
            className="flex-1 h-11 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}
            Guardar cambios
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Panel Nuevo Cliente ───────────────────────────────────────────────────────
function PanelNuevoCliente({ onClose, onCreado }: {
  onClose: () => void;
  onCreado: (c: ClienteRow) => void;
}) {
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState<string | null>(null);

  const [nombreComercial, setNombreComercial] = useState('');
  const [razonSocial,     setRazonSocial]     = useState('');
  const [rfc,             setRfc]             = useState('');
  const [sucursal,        setSucursal]        = useState('');
  const [c1nombre, setC1nombre] = useState('');
  const [c1cargo,  setC1cargo]  = useState('');
  const [c2nombre, setC2nombre] = useState('');
  const [c2cargo,  setC2cargo]  = useState('');
  const [tel1, setTel1] = useState('');
  const [tel2, setTel2] = useState('');
  const [tel3, setTel3] = useState('');
  const [em1,  setEm1]  = useState('');
  const [em2,  setEm2]  = useState('');
  const [dir,  setDir]  = useState('');
  const [ciu,  setCiu]  = useState('');
  const [est,  setEst]  = useState('');
  const [cp,   setCp]   = useState('');

  const handleSave = async () => {
    if (!nombreComercial.trim()) { setError('El nombre comercial es obligatorio'); return; }
    setSaving(true); setError(null);
    const datos: Partial<ClienteRow> = {
      nombre_comercial: nombreComercial.trim() || null,
      razon_social:     razonSocial.trim()     || null,
      rfc:              rfc.trim().toUpperCase() || null,
      sucursal:         sucursal.trim().toUpperCase() || null,
      contacto1_nombre: c1nombre.trim() || null,
      contacto1_cargo:  c1cargo.trim()  || null,
      contacto2_nombre: c2nombre.trim() || null,
      contacto2_cargo:  c2cargo.trim()  || null,
      telefono:  tel1.trim() || null,
      telefono2: tel2.trim() || null,
      telefono3: tel3.trim() || null,
      email:     em1.trim()  || null,
      email2:    em2.trim()  || null,
      direccion_fiscal: dir.trim() || null,
      ciudad: ciu.trim() || null,
      estado: est.trim() || null,
      cp:     cp.trim()  || null,
    };
    const { data, error: e } = await crearCliente(datos);
    if (e || !data) { setError(e ?? 'Error al crear'); setSaving(false); return; }
    onCreado({ ...datos, id: data.id, activo: true, total_os: 0 } as ClienteRow);
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-start justify-end">
      <div className="bg-white h-full w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-blue-900 bg-[#0f2d55] flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-yellow-400 flex items-center justify-center">
              <Plus size={18} className="text-[#0f2d55]" />
            </div>
            <div>
              <p className="text-sm font-black text-white">Nuevo Cliente</p>
              <p className="text-[10px] text-blue-200">Completa los datos del cliente</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
            <X size={16} className="text-white" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-sm text-red-600 font-medium">
              {error}
            </div>
          )}

          {/* Empresa */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1.5">
              <Building2 size={11}/> Datos de la empresa
            </p>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Nombre comercial *</label>
              <input value={nombreComercial} onChange={e => setNombreComercial(e.target.value)}
                placeholder="Ej. CONSTRUCCIONES DIECO"
                className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Razón social</label>
              <input value={razonSocial} onChange={e => setRazonSocial(e.target.value)}
                placeholder="Ej. CONSTRUCCIONES DIECO SA DE CV"
                className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">RFC</label>
                <input value={rfc} onChange={e => setRfc(e.target.value)} placeholder="CDI110311L86"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Sucursal / Unidad</label>
                <input value={sucursal} onChange={e => setSucursal(e.target.value)} placeholder="Ej. TIZAPA"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
              </div>
            </div>
          </section>

          {/* Contactos */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1.5">
              <Users size={11}/> Contactos
            </p>
            <div className="border border-gray-100 rounded-xl p-3 space-y-3">
              <p className="text-[10px] font-bold text-gray-400">CONTACTO PRINCIPAL</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Nombre</label>
                  <input value={c1nombre} onChange={e => setC1nombre(e.target.value)} placeholder="Ej. EDGAR ESQUIVEL"
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Cargo</label>
                  <input value={c1cargo} onChange={e => setC1cargo(e.target.value)} placeholder="Ej. Gerente de compras"
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
                </div>
              </div>
            </div>
            <div className="border border-gray-100 rounded-xl p-3 space-y-3">
              <p className="text-[10px] font-bold text-gray-400">CONTACTO SUCURSAL</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Nombre</label>
                  <input value={c2nombre} onChange={e => setC2nombre(e.target.value)} placeholder="Ej. JUAN CORONA"
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 block mb-1">Cargo</label>
                  <input value={c2cargo} onChange={e => setC2cargo(e.target.value)} placeholder="Ej. Jefe de mantenimiento"
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
                </div>
              </div>
            </div>
          </section>

          {/* Teléfonos */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1.5">
              <Phone size={11}/> Teléfonos (hasta 3)
            </p>
            {[
              { label: 'Teléfono 1', val: tel1, set: setTel1 },
              { label: 'Teléfono 2', val: tel2, set: setTel2 },
              { label: 'Teléfono 3', val: tel3, set: setTel3 },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                <input value={val} onChange={e => set(e.target.value)} placeholder="Ej. 492-124-1687"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
              </div>
            ))}
          </section>

          {/* Correos */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1.5">
              <Mail size={11}/> Correos electrónicos (hasta 2)
            </p>
            {[
              { label: 'Correo 1', val: em1, set: setEm1 },
              { label: 'Correo 2', val: em2, set: setEm2 },
            ].map(({ label, val, set }) => (
              <div key={label}>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">{label}</label>
                <input type="email" value={val} onChange={e => set(e.target.value)} placeholder="contacto@empresa.com"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
              </div>
            ))}
          </section>

          {/* Ubicación */}
          <section className="space-y-3">
            <p className="text-[10px] font-black text-[#0f2d55] uppercase tracking-widest flex items-center gap-1.5">
              <MapPin size={11}/> Ubicación
            </p>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Dirección</label>
              <input value={dir} onChange={e => setDir(e.target.value)} placeholder="Calle, Colonia, No."
                className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="col-span-2">
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Ciudad</label>
                <input value={ciu} onChange={e => setCiu(e.target.value)} placeholder="Ej. Fresnillo"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">C.P.</label>
                <input value={cp} onChange={e => setCp(e.target.value)} placeholder="99100"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-1">Estado</label>
              <input value={est} onChange={e => setEst(e.target.value)} placeholder="Ej. ZACATECAS"
                className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400" />
            </div>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 flex gap-3 flex-shrink-0">
          <button onClick={onClose}
            className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
            Cancelar
          </button>
          <button onClick={handleSave} disabled={saving || !nombreComercial.trim()}
            className="flex-1 h-11 bg-yellow-400 hover:bg-yellow-500 text-[#0f2d55] rounded-xl text-sm font-black transition-colors disabled:opacity-50 flex items-center justify-center gap-2">
            {saving ? <Loader2 size={15} className="animate-spin"/> : <Check size={15}/>}
            Crear cliente
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Tarjeta ───────────────────────────────────────────────────────────────────
function ClienteCard({ c, onEdit, onVerDetalle }: { c: ClienteRow; onEdit: () => void; onVerDetalle: () => void }) {
  const initials  = getInitials(c.nombre_comercial);
  const ubicacion = [c.ciudad, c.estado].filter(Boolean).join(', ');
  const contacto1 = c.contacto1_nombre || c.persona_encargada;
  const telefonos = [c.telefono, c.telefono2, c.telefono3].filter(Boolean);
  const emails    = [c.email, c.email2].filter(Boolean);

  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-md hover:border-yellow-300 transition-all flex flex-col gap-3 group relative">
      {/* Botones hover */}
      <div className="absolute top-3 right-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-all">
        <button onClick={onEdit} className="p-1.5 rounded-lg bg-gray-50 hover:bg-yellow-50 transition-colors" title="Editar ficha">
          <Pencil size={12} className="text-gray-400" />
        </button>
        <button onClick={onVerDetalle} className="p-1.5 rounded-lg bg-gray-50 hover:bg-blue-50 transition-colors" title="Ver detalle">
          <ChevronRight size={12} className="text-gray-400" />
        </button>
      </div>

      {/* Header */}
      <div className="flex items-start gap-3 pr-7">
        <div className="w-10 h-10 rounded-xl bg-[#0f2d55] flex items-center justify-center flex-shrink-0">
          <span className="text-xs font-black text-white">{initials}</span>
        </div>
        <div className="min-w-0">
          <p className="text-sm font-black text-[#0f2d55] leading-tight">{c.nombre_comercial ?? '—'}</p>
          {c.rfc
            ? <p className="text-[10px] font-mono text-gray-400 mt-0.5">{c.rfc}</p>
            : <p className="text-[10px] text-gray-300 italic mt-0.5">Sin RFC</p>
          }
        </div>
      </div>

      {/* Sucursal */}
      {c.sucursal && (
        <span className={`self-start text-[10px] font-bold px-2.5 py-1 rounded-lg flex items-center gap-1 ${getSucursalColor(c.sucursal)}`}>
          <MapPin size={9} />{c.sucursal}
        </span>
      )}

      {/* Contactos */}
      {(contacto1 || c.contacto2_nombre) && (
        <div className="space-y-1">
          {contacto1 && (
            <div className="flex items-center gap-1.5">
              <Users size={11} className="text-[#0f2d55]/40 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-gray-700 font-semibold truncate block">{contacto1}</span>
                {c.contacto1_cargo && <span className="text-[10px] text-gray-400 truncate block">{c.contacto1_cargo}</span>}
              </div>
            </div>
          )}
          {c.contacto2_nombre && (
            <div className="flex items-center gap-1.5 pl-4 border-l-2 border-gray-100 ml-1">
              <Users size={10} className="text-gray-300 flex-shrink-0" />
              <div className="min-w-0">
                <span className="text-[11px] text-gray-600 truncate block">{c.contacto2_nombre}</span>
                {c.contacto2_cargo && <span className="text-[10px] text-gray-400 truncate block">{c.contacto2_cargo}</span>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Teléfonos */}
      {telefonos.length > 0 && (
        <div className="space-y-1">
          {telefonos.map((t, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Phone size={11} className="text-gray-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-600">{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Emails */}
      {emails.length > 0 && (
        <div className="space-y-1">
          {emails.map((e, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <Mail size={11} className="text-gray-400 flex-shrink-0" />
              <span className="text-[11px] text-gray-600 truncate">{(e ?? '').split(';')[0]}</span>
            </div>
          ))}
        </div>
      )}

      {/* Ubicación */}
      {ubicacion && (
        <div className="flex items-center gap-1.5">
          <MapPin size={11} className="text-gray-300 flex-shrink-0" />
          <span className="text-[11px] text-gray-400 truncate">{ubicacion}</span>
        </div>
      )}

      {/* Footer */}
      <div className="pt-2 border-t border-gray-100 flex items-center justify-between mt-auto">
        <div className="flex items-center gap-1.5">
          <ClipboardCheck size={11} className="text-gray-400" />
          <span className="text-[10px] font-semibold text-gray-500">
            {c.total_os > 0 ? `${c.total_os} orden${c.total_os !== 1 ? 'es' : ''}` : 'Sin órdenes aún'}
          </span>
        </div>
        {c.total_os > 0 && (
          <span className="text-[10px] font-bold text-yellow-700 bg-yellow-50 px-1.5 py-0.5 rounded-md">{c.total_os} OS</span>
        )}
      </div>
    </div>
  );
}

// ── Página principal ──────────────────────────────────────────────────────────
export default function ClientesPage() {
  const router = useRouter();
  const [clientes,   setClientes]   = useState<ClienteRow[]>([]);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState<string | null>(null);
  const [query,      setQuery]      = useState('');
  const [editando,   setEditando]   = useState<ClienteRow | null>(null);
  const [creando,    setCreando]    = useState(false);

  useEffect(() => {
    obtenerClientes().then(({ data, error: e }) => {
      if (e) setError(e);
      else setClientes(data);
      setLoading(false);
    });
  }, []);

  const handleSaved = (updated: ClienteRow) => {
    setClientes(prev => prev.map(c => c.id === updated.id ? { ...c, ...updated } : c));
  };

  const handleCreado = (nuevo: ClienteRow) => {
    setClientes(prev =>
      [...prev, nuevo].sort((a, b) =>
        (a.nombre_comercial ?? '').localeCompare(b.nombre_comercial ?? '', 'es')
      )
    );
  };

  const filtered = clientes.filter(c => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      (c.nombre_comercial ?? '').toLowerCase().includes(q) ||
      (c.rfc ?? '').toLowerCase().includes(q) ||
      (c.contacto1_nombre ?? c.persona_encargada ?? '').toLowerCase().includes(q) ||
      (c.contacto2_nombre ?? '').toLowerCase().includes(q) ||
      (c.email ?? '').toLowerCase().includes(q) ||
      (c.telefono ?? '').includes(q) ||
      (c.sucursal ?? '').toLowerCase().includes(q) ||
      (c.ciudad ?? '').toLowerCase().includes(q)
    );
  });

  const totalConOS    = clientes.filter(c => c.total_os > 0).length;
  const sucursalesSet = new Set(clientes.map(c => c.sucursal).filter(Boolean));

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Loader2 className="w-8 h-8 animate-spin text-[#0f2d55]" />
    </div>
  );
  if (error) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
      <AlertCircle className="w-8 h-8 text-red-500" />
      <p className="text-red-600 font-semibold">{error}</p>
    </div>
  );

  return (
    <div className="space-y-6 pb-10">
      {/* Modal edición */}
      {editando && (
        <ModalEdicion
          cliente={editando}
          onClose={() => setEditando(null)}
          onSaved={handleSaved}
        />
      )}

      {/* Panel nuevo cliente */}
      {creando && (
        <PanelNuevoCliente
          onClose={() => setCreando(false)}
          onCreado={handleCreado}
        />
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0f2d55]">Clientes</h1>
            <p className="text-[11px] text-gray-400">{clientes.length} registros activos</p>
          </div>
        </div>
        <button
          onClick={() => setCreando(true)}
          className="flex items-center gap-2 h-9 px-4 bg-yellow-400 hover:bg-yellow-500 text-[#0f2d55] rounded-xl text-sm font-black transition-colors"
        >
          <Plus size={15} />
          Nuevo Cliente
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total registros', value: clientes.length,   color: 'text-[#0f2d55]' },
          { label: 'Con órdenes OS',  value: totalConOS,         color: 'text-yellow-600' },
          { label: 'Sucursales',      value: sucursalesSet.size, color: 'text-purple-600' },
          { label: 'Sin datos',       value: clientes.filter(c => !c.telefono && !c.email && !c.contacto1_nombre).length, color: 'text-red-500' },
        ].map(k => (
          <div key={k.label} className="bg-white rounded-2xl border border-gray-200 p-4">
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">{k.label}</p>
            <p className={`text-2xl font-black ${k.color}`}>{k.value}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Buscar por nombre, RFC, contacto, email, sucursal o ciudad..."
          className="w-full pl-9 pr-24 h-10 border border-gray-200 rounded-xl text-sm outline-none focus:border-yellow-400 bg-white"
        />
        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-bold text-gray-400">
          {filtered.length} RESULTADO{filtered.length !== 1 ? 'S' : ''}
        </span>
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-20 text-gray-400 text-sm">Sin resultados para &ldquo;{query}&rdquo;</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map(c => (
            <ClienteCard key={c.id} c={c} onEdit={() => setEditando(c)} onVerDetalle={() => router.push(`/clientes/${c.id}`)} />
          ))}
        </div>
      )}
    </div>
  );
}
