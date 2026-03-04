import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {Dialog} from 'primeng/dialog';
import {PhotoViewerService} from './photo-viewer.service';
import {SpinnerComponent} from "@/components/spinner.component";

/**
 * Componente standalone para visualizar fotos en un diálogo modal.
 * Optimizado para Angular 21 con:
 * - Signals para manejo de estado reactivo
 * - OnPush change detection para mejor rendimiento
 * - Arquitectura standalone para fácil reutilización
 * - Defer blocks para carga diferida del diálogo
 *
 * @example
 * ```html
 * <!-- En el template del componente padre -->
 * <photo-viewer />
 * ```
 *
 * ```typescript
 * // En el componente padre
 * constructor(private photoViewer: PhotoViewerService) {}
 *
 * verFoto() {
 *   this.photoViewer.open('url/foto.jpg', 'Título de la foto');
 * }
 * ```
 */
@Component({
    selector: 'photo-viewer',
    standalone: true,
    imports: [Dialog, SpinnerComponent],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @defer (when photoViewerService.visible()) {
            <p-dialog
                [(visible)]="isVisible"
                [closable]="true"
                [header]="photoViewerService.title()"
                [modal]="true"
                [style]="{width: '380px'}"
                (onHide)="onDialogHide()">

                <div class="flex justify-center min-h-[200px] items-center relative">
                    @if (photoViewerService.hasError()) {
                        <div class="text-center p-8">
                            <i class="pi pi-image text-6xl text-gray-400 mb-4"></i>
                            <p class="text-gray-600 font-medium">Imagen no disponible</p>
                            <p class="text-red-400 text-sm mt-2">La fotografía no pudo ser cargada</p>
                        </div>
                    } @else {
                        <!-- Spinner overlay mientras carga -->
                        @if (photoViewerService.isLoading()) {
                            <div class="absolute inset-0 flex items-center justify-center bg-white z-10">
                                <div class="text-center p-8">
                                    <app-spinner></app-spinner>
                                </div>
                            </div>
                        }
                        <!-- Imagen siempre en el DOM para que pueda cargar -->
                        <img
                            [src]="photoViewerService.photoUrl()"
                            alt="Foto de asistencia"
                            class="max-w-full max-h-96 rounded-lg shadow-lg"
                            [class.opacity-0]="photoViewerService.isLoading()"
                            (load)="onImageLoad()"
                            (error)="onImageError()">
                    }
                </div>
            </p-dialog>
        } @placeholder {
            <span></span>
        }
    `,
    styles: [
        `
            :host {
                display: contents;
            }
        `,
    ],
})
export class PhotoViewerComponent {
    /**
     * Servicio inyectado para gestionar el estado del visor
     */
    protected readonly photoViewerService=inject(PhotoViewerService);

    /**
     * Getter/Setter para el binding bidireccional con p-dialog
     * Necesario porque p-dialog usa [(visible)] con two-way binding
     */
    get isVisible(): boolean {
        return this.photoViewerService.visible();
    }

    set isVisible(value: boolean) {
        if(!value) {
            this.photoViewerService.close();
        }
    }

    /**
     * Maneja el evento cuando la imagen se carga exitosamente
     */
    protected onImageLoad(): void {
        this.photoViewerService.setLoaded();
    }

    /**
     * Maneja el error cuando la imagen no puede cargarse
     */
    protected onImageError(): void {
        this.photoViewerService.setError();
    }

    /**
     * Maneja el evento cuando el diálogo se oculta
     * Resetea el estado de error para la próxima apertura
     */
    protected onDialogHide(): void {
        this.photoViewerService.resetError();
    }
}
