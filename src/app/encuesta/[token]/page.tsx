'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Send, CheckCircle2, MessageSquare, Clock, Wrench, ShieldCheck, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { SurveyService } from '@/lib/services/survey-service';

interface OrderInfo {
    numero: string;
    empresa: string;
    tecnico?: string;
}

interface SurveyData {
    id: string;
    respondida: boolean;
    ordenes_servicio?: OrderInfo;
}

export default function PublicSurveyPage() {
    const { token } = useParams();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [survey, setSurvey] = useState<SurveyData | null>(null);
    const [submitted, setSubmitted] = useState(false);

    // Form State
    const [ratingGeneral, setRatingGeneral] = useState(0);
    const [ratingTecnico, setRatingTecnico] = useState(0);
    const [ratingTiempo, setRatingTiempo] = useState(0);
    const [comment, setComment] = useState('');

    useEffect(() => {
        let isMounted = true;
        const loadSurvey = async () => {
            if (!token) return;
            const { data, error } = await SurveyService.getSurveyByToken(token as string);
            if (isMounted && data && !error) {
                setSurvey(data as SurveyData);
                if (data.respondida) setSubmitted(true);
                setLoading(false);
            } else if (isMounted) {
                setLoading(false);
            }
        };
        loadSurvey();
        return () => { isMounted = false; };
    }, [token]);

    const handleSubmit = async () => {
        if (ratingGeneral === 0 || ratingTecnico === 0 || ratingTiempo === 0) {
            alert('Por favor, califica todos los rubros.');
            return;
        }

        setSubmitting(true);
        const { error } = await SurveyService.submitSurvey(token as string, {
            calificacion_general: ratingGeneral,
            calificacion_tecnico: ratingTecnico,
            calificacion_tiempo: ratingTiempo,
            comentarios: comment
        });

        if (!error) {
            setSubmitted(true);
        } else {
            alert('Error al enviar la encuesta. Por favor intenta de nuevo.');
        }
        setSubmitting(false);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-retarder-gray-50 flex items-center justify-center">
                <Loader2 size={40} className="animate-spin text-retarder-red" />
            </div>
        );
    }

    if (!survey) {
        return (
            <div className="min-h-screen bg-retarder-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-3xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Star size={32} />
                    </div>
                    <h1 className="text-2xl font-bold text-retarder-black mb-2">Encuesta no encontrada</h1>
                    <p className="text-retarder-gray-500">El link que utilizaste no es válido o ha expirado.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-retarder-gray-50 to-white py-12 px-4">
            <div className="max-w-xl mx-auto">
                {/* Header/Logo */}
                <div className="flex flex-col items-center mb-10">
                    <div className="relative w-24 h-24 mb-4">
                        <Image src="/logo-retarder.png" alt="Retarder Logo" fill className="object-contain" />
                    </div>
                    <h1 className="text-2xl font-extrabold text-retarder-black tracking-tight">ENCUESTA DE CALIDAD</h1>
                    <div className="h-1 w-12 bg-retarder-red mt-2 rounded-full" />
                </div>

                <AnimatePresence mode="wait">
                    {submitted ? (
                        <motion.div
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-white rounded-3xl shadow-2xl p-10 text-center border border-emerald-100"
                        >
                            <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                                <CheckCircle2 size={40} />
                            </div>
                            <h2 className="text-3xl font-bold text-retarder-black mb-4">¡Muchas Gracias!</h2>
                            <p className="text-retarder-gray-600 leading-relaxed mb-8">
                                Tus comentarios son muy valiosos para nosotros y nos ayudan a mejorar el servicio técnico de <span className="font-bold text-retarder-red">RETARDER MÉXICO</span>.
                            </p>
                            <div className="p-4 bg-retarder-gray-50 rounded-2xl inline-block border border-retarder-gray-100">
                                <p className="text-[10px] uppercase font-bold text-retarder-gray-400 tracking-widest mb-1">Folio del Servicio</p>
                                <p className="text-xl font-mono font-black text-retarder-red">{survey.ordenes_servicio?.numero}</p>
                            </div>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-retarder-gray-100"
                        >
                            <div className="bg-retarder-black p-6 text-white text-center">
                                <p className="text-xs uppercase font-bold tracking-[0.2em] text-retarder-gray-400 mb-1">Orden de Servicio</p>
                                <h2 className="text-2xl font-black">{survey.ordenes_servicio?.numero}</h2>
                                <p className="text-sm text-retarder-gray-400 mt-1">{survey.ordenes_servicio?.empresa}</p>
                            </div>

                            <div className="p-8 space-y-10">
                                {/* Pregunta 1: General */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-retarder-red/10 flex items-center justify-center text-retarder-red">
                                            <ShieldCheck size={18} />
                                        </div>
                                        <h3 className="font-bold text-retarder-black uppercase tracking-wider text-sm">Experiencia General (1-10)</h3>
                                    </div>
                                    <div className="flex justify-between items-center gap-1 sm:gap-2">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
                                            <button
                                                key={num}
                                                onClick={() => setRatingGeneral(num)}
                                                className={cn(
                                                    "w-full aspect-square text-xs font-bold rounded-lg transition-all border",
                                                    ratingGeneral === num
                                                        ? "bg-retarder-red text-white border-retarder-red scale-110 shadow-lg shadow-retarder-red/30"
                                                        : "bg-white text-retarder-gray-500 border-retarder-gray-200 hover:border-retarder-red/50"
                                                )}
                                            >
                                                {num}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="flex justify-between mt-2 px-1">
                                        <span className="text-[10px] font-bold text-retarder-gray-400 uppercase">Deficiente</span>
                                        <span className="text-[10px] font-bold text-retarder-gray-400 uppercase">Excelente</span>
                                    </div>
                                </section>

                                {/* Pregunta 2: Técnico */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-retarder-yellow-100 flex items-center justify-center text-retarder-yellow-600">
                                            <Wrench size={18} />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-retarder-black uppercase tracking-wider text-sm">Atención del Técnico</h3>
                                            {survey.ordenes_servicio?.tecnico && (
                                                <p className="text-[10px] text-retarder-gray-400">Técnico: <span className="font-bold">{survey.ordenes_servicio.tecnico}</span></p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex justify-around">
                                        {[1, 2, 3, 4, 5].map((star) => (
                                            <button
                                                key={star}
                                                onClick={() => setRatingTecnico(star)}
                                                className="group relative"
                                            >
                                                <Star
                                                    size={40}
                                                    fill={ratingTecnico >= star ? "#ef4444" : "none"}
                                                    className={cn(
                                                        "transition-all",
                                                        ratingTecnico >= star ? "text-retarder-red drop-shadow-md" : "text-retarder-gray-200 group-hover:text-retarder-red/30"
                                                    )}
                                                />
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Pregunta 3: Tiempo */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600">
                                            <Clock size={18} />
                                        </div>
                                        <h3 className="font-bold text-retarder-black uppercase tracking-wider text-sm">Tiempo de Respuesta</h3>
                                    </div>
                                    <div className="grid grid-cols-5 gap-3">
                                        {[1, 2, 3, 4, 5].map((val) => (
                                            <button
                                                key={val}
                                                onClick={() => setRatingTiempo(val)}
                                                className={cn(
                                                    "py-3 rounded-2xl text-lg font-black transition-all border",
                                                    ratingTiempo === val
                                                        ? "bg-blue-600 text-white border-blue-600 shadow-xl shadow-blue-600/20"
                                                        : "bg-retarder-gray-50 text-retarder-gray-300 border-retarder-gray-100 hover:border-blue-200"
                                                )}
                                            >
                                                {val}
                                            </button>
                                        ))}
                                    </div>
                                </section>

                                {/* Comentarios */}
                                <section>
                                    <div className="flex items-center gap-3 mb-4">
                                        <div className="w-8 h-8 rounded-lg bg-retarder-gray-100 flex items-center justify-center text-retarder-gray-600">
                                            <MessageSquare size={18} />
                                        </div>
                                        <h3 className="font-bold text-retarder-black uppercase tracking-wider text-sm">Comentarios Sugerencias</h3>
                                    </div>
                                    <textarea
                                        value={comment}
                                        onChange={(e) => setComment(e.target.value)}
                                        placeholder="Escribe aquí tus comentarios..."
                                        className="w-full bg-retarder-gray-50 border border-retarder-gray-100 rounded-3xl p-5 text-sm focus:ring-4 focus:ring-retarder-red/5 focus:border-retarder-red outline-none resize-none h-32 transition-all shadow-inner"
                                    />
                                </section>

                                <button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full py-5 bg-retarder-black text-white rounded-3xl font-black text-lg uppercase tracking-[0.1em] hover:bg-retarder-red transition-all flex items-center justify-center gap-3 shadow-2xl hover:shadow-retarder-red/30 active:scale-[0.98]"
                                >
                                    {submitting ? (
                                        <Loader2 className="animate-spin" size={24} />
                                    ) : (
                                        <>
                                            Enviar Encuesta
                                            <Send size={20} />
                                        </>
                                    )}
                                </button>

                                <p className="text-[10px] text-center text-retarder-gray-400 font-bold uppercase tracking-widest mt-4">
                                    Seguridad y Confidencialidad Retarder México
                                </p>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
