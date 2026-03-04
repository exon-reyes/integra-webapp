import {computed, Injectable, signal} from '@angular/core';

/**
 * Servicio para gestionar el estado del visor de fotos.
 * Utiliza signals de Angular para un manejo de estado reactivo y eficiente.
 *
 * @example
 * ```typescript
 * constructor(private photoViewer: PhotoViewerService) {}
 *
 * verFoto() {
 *   this.photoViewer.open('ruta/foto.jpg', 'Foto de Inicio - 20/12/2025');
 * }
 * ```
 */
@Injectable({
    providedIn: 'root',
})
export class PhotoViewerService {
    /**
     * Signal que almacena la URL de la foto actual
     */
    private readonly photoUrlSignal=signal<string>('');
    /**
     * Computed signal de solo lectura para la URL de la foto
     */
    readonly photoUrl=computed(() => this.photoUrlSignal());
    /**
     * Signal que almacena el título del visor
     */
    private readonly titleSignal=signal<string>('');
    /**
     * Computed signal de solo lectura para el título
     */
    readonly title=computed(() => this.titleSignal());
    /**
     * Signal que controla la visibilidad del visor
     */
    private readonly visibleSignal=signal<boolean>(false);
    /**
     * Computed signal de solo lectura para la visibilidad
     */
    readonly visible=computed(() => this.visibleSignal());
    /**
     * Signal que indica si hubo un error al cargar la imagen
     */
    private readonly hasErrorSignal=signal<boolean>(false);
    /**
     * Computed signal de solo lectura para el estado de error
     */
    readonly hasError=computed(() => this.hasErrorSignal());
    /**
     * Signal que indica si la imagen se está cargando
     */
    private readonly isLoadingSignal=signal<boolean>(false);
    /**
     * Computed signal de solo lectura para el estado de carga
     */
    readonly isLoading=computed(() => this.isLoadingSignal());

    /**
     * Abre el visor de fotos con la URL y título especificados
     *
     * @param url - URL completa de la foto a mostrar
     * @param title - Título descriptivo para el visor
     */
    open(url: string,
         title: string): void {
        this.photoUrlSignal.set(url);
        this.titleSignal.set(title);
        this.hasErrorSignal.set(false); // Reset error state
        this.isLoadingSignal.set(true); // Set loading state
        this.visibleSignal.set(true);
    }

    /**
     * Cierra el visor de fotos
     */
    close(): void {
        this.visibleSignal.set(false);
        // Limpiamos la URL para que si se vuelve a abrir la misma imagen,
        // se detecte el cambio en el [src] y se dispare el evento (load)
        this.photoUrlSignal.set('');
        this.titleSignal.set('');
    }

    /**
     * Marca que ocurrió un error al cargar la imagen
     */
    setError(): void {
        this.hasErrorSignal.set(true);
        this.isLoadingSignal.set(false);
    }

    /**
     * Marca que la imagen terminó de cargar exitosamente
     */
    setLoaded(): void {
        this.isLoadingSignal.set(false);
    }

    /**
     * Resetea el estado de error
     */
    resetError(): void {
        this.hasErrorSignal.set(false);
    }
}
