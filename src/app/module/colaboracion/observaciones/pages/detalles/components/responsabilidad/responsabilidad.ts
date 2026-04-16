import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {ObservacionService} from '@/core/services/observacion/ObservacionService';
import {catchError, of} from 'rxjs';

interface ResponsabilidadState {
    data?: any;
    loading: boolean;
    error?: string;
}

@Component({
    selector: 'app-responsabilidad',
    imports: [],
    templateUrl: './responsabilidad.html',
    styleUrl: './responsabilidad.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Responsabilidad {
    // Input signal
    readonly observacionId=input.required<number>();
    // Computed properties para la UI
    readonly departamento=computed(() => this.responsabilidad()?.departamentoResponsable?.nombre || '-');
    readonly visibleUnidad=computed(() => {
        const visible=this.responsabilidad()?.visibleParaUnidad;
        return visible ? 'Sí' : 'No';
    });
    // Nuevo signal computado para el estado
    readonly estado=computed(() => this.responsabilidad()?.estatus?.nombre || '-');
    // Servicio inyectado
    private readonly observacionService=inject(ObservacionService);
    // State signal
    private readonly responsabilidadState=signal<ResponsabilidadState>({
        data: undefined,
        loading: false,
        error: undefined,
    });
    // Computed properties derivadas del state
    readonly loading=computed(() => this.responsabilidadState().loading);
    readonly error=computed(() => this.responsabilidadState().error);
    readonly responsabilidad=computed(() => this.responsabilidadState().data);

    // Effect para manejar cambios en observacionId
    constructor() {
        effect(() => {
            const id=this.observacionId();
            if(id) {
                this.loadResponsabilidad(id);
            }
        });
    }

    // Método para cargar datos
    private loadResponsabilidad(id: number): void {
        this.responsabilidadState.set({data: undefined, loading: true, error: undefined});

        this.observacionService
            .obtenerResponsabilidad(id)
            .pipe(
                catchError((error) =>
                    of({
                        success: false,
                        data: null,
                        message: error.message || 'Error al cargar responsabilidad',
                        timestamp: new Date().toISOString(),
                    }),
                ),
            )
            .subscribe((response) => {
                if(response.success) {
                    this.responsabilidadState.set({
                        data: response.data,
                        loading: false,
                        error: undefined,
                    });
                } else {
                    this.responsabilidadState.set({
                        data: undefined,
                        loading: false,
                        error: 'No se pudo obtener la información',
                    });
                }
            });
    }
}
