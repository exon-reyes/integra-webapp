import {Injectable} from '@angular/core';

/**
 * Servicio genérico para persistir filtros de consulta en localStorage.
 *
 * Estrategia de memoria:
 * - Al arrancar la app, los valores se leen de localStorage una sola vez
 *   y se guardan en un Map en memoria.
 * - Las lecturas posteriores siempre van al Map (sin tocar localStorage).
 * - Las escrituras actualizan el Map y sincronizan localStorage.
 */
@Injectable({providedIn: 'root'})
export class FiltroStorageService {

    private readonly cache = new Map<string, unknown>();

    /**
     * Guarda un valor de filtro. Actualiza memoria y localStorage.
     */
    guardar<T>(clave: string, valor: T): void {
        this.cache.set(clave, valor);
        try {
            localStorage.setItem(clave, JSON.stringify(valor));
        } catch {
            // cuota excedida u otros errores de storage — ignorar silenciosamente
        }
    }

    /**
     * Lee un valor de filtro.
     * Primero busca en el Map en memoria; si no existe, lee localStorage
     * (solo ocurre la primera vez por clave) y lo almacena en el Map.
     */
    leer<T>(clave: string, valorPorDefecto: T): T {
        if (this.cache.has(clave)) {
            return this.cache.get(clave) as T;
        }

        try {
            const raw = localStorage.getItem(clave);
            if (raw !== null) {
                const parsed = JSON.parse(raw) as T;
                this.cache.set(clave, parsed);
                return parsed;
            }
        } catch {
            // JSON inválido — limpiar entrada corrupta
            localStorage.removeItem(clave);
        }

        this.cache.set(clave, valorPorDefecto);
        return valorPorDefecto;
    }

    /**
     * Elimina un filtro de memoria y localStorage.
     */
    limpiar(clave: string): void {
        this.cache.delete(clave);
        localStorage.removeItem(clave);
    }

    /**
     * Elimina todos los filtros que empiecen con un prefijo dado.
     * Útil para limpiar todos los filtros de un módulo de una sola vez.
     */
    limpiarPorPrefijo(prefijo: string): void {
        // limpiar del Map
        for (const clave of this.cache.keys()) {
            if (clave.startsWith(prefijo)) {
                this.cache.delete(clave);
            }
        }
        // limpiar de localStorage
        const claves: string[] = [];
        for (let i = 0; i < localStorage.length; i++) {
            const k = localStorage.key(i);
            if (k?.startsWith(prefijo)) claves.push(k);
        }
        claves.forEach(k => localStorage.removeItem(k));
    }
}
