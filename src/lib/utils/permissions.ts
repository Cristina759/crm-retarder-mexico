import type { Rol, OrdenEstado } from './constants';

type Permission = 'create' | 'read' | 'update' | 'delete';
type Resource =
    | 'empresas'
    | 'contactos'
    | 'ordenes_servicio'
    | 'cotizaciones'
    | 'oportunidades'
    | 'catalogos'
    | 'evidencias'
    | 'encuestas'
    | 'facturacion'
    | 'usuarios'
    | 'inventario'
    | 'audit_log'
    | 'dashboards';

const PERMISSIONS: Record<Rol, Partial<Record<Resource, Permission[]>>> = {
    admin: {
        empresas: ['create', 'read', 'update', 'delete'],
        contactos: ['create', 'read', 'update', 'delete'],
        ordenes_servicio: ['create', 'read', 'update', 'delete'],
        cotizaciones: ['create', 'read', 'update', 'delete'],
        oportunidades: ['create', 'read', 'update', 'delete'],
        catalogos: ['create', 'read', 'update', 'delete'],
        evidencias: ['create', 'read', 'update', 'delete'],
        encuestas: ['create', 'read', 'update', 'delete'],
        facturacion: ['create', 'read', 'update', 'delete'],
        usuarios: ['create', 'read', 'update', 'delete'],
        inventario: ['create', 'read', 'update', 'delete'],
        audit_log: ['read'],
        dashboards: ['read'],
    },
    direccion: {
        empresas: ['create', 'read', 'update', 'delete'],
        contactos: ['create', 'read', 'update', 'delete'],
        ordenes_servicio: ['create', 'read', 'update', 'delete'],
        cotizaciones: ['create', 'read', 'update', 'delete'],
        oportunidades: ['create', 'read', 'update', 'delete'],
        catalogos: ['create', 'read', 'update', 'delete'],
        evidencias: ['create', 'read', 'update', 'delete'],
        encuestas: ['create', 'read', 'update', 'delete'],
        facturacion: ['create', 'read', 'update', 'delete'],
        usuarios: ['create', 'read', 'update', 'delete'],
        inventario: ['create', 'read', 'update', 'delete'],
        audit_log: ['read'],
        dashboards: ['read'],
    },
    vendedor: {
        empresas: ['create', 'read', 'update'],
        contactos: ['create', 'read', 'update'],
        ordenes_servicio: ['read'],
        cotizaciones: ['create', 'read', 'update', 'delete'],
        oportunidades: ['create', 'read', 'update', 'delete'],
        catalogos: ['read'],
        dashboards: ['read'],
    },
    tecnico: {
        ordenes_servicio: ['read', 'update'],
        evidencias: ['create', 'read', 'update'],
        dashboards: ['read'],
    },
    cliente: {
        ordenes_servicio: ['read'],
        cotizaciones: ['read', 'update'],
    },
};

// States a role can transition órdenes TO
const ESTADO_TRANSITIONS: Record<Rol, OrdenEstado[]> = {
    admin: [
        'solicitud_recibida', 'cotizacion_enviada', 'cotizacion_aceptada',
        'servicio_programado', 'documentacion_enviada', 'tecnico_en_contacto',
        'servicio_en_proceso', 'autorizacion_adicional', 'servicio_concluido',
        'evidencia_cargada', 'documentacion_entregada', 'encuesta_enviada',
        'facturado', 'pagado',
    ],
    direccion: [
        'solicitud_recibida', 'cotizacion_enviada', 'cotizacion_aceptada',
        'servicio_programado', 'documentacion_enviada', 'tecnico_en_contacto',
        'servicio_en_proceso', 'autorizacion_adicional', 'servicio_concluido',
        'evidencia_cargada', 'documentacion_entregada', 'encuesta_enviada',
        'facturado', 'pagado',
    ],
    vendedor: ['solicitud_recibida', 'cotizacion_enviada', 'cotizacion_aceptada'],
    tecnico: ['tecnico_en_contacto', 'servicio_en_proceso', 'autorizacion_adicional', 'servicio_concluido', 'evidencia_cargada'],
    cliente: [],
};

export function canUserDo(role: Rol, resource: Resource, action: Permission): boolean {
    return PERMISSIONS[role]?.[resource]?.includes(action) ?? false;
}

export function canTransitionTo(role: Rol, estado: OrdenEstado): boolean {
    return ESTADO_TRANSITIONS[role]?.includes(estado) ?? false;
}

export function getDefaultDashboard(role: Rol): string {
    const map: Record<Rol, string> = {
        admin: '/dashboard',
        direccion: '/dashboard',
        vendedor: '/dashboard',
        tecnico: '/ordenes',
        cliente: '/cotizaciones',
    };
    return map[role];
}
