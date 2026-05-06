'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Building2, Plus, X, Check } from 'lucide-react';
import { obtenerClientes, crearCliente, type ClienteRow } from '@/app/actions/clientes';

function fmtFecha(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClientesPage() {
  const [rows,    setRows]    = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [modal,   setModal]   = useState(false);

  const [nombre,    setNombre]    = useState('');
  const [rfc,       setRfc]       = useState('');
  const [telefono,  setTelefono]  = useState('');
  const [email,     setEmail]     = useState('');
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setLoading(true);
    obtenerClientes()
      .then(({ data, error }) => { if (error) setError(error); else setRows(data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const resetForm = () => { setNombre(''); setRfc(''); setTelefono(''); setEmail(''); };

  const handleCrear = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    await crearCliente({
      nombre_comercial: nombre.trim(),
      rfc:              rfc || undefined,
      telefono:         telefono || undefined,
      email:            email || undefined,
    });
    setModal(false);
    resetForm();
    setGuardando(false);
    cargar();
  };

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
    <div className="space-y-5 pb-10">
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#0f2d55]">Nuevo Cliente</h2>
              <button onClick={() => { setModal(false); resetForm(); }} className="p-1.5 rounded-xl hover:bg-gray-100">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              <input value={nombre}   onChange={e => setNombre(e.target.value)}   placeholder="Nombre comercial *" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
              <input value={rfc}      onChange={e => setRfc(e.target.value)}      placeholder="RFC"                 className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
              <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Telefono"            className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
              <input value={email}    onChange={e => setEmail(e.target.value)}    placeholder="Email"               className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
            </div>
            <div className="flex gap-2 pt-1">
              <button onClick={() => { setModal(false); resetForm(); }} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCrear} disabled={guardando || !nombre.trim()} className="flex-1 h-10 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
            <Building2 size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0f2d55]">Clientes</h1>
            <p className="text-[11px] text-gray-400">{rows.length} registrado{rows.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold">
          <Plus size={15} /> Nuevo Cliente
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Nombre</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">RFC</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Telefono</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Email</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Alta</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-16 text-gray-400 text-sm">Sin clientes registrados</td></tr>
            ) : rows.map(r => (
              <tr key={r.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 text-sm font-bold text-gray-800">{r.nombre_comercial ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.rfc ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.telefono ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{r.email ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtFecha(r.created_at)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
