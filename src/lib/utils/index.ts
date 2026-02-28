import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

/**
 * Format currency in MXN
 */
export function formatMXN(amount: number): string {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format currency in USD
 */
export function formatUSD(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}

/**
 * Format date for display in Mexico timezone
 */
export function formatDate(date: string | Date): string {
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
    }).format(new Date(date));
}

/**
 * Format date + time
 */
export function formatDateTime(date: string | Date): string {
    return new Intl.DateTimeFormat('es-MX', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(new Date(date));
}

/**
 * Format orden de servicio number OS-00001
 */
export function formatOrdenNumber(num: number): string {
    return `OS-${String(num).padStart(5, '0')}`;
}

/**
 * Format cotizacion number COT-00001
 */
export function formatCotizacionNumber(num: number): string {
    return `COT-${String(num).padStart(5, '0')}`;
}

/**
 * Get initials from a name
 */
export function getInitials(nombre: string, apellido?: string): string {
    const first = nombre?.charAt(0) || '';
    const last = apellido?.charAt(0) || '';
    return (first + last).toUpperCase();
}

/**
 * Calculate days elapsed since a date
 */
export function daysSince(date: string | Date): number {
    const now = new Date();
    const then = new Date(date);
    const diff = now.getTime() - then.getTime();
    return Math.floor(diff / (1000 * 60 * 60 * 24));
}
/**
 * Format user name and fix common typos in Clerk data
 */
export function formatUserName(fullName: string | null | undefined): string {
    if (!fullName) return '';
    return fullName.toUpperCase().replace('VALASCO', 'VELASCO');
}
