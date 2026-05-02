'use client';
// Version: 1.0.1 - Pago Parcial Fix


import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, FileText, Pencil, Check, X, Trash2, Plus, Wallet, Printer, FileMinus } from 'lucide-react';
import { obtenerFacturas, actualizarFactura, eliminarFactura, obtenerResumenFacturacion, registrarPago, crearNotaCredito, type FacturaRow } from '@/app/actions/facturacion';



function fmtMXN(n: number | null | undefined) {
  if (n === null || n === undefined) return '—';
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', minimumFractionDigits: 2 }).format(n);
}
function fmtFecha(iso: string | null) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

const ESTADOS = ['pendiente', 'facturada', 'enviada_cliente', 'pago_parcial', 'pagada', 'vencida'];
const ESTADO_COLOR: Record<string, { color: string; label: string }> = {
  pendiente:          { color: 'bg-gray-100 text-gray-600',    label: 'Pendiente'        },
  pendiente_facturar: { color: 'bg-gray-100 text-gray-600',    label: 'Pendiente'        },
  facturada:          { color: 'bg-blue-100 text-blue-700',    label: 'Facturada'        },
  enviada_cliente:    { color: 'bg-indigo-100 text-indigo-700',label: 'Enviada a cliente'},
  pago_parcial:       { color: 'bg-amber-100 text-amber-700',  label: 'Pago Parcial'     },
  pagada:             { color: 'bg-green-100 text-green-700',  label: 'Pagada'           },
  vencida:            { color: 'bg-red-100 text-red-700',      label: 'Vencida'          },
};


