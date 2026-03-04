import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '@env/environment';
import {Observable, of, tap} from 'rxjs';
import {ResponseData} from '@/core/responseData';
import {Departamento} from '@/models/empresa/departamento';

/**
 * Servicio para la gestión de departamentos con sistema de caché integrado.
 *
 * Implementa un sistema de caché en memoria y localStorage que permite:
 * - Reducir llamadas innecesarias a la API
 * - Persistir datos entre sesiones del navegador
 * - Mejorar la experiencia del usuario con respuestas más rápidas
 *
 * @example
 * ```typescript
 * constructor(private departamentoService: DepartamentoService) {}
 *
 * obtenerDatos() {
 *   this.departamentoService.obtenerDepartamentos().subscribe(response => {
 *     console.log(response.data); // Array de departamentos
 *   });
 * }
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class DepartamentoService {
    private readonly apiUrl=`${environment.integraApi}/departamentos`;

    /** Duración del caché en milisegundos (5 minutos) */
    private readonly cacheDurationMs=5 * 60 * 1000;

    /** Clave para almacenar los datos en localStorage */
    private readonly STORAGE_KEY='departamentos';

    /** Clave para almacenar el timestamp en localStorage */
    private readonly TIMESTAMP_KEY='departamentos_timestamp';

    /** Datos cacheados en memoria */
    private data?: ResponseData<Departamento[]>;

    /** Timestamp de cuando se obtuvo la data por última vez */
    private cacheTimestamp?: number;

    constructor(private httpClient: HttpClient) {
        this.loadFromLocalStorage();
    }

    /**
     * Obtiene la lista de departamentos desde caché o API.
     *
     * Si los datos están en caché y no han expirado, los retorna inmediatamente.
     * En caso contrario, realiza una petición HTTP y actualiza el caché.
     *
     * @returns Observable con la respuesta que contiene el array de departamentos
     *
     * @example
     * ```typescript
     * this.departamentoService.obtenerDepartamentos().subscribe({
     *   next: (response) => {
     *     this.departamentos = response.data;
     *   },
     *   error: (error) => {
     *     console.error('Error al obtener departamentos:', error);
     *   }
     * });
     * ```
     */
    obtenerDepartamentos(): Observable<ResponseData<Departamento[]>> {
        if(this.isCacheValid()) {
            return of(this.data!);
        }

        return this.httpClient.get<ResponseData<Departamento[]>>(`${this.apiUrl}`).pipe(tap((data) => this.updateCache(data)));
    }

    /**
     * Verifica si el caché actual sigue siendo válido.
     *
     * @returns true si hay datos cacheados y no han expirado, false en caso contrario
     * @private
     */
    private isCacheValid(): boolean {
        return !!(this.data && this.cacheTimestamp && Date.now() - this.cacheTimestamp<this.cacheDurationMs);
    }

    /**
     * Actualiza el caché en memoria y localStorage con nuevos datos.
     *
     * @param data - Datos obtenidos de la API
     * @private
     */
    private updateCache(data: ResponseData<Departamento[]>): void {
        this.data=data;
        this.cacheTimestamp=Date.now();
        this.saveToLocalStorage();
    }

    /**
     * Guarda los datos actuales en localStorage.
     *
     * Persiste tanto los datos como el timestamp para mantener
     * el caché entre sesiones del navegador.
     *
     * @private
     */
    private saveToLocalStorage(): void {
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.data));
        localStorage.setItem(this.TIMESTAMP_KEY, this.cacheTimestamp!.toString());
    }

    /**
     * Carga los datos desde localStorage al inicializar el servicio.
     *
     * Se ejecuta automáticamente en el constructor para restaurar
     * el caché de sesiones anteriores si existe y es válido.
     *
     * @private
     */
    private loadFromLocalStorage(): void {
        const data=localStorage.getItem(this.STORAGE_KEY);
        const timestamp=localStorage.getItem(this.TIMESTAMP_KEY);

        if(data && timestamp) {
            this.data=JSON.parse(data);
            this.cacheTimestamp=parseInt(timestamp, 10);
        }
    }
}
