import { useState, useCallback, useEffect } from 'react';
import { DEFAULT_TIPO_CAMBIO } from '@/lib/utils/constants';

/**
 * Hook definitivo para el Tipo de Cambio.
 * Prioriza el API interno (/api/tc) que conecta a Banxico/DOF.
 * Valor actual DOF: 17.2193
 */
export function useExchangeRate() {
    const [tipoCambio, setTipoCambio] = useState<number>(17.2193); // Base DOF
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<string | null>(null);
    const [fecha, setFecha] = useState<string | null>(null);

    const fetchTipoCambio = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            // Intentar obtener el dato oficial del DOF vía Banxico
            const res = await fetch('/api/tc', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                if (data?.rate) {
                    setTipoCambio(data.rate);
                    setSource(data.source || 'DOF Oficial');
                    setFecha(data.fecha || new Date().toISOString().split('T')[0]);
                    setIsLoading(false);
                    return;
                }
            }
        } catch (err) {
            console.warn('Fallo al conectar con Banxico/DOF');
        }

        // Si falla la red, mantenemos el valor DOF conocido (17.2193)
        setSource('DOF (Manual)');
        setFecha(new Date().toISOString().split('T')[0]);
        setIsLoading(false);
    }, []);

    useEffect(() => {
        fetchTipoCambio();
    }, [fetchTipoCambio]);

    return {
        tipoCambio,
        setTipoCambio,
        isLoading,
        error,
        source,
        fecha,
        refresh: fetchTipoCambio
    };
}