// ── Fila editable ─────────────────────────────────────────────────────────────
function FilaFactura({ row, onUpdated, onDeleted }: { row: FacturaRow; onUpdated: (updated: FacturaRow) => void; onDeleted: (id: string) => void }) {
  const [editing, setEditing]       = useState(false);
  const [numFact, setNumFact]       = useState(row.numero_factura ?? '');
  const [monto,   setMonto]         = useState(String(row.monto_factura ?? ''));
  const [concepto, setConcepto]     = useState(row.concepto_factura ?? '');
  const [vencimiento, setVenc]      = useState(row.fecha_vencimiento?.slice(0, 10) ?? '');
  const [estado, setEstado]         = useState(row.estado_facturacion ?? 'pendiente');
  const [saving, setSaving]         = useState(false);
  const [deleting, setDeleting]     = useState(false);

  const handleSave = async () => {
    setSaving(true);
    await actualizarFactura(row.id, {
      numero_factura:    numFact  || null,
      monto_factura:     monto    ? parseFloat(monto) : null,
      concepto_factura:  concepto || null,
      fecha_vencimiento: vencimiento || null,
      estado_facturacion: estado,
    });
    onUpdated({
      ...row,
      numero_factura:    numFact  || null,
      monto_factura:     monto    ? parseFloat(monto) : null,
      concepto_factura:  concepto || null,
      fecha_vencimiento: vencimiento || null,
      estado_facturacion: estado as any,
    });
    setSaving(false);
    setEditing(false);
  };

  const handleDelete = async () => {
    if (!confirm(`¿Eliminar la factura ${row.numero}? Esto revertirá la OS al estado previo.`)) return;
    setDeleting(true);
    await eliminarFactura(row.id);
    onDeleted(row.id);
  };

  const handleCancel = () => {
    setNumFact(row.numero_factura ?? '');
    setMonto(String(row.monto_factura ?? ''));
    setConcepto(row.concepto_factura ?? '');
    setVenc(row.fecha_vencimiento?.slice(0, 10) ?? '');
    setEstado(row.estado_facturacion ?? 'pendiente');
    setEditing(false);
  };

  const est = ESTADO_COLOR[estado] ?? { color: 'bg-gray-100 text-gray-600', label: estado };

  if (editing) {
    return (
      <tr className="border-b border-yellow-100 bg-yellow-50/40">
        <td className="px-4 py-2 text-xs font-mono text-gray-700">{row.numero}</td>
        <td className="px-4 py-2">
          <div className="flex items-center gap-1 justify-center">
            <button
              onClick={handleSave}
              disabled={saving}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-green-500 hover:bg-green-600 text-white shadow-sm transition-colors"
            >
              {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} strokeWidth={3} />}
            </button>
            <button
              onClick={handleCancel}
              className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-200 hover:bg-gray-300 text-gray-700 transition-colors"
            >
              <X size={14} strokeWidth={3} />
            </button>
          </div>
        </td>
        <td className="px-4 py-2">
          <input
            autoFocus
            value={numFact}
            onChange={e => setNumFact(e.target.value)}
            placeholder="Factura #"
            className="w-full border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2 text-xs text-gray-800 font-medium">{row.empresa_nombre ?? '—'}</td>
        <td className="px-4 py-2">
          <input
            value={concepto}
            onChange={e => setConcepto(e.target.value)}
            placeholder="Concepto..."
            className="w-full border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="number"
            value={monto}
            onChange={e => setMonto(e.target.value)}
            placeholder="0.00"
            className="w-28 border border-yellow-300 rounded-lg px-2 py-1 text-xs text-right outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2">
          <input
            type="date"
            value={vencimiento}
            onChange={e => setVenc(e.target.value)}
            className="border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500"
          />
        </td>
        <td className="px-4 py-2">
          <select
            value={estado}
            onChange={e => setEstado(e.target.value)}
            className="border border-yellow-300 rounded-lg px-2 py-1 text-xs outline-none focus:border-yellow-500 bg-white"
          >
            {ESTADOS.map(e => (
              <option key={e} value={e}>{ESTADO_COLOR[e]?.label ?? e}</option>
            ))}
          </select>
        </td>
      </tr>
    );
  }

  return (
    <tr className={`border-b hover:bg-gray-50/50 transition-colors ${row.estado_facturacion === 'pago_parcial' ? 'bg-amber-50/20' : ''}`}>
      <td className="px-4 py-3">
        <div className="flex flex-col">
          <span className="text-xs font-mono font-bold text-gray-400">{row.numero}</span>
          <span className="text-[10px] text-gray-300">{fmtFecha(row.created_at)}</span>
        </div>
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center gap-1.5 justify-center">
          <button
            onClick={() => setEditing(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-all"
            title="Editar Factura"
          >
            <Pencil size={13} />
          </button>
          <button
            onClick={() => {
              const montoStr = prompt('Monto del abono (MXN):');
              if (!montoStr) return;
              const ref = prompt('Referencia (opcional):', 'Transferencia');
              registrarPago(row.id, {
                monto: parseFloat(montoStr),
                fecha: new Date().toISOString(),
                referencia: ref || 'Abono'
              }).then(() => {
                alert('Abono registrado con éxito.');
                window.location.reload();
              });
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-amber-100 text-gray-400 hover:text-amber-600 transition-all"
            title="Registrar Abono"
          >
            <Wallet size={13} />
          </button>

          <button
            onClick={async () => {
              const montoStr = prompt('Monto de la Nota de Crédito (MXN):');
              if (!montoStr) return;
              const motivo = prompt('Motivo de la Nota de Crédito:', 'Descuento / Devolución');
              const ncNum = prompt('Número de Nota de Crédito (opcional):');
              
              const res = await crearNotaCredito({
                numero_nc: ncNum || undefined,
                monto: parseFloat(montoStr),
                descripcion: motivo || 'Nota de crédito directa',
                empresa_id: row.empresa_id || undefined,
                os_id: row.id
              });

              if (res.error) alert('Error: ' + res.error);
              else {
                alert('Nota de Crédito creada y vinculada con éxito.');
                window.location.reload();
              }
            }}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all"
            title="Crear Nota de Crédito"
          >
            <FileMinus size={13} />
          </button>


          <button
            onClick={handleDelete}
            className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-100 hover:bg-red-100 text-gray-400 hover:text-red-600 transition-all"
            title="Eliminar"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </td>
      <td className="px-4 py-3 font-mono text-xs font-bold text-[#0f2d55]">
        {row.numero_factura || <span className="text-gray-300 italic font-normal">Sin capturar</span>}
      </td>
      <td className="px-4 py-3 text-xs text-gray-800 font-medium">{row.empresa_nombre ?? '—'}</td>
      <td className="px-4 py-3 text-xs text-gray-500 max-w-[150px] truncate" title={row.concepto_factura ?? ''}>
        {row.concepto_factura ?? '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex flex-col items-end">
          <span className="text-sm font-black text-gray-900">{fmtMXN(row.monto_factura)}</span>
          <div className="flex flex-col items-end mt-1">
            {(row.total_pagado ?? 0) > 0 && (
              <span className="text-[10px] font-bold text-green-600">Cobrado: {fmtMXN(row.total_pagado)}</span>
            )}
            {row.estado_facturacion !== 'pagada' && (
              <span className="text-[10px] font-black text-red-500 bg-red-50 px-1.5 py-0.5 rounded">
                Falta: {fmtMXN(row.saldo_pendiente ?? row.monto_factura)}
              </span>
            )}
          </div>


        </div>
      </td>
      <td className="px-4 py-3 text-center text-xs text-gray-500">{fmtFecha(row.fecha_vencimiento)}</td>
      <td className="px-4 py-3 text-right">
        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${est.color} shadow-sm border border-white/20`}>
          {est.label}
        </span>
      </td>
    </tr>
  );

}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function FacturacionPage() {
  const [rows,    setRows]    = useState<FacturaRow[]>([]);
  const [resumen, setResumen] = useState({ totalFacturado: 0, totalCobrado: 0, totalNotasCredito: 0, pendientes: 0, vencidas: 0 });
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);

  useEffect(() => {
    Promise.all([obtenerFacturas(), obtenerResumenFacturacion()])
      .then(([{ data: fData, error: fErr }, rData]) => {
        if (fErr) setError(fErr);
        else {
          setRows(fData);
          // Calculamos totales desde la tabla para máxima precisión
          const totalF = fData.reduce((s, r) => s + (Number(r.monto_factura) || 0), 0);
          const totalC = fData.reduce((s, r) => s + (Number(r.total_pagado) || 0), 0);
          const pends  = fData.filter(r => ['pendiente', 'facturada', 'enviada_cliente', 'pago_parcial'].includes(r.estado_facturacion ?? '')).length;
          const vencs  = fData.filter(r => r.estado_facturacion === 'vencida').length;

          setResumen({
            totalFacturado: totalF,
            totalCobrado: totalC,
            pendientes: pends,
            vencidas: vencs,
            totalNotasCredito: rData.totalNotasCredito || 0
          });
        }
      })
      .finally(() => setLoading(false));
  }, []);


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

  const totalFacturado = resumen.totalFacturado - Math.abs(resumen.totalNotasCredito);

  const totalCobrado   = resumen.totalCobrado;

  const handleUpdated = (updated: FacturaRow) => {
    setRows(prev => prev.map(r => r.id === updated.id ? updated : r));
  };

  const handleDeleted = (id: string) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  return (
    <div className="space-y-5 pb-10">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-[#0f2d55] flex items-center justify-center">
          <FileText size={18} className="text-white" />
        </div>
        <div className="flex-1">
          <h1 className="text-lg font-black text-[#0f2d55]">Facturación (Control de Saldos v2.1)</h1>

          <p className="text-[11px] text-gray-400">{rows.length} factura{rows.length !== 1 ? 's' : ''} · Haz clic en una fila para editar</p>
        </div>
        <button 
          onClick={() => window.open('/reportes/facturacion', '_blank')}
          className="flex items-center gap-2 px-4 py-2 bg-white border border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold shadow-sm transition-all"
        >
          <Printer size={15} /> Generar Reporte
        </button>
      </div>


      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-white rounded-2xl border border-blue-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Facturado</p>
          <p className="text-2xl font-black text-blue-700">{fmtMXN(totalFacturado)}</p>
        </div>
        <div className="bg-white rounded-2xl border border-green-200 p-5">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 mb-1">Total Cobrado</p>
          <p className="text-2xl font-black text-green-700">{fmtMXN(totalCobrado)}</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100 bg-gray-50">
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">OS</th>
              <th className="px-4 py-3 w-32 text-center text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-red-50/50">Acciones</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Factura #</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Cliente</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Concepto</th>
              <th className="text-right px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Monto</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Vencimiento</th>
              <th className="text-left px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-gray-400">Estado</th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-16 text-gray-400 text-sm">Sin facturas registradas</td></tr>
            ) : rows.map(r => (
              <FilaFactura key={r.id} row={r} onUpdated={handleUpdated} onDeleted={handleDeleted} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
