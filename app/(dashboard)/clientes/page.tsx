'use client';

import { useEffect, useState } from 'react';
import { Loader2, AlertCircle, Building2, Plus, X, Check, Edit2, Trash2 } from 'lucide-react';
import { obtenerClientes, crearCliente, actualizarCliente, eliminarCliente, type ClienteRow } from '@/app/actions/clientes';

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function fmtFecha(iso: string) {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ClientesPage() {
  const [rows,    setRows]    = useState<ClienteRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [modal,   setModal]   = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [nombre,    setNombre]    = useState('');
  const [rfc,       setRfc]       = useState('');
  const [sucursal,  setSucursal]  = useState('');
  const [persona,   setPersona]   = useState('');
  const [direccion, setDireccion] = useState('');
  const [notas,     setNotas]     = useState('');
  const [telefono,  setTelefono]  = useState('');
  const [telefono2, setTelefono2] = useState('');
  const [telefono3, setTelefono3] = useState('');
  const [email,     setEmail]     = useState('');
  const [email2,    setEmail2]    = useState('');
  const [guardando, setGuardando] = useState(false);
  const [errors,    setErrors]    = useState<Record<string, string>>({});

  // Validadores
  const validarRFC = (valor: string) => {
    if (!valor) return true;
    const regex = /^([A-ZÑ&]{3,4}) ?(?:- ?)?(\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[12]\d|3[01])) ?(?:- ?)?([A-Z\d]{2})([A-Z\d])$/i;
    return regex.test(valor.trim());
  };

  const validarEmail = (valor: string) => {
    if (!valor) return true;
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(valor.trim());
  };

  const cargar = () => {
    setLoading(true);
    obtenerClientes()
      .then(({ data, error }) => { if (error) setError(error); else setRows(data); })
      .finally(() => setLoading(false));
  };

  useEffect(() => { cargar(); }, []);

  const resetForm = () => {
    setNombre(''); setRfc(''); setSucursal(''); setPersona(''); setDireccion(''); setNotas('');
    setTelefono(''); setTelefono2(''); setTelefono3(''); setEmail(''); setEmail2('');
    setEditingId(null);
    setErrors({});
  };

  const handleGuardar = async () => {
    // Validaciones finales antes de enviar
    const newErrors: Record<string, string> = {};
    if (!nombre.trim()) newErrors.nombre = 'El nombre comercial es obligatorio';
    if (rfc && !validarRFC(rfc)) newErrors.rfc = 'El formato del RFC no es válido';
    if (email && !validarEmail(email)) newErrors.email = 'El correo electrónico no es válido';
    if (email2 && !validarEmail(email2)) newErrors.email2 = 'El segundo correo no es válido';

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setGuardando(true);
    setError(null);
    
    const datos = {
      nombre_comercial: nombre.trim(),
      rfc:              rfc || undefined,
      sucursal:         sucursal || undefined,
      persona_encargada: persona || undefined,
      direccion_fiscal: direccion || undefined,
      notas:            notas || undefined,
      telefono:         telefono || undefined,
      telefono2:        telefono2 || undefined,
      telefono3:        telefono3 || undefined,
      email:            email || undefined,
      email2:           email2 || undefined,
    };

    const { error: resError } = editingId 
      ? await actualizarCliente(editingId, datos)
      : await crearCliente(datos);

    if (resError) {
      setError(resError);
      setGuardando(false);
    } else {
      setModal(false);
      resetForm();
      setGuardando(false);
      cargar();
    }
  };

  const handleEdit = (r: ClienteRow) => {
    setNombre(r.nombre_comercial ?? '');
    setRfc(r.rfc ?? '');
    setSucursal(r.sucursal ?? '');
    setPersona(r.persona_encargada ?? '');
    setDireccion(r.direccion_fiscal ?? '');
    setNotas(r.notas ?? '');
    setTelefono(r.telefono ?? '');
    setTelefono2(r.telefono2 ?? '');
    setTelefono3(r.telefono3 ?? '');
    setEmail(r.email ?? '');
    setEmail2(r.email2 ?? '');
    setEditingId(r.id);
    setModal(true);
  };

  const handleEliminar = (id: string) => {
    setConfirmDeleteId(id);
  };

  const confirmEliminar = async () => {
    if (!confirmDeleteId) return;
    const id = confirmDeleteId;
    setConfirmDeleteId(null);
    
    // Actualización optimista
    const originalRows = [...rows];
    setRows(rows.filter(r => r.id !== id));
    
    const { error: resError } = await eliminarCliente(id);
    if (resError) {
      alert('Error al eliminar: ' + resError);
      setRows(originalRows);
    }
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
              <h2 className="text-base font-black text-[#0f2d55]">{editingId ? 'Editar Cliente' : 'Nuevo Cliente'}</h2>
              <button onClick={() => { setModal(false); resetForm(); }} className="p-1.5 rounded-xl hover:bg-gray-100">
                <X size={16} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3 overflow-y-auto max-h-[70vh] pr-1">
              <div>
                <label className={`text-[10px] font-bold uppercase mb-1 block ${errors.nombre ? 'text-red-500' : 'text-gray-400'}`}>
                  Nombre Comercial *
                </label>
                <input 
                  value={nombre} 
                  onChange={e => { setNombre(e.target.value); if(errors.nombre) setErrors(prev => ({...prev, nombre: ''})); }} 
                  placeholder="Ej. Transportes S.A." 
                  className={`w-full border rounded-xl px-3 h-10 text-sm outline-none transition-colors ${errors.nombre ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-yellow-400'}`} 
                />
                {errors.nombre && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.nombre}</p>}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={`text-[10px] font-bold uppercase mb-1 block ${errors.rfc ? 'text-red-500' : 'text-gray-400'}`}>RFC</label>
                  <input 
                    value={rfc} 
                    onChange={e => { setRfc(e.target.value.toUpperCase()); if(errors.rfc) setErrors(prev => ({...prev, rfc: ''})); }} 
                    placeholder="ABCD123456" 
                    className={`w-full border rounded-xl px-3 h-10 text-sm outline-none transition-colors ${errors.rfc ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-yellow-400'}`} 
                  />
                  {errors.rfc && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.rfc}</p>}
                </div>
                <div>
                  <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Sucursal</label>
                  <input value={sucursal} onChange={e => setSucursal(e.target.value)} placeholder="Sucursal" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Persona Encargada</label>
                <input value={persona} onChange={e => setPersona(e.target.value)} placeholder="Nombre del contacto" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Dirección</label>
                <textarea value={direccion} onChange={e => setDireccion(e.target.value)} placeholder="Dirección completa" className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 min-h-[60px]" />
              </div>

              <div>
                <label className="text-[10px] font-bold text-gray-400 uppercase mb-1 block">Notas / Observaciones</label>
                <textarea value={notas} onChange={e => setNotas(e.target.value)} placeholder="Notas adicionales sobre el cliente..." className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-yellow-400 min-h-[80px] bg-yellow-50/30" />
              </div>
              
              <div className="pt-2 border-t border-gray-100">
                <label className="text-[10px] font-bold text-[#0f2d55] uppercase mb-2 block">Teléfonos (Hasta 3)</label>
                <div className="space-y-2">
                  <input value={telefono} onChange={e => setTelefono(e.target.value)} placeholder="Teléfono Principal" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
                  <input value={telefono2} onChange={e => setTelefono2(e.target.value)} placeholder="Teléfono 2" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
                  <input value={telefono3} onChange={e => setTelefono3(e.target.value)} placeholder="Teléfono 3" className="w-full border border-gray-200 rounded-xl px-3 h-10 text-sm outline-none focus:border-yellow-400" />
                </div>
              </div>

              <div className="pt-2 border-t border-gray-100">
                <label className="text-[10px] font-bold text-[#0f2d55] uppercase mb-2 block">Correos (Hasta 2)</label>
                <div className="space-y-2">
                  <div>
                    <input 
                      value={email} 
                      onChange={e => { setEmail(e.target.value); if(errors.email) setErrors(prev => ({...prev, email: ''})); }} 
                      placeholder="Email Principal" 
                      className={`w-full border rounded-xl px-3 h-10 text-sm outline-none transition-colors ${errors.email ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-yellow-400'}`} 
                    />
                    {errors.email && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.email}</p>}
                  </div>
                  <div>
                    <input 
                      value={email2} 
                      onChange={e => { setEmail2(e.target.value); if(errors.email2) setErrors(prev => ({...prev, email2: ''})); }} 
                      placeholder="Email 2" 
                      className={`w-full border rounded-xl px-3 h-10 text-sm outline-none transition-colors ${errors.email2 ? 'border-red-500 bg-red-50' : 'border-gray-200 focus:border-yellow-400'}`} 
                    />
                    {errors.email2 && <p className="text-[10px] text-red-500 mt-1 font-bold">{errors.email2}</p>}
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button onClick={() => { setModal(false); resetForm(); }} className="flex-1 h-10 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">Cancelar</button>
              <button onClick={handleGuardar} disabled={guardando || !nombre.trim()} className="flex-1 h-10 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold disabled:opacity-50 flex items-center justify-center gap-2">
                {guardando ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />} {editingId ? 'Actualizar' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {confirmDeleteId && (
        <div className="fixed inset-0 z-[60] bg-black/40 flex items-center justify-center p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center">
                <Trash2 size={24} className="text-red-600" />
              </div>
              <div>
                <h2 className="text-lg font-black text-[#0f2d55]">¿Eliminar cliente?</h2>
                <p className="text-xs text-gray-500 mt-1">Esta acción no se puede deshacer y borrará toda la información asociada.</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setConfirmDeleteId(null)} className="flex-1 h-11 border border-gray-200 rounded-xl text-sm font-bold text-gray-600 hover:bg-gray-50">No, cancelar</button>
              <button onClick={confirmEliminar} className="flex-1 h-11 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-bold shadow-lg shadow-red-200">Sí, eliminar</button>
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
        <button onClick={() => { resetForm(); setModal(true); }} className="flex items-center gap-2 px-4 py-2 bg-[#0f2d55] hover:bg-[#1a3d6e] text-white rounded-xl text-sm font-bold">
          <Plus size={15} /> Nuevo Cliente
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {rows.length === 0 ? (
          <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200">
            <p className="text-gray-400 text-sm italic">Sin clientes registrados</p>
          </div>
        ) : rows.map(r => (
          <div key={r.id} className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            {/* Decoración lateral */}
            <div className="absolute top-0 left-0 w-1 h-full bg-[#0f2d55] opacity-10 group-hover:opacity-100 transition-opacity" />
            
            <div className="flex justify-between items-start mb-4">
              <div className="space-y-1">
                <h3 className="text-sm font-black text-[#0f2d55] leading-tight">{r.nombre_comercial ?? 'Sin nombre'}</h3>
                {r.sucursal && (
                  <span className="inline-block text-[9px] font-bold text-yellow-700 bg-yellow-50 px-2 py-0.5 rounded-full uppercase">
                    {r.sucursal}
                  </span>
                )}
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-white/80 backdrop-blur-sm p-1 rounded-xl">
                <button onClick={() => handleEdit(r)} className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg"><Edit2 size={14} /></button>
                <button onClick={() => handleEliminar(r.id)} className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"><Trash2 size={14} /></button>
              </div>
            </div>

            <div className="space-y-3">
              {/* RFC */}
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-bold text-gray-400 uppercase w-8">RFC:</span>
                <span className="text-xs font-mono text-gray-600">{r.rfc || '—'}</span>
              </div>

              {/* Contactos */}
              <div className="pt-2 border-t border-gray-50 space-y-2">
                {/* Teléfonos */}
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase w-8 mt-1">Tel:</span>
                  <div className="flex flex-col gap-1">
                    <span className="text-xs text-gray-700 font-semibold">{r.telefono || '—'}</span>
                    {(r.telefono2 || r.telefono3) && (
                      <span className="text-[10px] text-gray-400">
                        {[r.telefono2, r.telefono3].filter(Boolean).join(' · ')}
                      </span>
                    )}
                  </div>
                </div>

                {/* Emails */}
                <div className="flex items-start gap-2">
                  <span className="text-[9px] font-bold text-gray-400 uppercase w-8 mt-1">Mail:</span>
                  <div className="flex flex-col">
                    <a href={`mailto:${r.email}`} className="text-xs text-blue-600 hover:underline truncate max-w-[180px]">
                      {r.email || '—'}
                    </a>
                    {r.email2 && <span className="text-[10px] text-gray-400 truncate max-w-[180px]">{r.email2}</span>}
                  </div>
                </div>
              </div>

              {/* Notas */}
              {r.notas && (
                <div className="mt-3 p-2 bg-gray-50 rounded-xl border border-gray-100">
                  <p className="text-[10px] text-gray-500 italic line-clamp-2" title={r.notas}>{r.notas}</p>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
