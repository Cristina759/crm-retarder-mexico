'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, FileMinus, Plus, Trash2, X, Check, Search, ChevronDown } from 'lucide-react';
import { obtenerNotasCredito, crearNotaCredito, eliminarNotaCredito, buscarFacturasParaNC, type NotaCreditoRow } from '@/app/actions/facturacion';

import { buscarEmpresas, type EmpresaBusquedaResult } from '@/app/actions/cotizaciones';


function fmtMXN(n: number) {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(n);
}
function fmtFecha(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function NotasCreditoPage() {
  const [notas,     setNotas]     = useState<NotaCreditoRow[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState<string | null>(null);
  const [modal,     setModal]     = useState(false);

  const [numeroNC,    setNumeroNC]    = useState('');
  const [monto,       setMonto]       = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [guardando,   setGuardando]   = useState(false);

  // Invoice/Factura Search
  const [facturaSel, setFacturaSel] = useState<any>(null);
  const [queryFactura, setQueryFactura] = useState('');
  const [sugerenciasFactura, setSugerenciasFactura] = useState<any[]>([]);
  const [buscandoFactura, setBuscandoFactura] = useState(false);

  // Cliente (inferred or manual)
  const [empresaId, setEmpresaId] = useState('');
  const [empresaNombre, setEmpresaNombre] = useState('');



  const cargar = () => {
    setLoading(true);
    obtenerNotasCredito()
      .then(({ data, error }) => { if (error) setError(error); else setNotas(data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const totalNC = notas.reduce((s, n) => s + n.monto, 0);

  const resetForm = () => { 
    setNumeroNC(''); 
    setMonto(''); 
    setDescripcion(''); 
    setEmpresaId('');
    setEmpresaNombre('');
    setFacturaSel(null);
    setQueryFactura('');
  };



  const handleCrear = async () => {
    if (!monto || parseFloat(monto) <= 0) return;
    setGuardando(true);
    await crearNotaCredito({
      numero_nc:   numeroNC || undefined,
      monto:       parseFloat(monto),
      descripcion: descripcion || undefined,
      empresa_id:  empresaId || undefined,
    });

    setModal(false);
    resetForm();
    setGuardando(false);
    cargar();
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
              {/* Buscador de Factura */}
              <div className="relative">
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Factura Relacionada *</label>
                <div className="relative mt-1">
                  <input
                    type="text"
                    value={queryFactura}
                    onChange={async e => {
                      const q = e.target.value;
                      setQueryFactura(q);
                      if (q.length >= 2) {
                        setBuscandoFactura(true);
                        const res = await buscarFacturasParaNC(q);
                        setSugerenciasFactura(res);
                        setBuscandoFactura(false);
                      } else {
                        setSugerenciasFactura([]);
                      }
                    }}
                    placeholder="Busca por número de factura (ej. B-670)..."
                    className={`w-full border rounded-xl pl-3 pr-10 h-10 text-sm font-semibold outline-none transition-all ${
                      facturaSel ? 'border-green-300 bg-green-50/10' : 'border-gray-200 focus:border-red-400'
                    }`}
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                    {buscandoFactura ? <Loader2 size={13} className="animate-spin text-gray-400" /> : <Search size={14} className="text-gray-400" />}
                  </div>

                  {sugerenciasFactura.length > 0 && (
                    <div className="absolute z-[60] top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-xl overflow-hidden max-h-48 overflow-y-auto">
                      {sugerenciasFactura.map(f => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => {
                            setFacturaSel(f);
                            setQueryFactura(`Factura: ${f.numero_factura}`);
                            setEmpresaId(f.empresa_id);
                            setEmpresaNombre(f.empresa_nombre);
                            setDescripcion(prev => prev ? prev : `Nota de crédito aplicada a Factura ${f.numero_factura}`);
                            setSugerenciasFactura([]);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-red-50 transition-colors border-b border-gray-50 last:border-0"
                        >
                          <p className="text-sm font-bold text-gray-800">Factura: {f.numero_factura}</p>
                          <p className="text-[10px] text-gray-400 uppercase font-bold">{f.empresa_nombre}</p>
                          <p className="text-[9px] text-gray-300">OS: {f.numero_os}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Cliente (Autorelleno) */}
              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Cliente</label>
                <div className="mt-1 h-10 px-3 bg-gray-50 border border-gray-100 rounded-xl flex items-center">
                  <span className="text-sm font-bold text-gray-600">{empresaNombre || '— Selecciona una factura primero —'}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Número NC</label>
                  <input value={numeroNC} onChange={e => setNumeroNC(e.target.value)} placeholder="NC-000" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-red-400 mt-1" />
                </div>
                <div>
                  <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Monto *</label>
                  <input type="number" value={monto} onChange={e => setMonto(e.target.value)} placeholder="0.00" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-red-400 mt-1" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold uppercase text-gray-400 ml-1">Descripción / Motivo</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} placeholder="¿Por qué se aplica esta nota?" rows={2} className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-red-400 resize-none mt-1" />
              </div>
            </div>


            <div className="flex gap-2 pt-1">
              <button onClick={() => { setModal(false); resetForm(); }} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleCrear} disabled={guardando || !monto} className="flex-1 h-10 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
            <FileMinus size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black text-[#0f2d55]">Notas de Crédito</h1>
            <p className="text-[11px] text-gray-400">{notas.length} nota{notas.length !== 1 ? 's' : ''}</p>
          </div>
        </div>
        <button onClick={() => setModal(true)} className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold">
          <Plus size={15} /> Nueva Nota
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-red-200 p-5 flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Notas de Crédito</p>
          <p className="text-2xl font-black text-red-600">- {fmtMXN(totalNC)}</p>
        </div>
        <FileMinus size={32} className="text-red-200" />
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Número NC</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cliente</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Descripción</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Fecha</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Monto</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {notas.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-16 text-gray-400 text-sm">Sin notas de crédito registradas</td></tr>
            ) : notas.map(n => (
              <tr key={n.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs font-bold text-gray-700">{n.numero_nc ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-600">{n.empresa_nombre ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500 max-w-[200px] truncate">{n.descripcion ?? '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-500">{fmtFecha(n.created_at)}</td>
                <td className="px-4 py-3 text-right text-sm font-bold text-red-600">- {fmtMXN(n.monto)}</td>
                <td className="px-4 py-3 text-right">
                  <button onClick={() => handleEliminar(n.id)} className="p-1.5 rounded-lg hover:bg-red-50">
                    <Trash2 size={13} className="text-red-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
