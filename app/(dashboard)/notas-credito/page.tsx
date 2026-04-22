'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, FileMinus, Plus, Trash2, X, Check } from 'lucide-react';
import {
  obtenerNotasCredito, crearNotaCredito, eliminarNotaCredito,
  type NotaCreditoRow,
} from '@/app/actions/facturacion';
import { obtenerFacturas, type FacturaRow } from '@/app/actions/facturacion';

function fmtMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
function fmtFecha(iso: string) {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotasCreditoPage() {
  const [notas,     setNotas]     = useState<NotaCreditoRow[]>([]);
  const [facturas,  setFacturas]  = useState<FacturaRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [modal,     setModal]     = useState(false);

  // Form
  const [numeroNC,    setNumeroNC]    = useState('');
  const [osId,        setOsId]        = useState('');
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [fecha,       setFecha]       = useState(new Date().toISOString().split('T')[0]);
  const [guardando,   setGuardando]   = useState(false);

  useEffect(() => {
    Promise.all([obtenerNotasCredito(), obtenerFacturas()])
      .then(([{ data: ns, error: e }, { data: fs }]) => {
        if (e) setError(e);
        else { setNotas(ns); setFacturas(fs); }
      })
      .finally(() => setLoading(false));
  }, []);

  const totalNC = notas.reduce((s, n) => s + n.monto, 0);

  const resetForm = () => {
    setNumeroNC(''); setOsId(''); setMonto(''); setDescripcion('');
    setFecha(new Date().toISOString().split('T')[0]);
  };

  const handleCrear = async () => {
    if (!monto || parseFloat(monto) <= 0) return;
    setGuardando(true);
    const factura = facturas.find(f => f.id === osId);
    await crearNotaCredito({
      numero_nc:   numeroNC || undefined,
      os_id:       osId || undefined,
      empresa_id:  factura?.empresas ? undefined : undefined,
      monto:       parseFloat(monto),
      descripcion: descripcion || undefined,
      fecha,
    });
    const { data } = await obtenerNotasCredito();
    setNotas(data);
    setModal(false);
    resetForm();
    setGuardando(false);
  };

  const handleEliminar = async (id: string) => {
    if (!confirm('¿Eliminar esta nota de crédito?')) return;
    await eliminarNotaCredito(id);
    setNotas(prev => prev.filter(n => n.id !== id));
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

      {/* Modal nueva NC */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-black text-[#0f2d55]">Nueva Nota de Crédito</h2>
              <button onClick={() => { setModal(false); resetForm(); }} className="p-1.5 rounded-xl hover:bg-gray-100">
                <X size={16} className="text-gray-500" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Número NC</label>
                  <input
                    value={numeroNC}
                    onChange={e => setNumeroNC(e.target.value)}
                    placeholder="Ej. NC-001"
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-500 block mb-1">Fecha</label>
                  <input
                    type="date"
                    value={fecha}
                    onChange={e => setFecha(e.target.value)}
                    className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Factura relacionada (opcional)</label>
                <select
                  value={osId}
                  onChange={e => setOsId(e.target.value)}
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400 bg-white"
                >
                  <option value="">— Sin factura relacionada —</option>
                  {facturas.map(f => (
                    <option key={f.id} value={f.id}>
                      {f.numero_factura || f.numero} — {f.empresas?.nombre_comercial ?? ''}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Monto *</label>
                <input
                  type="number"
                  value={monto}
                  onChange={e => setMonto(e.target.value)}
                  placeholder="0.00"
                  className="w-full border border-gray-200 rounded-xl px-3 h-9 text-sm outline-none focus:border-yellow-400"
                />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-500 block mb-1">Descripción</label>
                <textarea
                  value={descripcion}
                  onChange={e => setDescripcion(e.target.value)}
                  placeholder="Motivo de la nota de crédito..."
                  rows={2}
                  className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 resize-none"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                onClick={() => { setModal(false); resetForm(); }}
                className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Cancelar
              </button>
              <button
                onClick={handleCrear}
                disabled={guardando || !monto}
                className="flex-1 h-10 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
            <FileMinus size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0f2d55]">Notas de Crédito</h1>
            <p className="text-[11px] text-gray-400">{notas.length} nota{notas.length !== 1 ? 's' : ''} registrada{notas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button
          onClick={() => setModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold transition-colors"
        >
          <Plus size={15} /> Nueva Nota de Crédito
        </button>
      </div>

      {/* KPI total NC */}
      <div className="bg-white rounded-2xl border border-red-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Notas de Crédito</p>
          <p className="text-2xl font-black text-red-600">- {fmtMXN(totalNC)}</p>
        </div>
        <FileMinus size={32} className="text-red-200" />
      </div>

      {/* Tabla */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Número NC</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Factura</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Descripción</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Monto</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {notas.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-16 text-gray-400 text-sm">
                  Sin notas de crédito registradas
                </td>
              </tr>
            ) : (
              notas.map(n => (
                <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="font-mono text-xs font-bold text-gray-700">{n.numero_nc || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-600">
                      {n.orden?.numero ?? '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 max-w-[200px]">
                    <span className="text-xs text-gray-500 truncate block">{n.descripcion || '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-gray-500">{fmtFecha(n.fecha)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-sm font-bold text-red-600">- {fmtMXN(n.monto)}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleEliminar(n.id)}
                      className="p-1.5 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 size={13} className="text-red-400" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
