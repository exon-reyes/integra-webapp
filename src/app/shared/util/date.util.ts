/**
 * Retorna el primer momento del día (00:00:00.000) para una fecha dada.
 * @param date - Fecha base para calcular el inicio del día.
 * @returns Nueva fecha con la hora ajustada al primer momento del día.
 */
export function obtenerInicioDia(date: Date): Date {
    const startOfDay=new Date(date.getTime()); // Crear una nueva instancia con la misma fecha
    startOfDay.setHours(0, 0, 0, 0);
    return startOfDay;
}

/**
 * Retorna el último momento del día (23:59:59.999) para una fecha dada.
 * @param date - Fecha base para calcular el fin del día. Si no se proporciona, se utiliza la fecha actual.
 * @returns Nueva fecha con la hora ajustada al último momento del día.
 */
export function obtenerFinDia(date: Date): Date {
    const endOfDay=new Date(date.getTime()); // Crear una nueva instancia con la misma fecha
    endOfDay.setHours(23, 59, 59, 999);
    return endOfDay;
}

/**
 * Parsea un string "yyyy-MM-dd" como fecha local (medianoche en zona del usuario).
 * Evita el desfase de un día que produce new Date("yyyy-MM-dd") (interpretado como UTC).
 */
export function parseLocalDate(isoDateStr: string): Date {
    const [y, m, d]=isoDateStr.split('-').map(Number);
    return new Date(y, m - 1, d);
}

// Función para formatear fecha en formato ISO string
export function fechaISOString(date: Date=new Date()): string {
    const pad=(num: number) => num.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

