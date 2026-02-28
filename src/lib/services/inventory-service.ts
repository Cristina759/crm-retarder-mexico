import { createClient } from '@/lib/supabase/client';
import type { OrdenEstado } from '@/lib/utils/constants';

const supabase = createClient();

export const InventoryService = {
    /**
     * Reserves inventory for a service order.
     * Triggered when moving to 'servicio_en_proceso'
     */
    async reserveForOrder(ordenId: string) {
        console.log(`[InventoryService] Reserving inventory for order ${ordenId}`);
        // In a real implementation, this would:
        // 1. Get items from the linked quotation (cotizacion_id)
        // 2. Create 'salida' movements with reason 'servicio' and potentially a 'reserved' status if schema allowed
        // 3. For now, we'll log the intention as requested by the plan.
        return { success: true };
    },

    /**
     * Finalizes inventory deduction for a service order.
     * Triggered when moving to 'servicio_concluido'
     */
    async deductForOrder(ordenId: string) {
        console.log(`[InventoryService] Deducting inventory for order ${ordenId}`);
        // In a real implementation, this would:
        // 1. Confirm the movements previously reserved
        // 2. Update stock_actual in the 'inventario' table
        return { success: true };
    }
};
