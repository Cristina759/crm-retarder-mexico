'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Star, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { obtenerEncuestaOS, enviarEncuesta, type RespuestaEncuesta } from '@/app/actions/encuestas';

const PREGUNTAS: { key: keyof Omit<RespuestaEncuesta, 'comentarios'>; label: string }[] = [
  { key: 'calificacion_general',       label: '¿Cómo calificarías el servicio en general?' },
  { key: 'calificacion_tiempo',        label: '¿Qué tan puntual fue el servicio?' },
  { key: 'calificacion_calidad',       label: '¿Cómo calificarías la calidad del trabajo realizado?' },
  { key: 'calificacion_atencion',      label: '¿Cómo calificarías la atención y trato del técnico?' },
  { key: 'calificacion_recomendacion', label: '¿Qué tan probable es que nos recomiendes?' },
];

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          className="transition-transform active:scale-90"
        >
          <Star
            size={30}
            className={n <= value ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'}
          />
        </button>
      ))}
    </div>
  );
}

export default function EncuestaPage() {
  const { id } = useParams<{ id: string }>();

  const [cargando, setCargando]   = useState(true);
  const [empresa, setEmpresa]     = useState('');
  const [numero, setNumero]       = useState('');
  const [noExiste, setNoExiste]   = useState(false);
  const [yaRespondida, setYaRespondida] = useState(false);
  const [enviando, setEnviando]   = useState(false);
  const [enviado, setEnviado]     = useState(false);
  const [error, setError]         = useState<string | null>(null);

  const [respuestas, setRespuestas] = useState<Record<string, number>>({});
  const [comentarios, setComentarios] = useState('');

  useEffect(() => {
    obtenerEncuestaOS(id).then(({ data, respondida, error }) => {
      if (error || !data) { setNoExiste(true); setCargando(false); return; }
      setEmpresa(data.empresa);
      setNumero(data.numero);
      setYaRespondida(respondida);
      setCargando(false);
    });
  }, [id]);

  const faltan = PREGUNTAS.filter(p => !respuestas[p.key]).length;

  const handleEnviar = async () => {
    if (faltan > 0) return;
    setEnviando(true);
    setError(null);
    const { error } = await enviarEncuesta(id, {
      calificacion_general:       respuestas.calificacion_general,
      calificacion_tiempo:        respuestas.calificacion_tiempo,
      calificacion_calidad:       respuestas.calificacion_calidad,
      calificacion_atencion:      respuestas.calificacion_atencion,
      calificacion_recomendacion: respuestas.calificacion_recomendacion,
      comentarios: comentarios.trim(),
    });
    setEnviando(false);
    if (error) setError(error);
    else setEnviado(true);
  };

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="animate-spin text-[#0f2d55]" size={28} />
      </div>
    );
  }

  if (noExiste) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center gap-3">
        <AlertCircle size={32} className="text-red-400" />
        <p className="text-sm text-gray-500">No encontramos esta encuesta. Verifica el link que recibiste.</p>
      </div>
    );
  }

  if (enviado || yaRespondida) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center gap-3">
        <CheckCircle2 size={40} className="text-green-500" />
        <p className="text-lg font-black text-[#0f2d55]">¡Gracias por tu respuesta!</p>
        <p className="text-sm text-gray-500 max-w-xs">Tu opinión nos ayuda a mejorar el servicio en Retarder México.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-md mx-auto space-y-5">
        {/* Header */}
        <div className="text-center space-y-1">
          <p className="text-xs font-black uppercase tracking-widest text-yellow-500">Retarder México</p>
          <h1 className="text-xl font-black text-[#0f2d55]">Encuesta de Satisfacción</h1>
          <p className="text-xs text-gray-400">{empresa} · OS {numero}</p>
        </div>

        {/* Preguntas */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-6">
          {PREGUNTAS.map(p => (
            <div key={p.key}>
              <p className="text-sm font-bold text-gray-700 mb-2">{p.label}</p>
              <StarRating
                value={respuestas[p.key] ?? 0}
                onChange={v => setRespuestas(prev => ({ ...prev, [p.key]: v }))}
              />
            </div>
          ))}

          <div>
            <p className="text-sm font-bold text-gray-700 mb-2">Comentarios <span className="font-normal text-gray-400">(opcional)</span></p>
            <textarea
              value={comentarios}
              onChange={e => setComentarios(e.target.value)}
              rows={3}
              placeholder="Cuéntanos más sobre tu experiencia..."
              className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm outline-none focus:border-yellow-400 transition-colors resize-none"
            />
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-2.5 text-sm text-red-600">{error}</div>
        )}

        <button
          onClick={handleEnviar}
          disabled={faltan > 0 || enviando}
          className="w-full h-12 bg-yellow-400 hover:bg-yellow-500 disabled:opacity-40 disabled:cursor-not-allowed rounded-2xl text-sm font-bold text-yellow-900 transition-colors flex items-center justify-center gap-2"
        >
          {enviando ? <Loader2 size={16} className="animate-spin" /> : null}
          {faltan > 0 ? `Faltan ${faltan} pregunta${faltan !== 1 ? 's' : ''}` : 'Enviar respuesta'}
        </button>
      </div>
    </div>
  );
}
