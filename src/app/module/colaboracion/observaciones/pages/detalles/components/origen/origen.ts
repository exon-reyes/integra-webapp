import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {ObservacionService} from '@/core/services/observacion/ObservacionService';
import {catchError, of} from 'rxjs';

interface OrigenState {
    data?: any;
    loading: boolean;
    error?: string;
}

@Component({
    selector: 'app-origen',
    imports: [],
    templateUrl: './origen.html',
    styleUrl: './origen.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Origen {
    // Input signal
    readonly observacionId=input.required<number>();
    // Servicio inyectado
    private readonly observacionService=inject(ObservacionService);
    // State signal
    private readonly origenState=signal<OrigenState>({
        data: undefined,
        loading: false,
        error: undefined,
    });
    // Computed properties derivadas del state
    readonly loading=computed(() => this.origenState().loading);
    readonly error=computed(() => this.origenState().error);
    readonly origen=computed(() => this.origenState().data);
    // Computed properties para la UI con fallbacks
    readonly departamentoOrigen=computed(() => this.origen()?.departamentoOrigen?.nombre ?? 'Auditoría Interna');
    readonly farmacia=computed(() => {
        const unidad=this.origen()?.unidadReportada;
        if(unidad) {
            return `${unidad.clave} ${unidad.nombre}`;
        }
        return '-';
    });
    readonly creadoPor=computed(() => {
        const creador=this.origen()?.usuarioCreador;
        if(typeof creador === 'string') return creador;
        if(typeof creador === 'object' && creador) {
            return `${creador.nombre ?? 'Usuario'} ${creador.apellidoPaterno ?? ''} ${creador.apellidoMaterno ?? ''}`.trim() + (creador.puesto ? ` (${creador.puesto.nombre})` : '');
        }
        return '-';
    });

    // Effect para manejar cambios en observacionId
    constructor() {
        effect(() => {
            const id=this.observacionId();
            if(id) {
                this.loadOrigen(id);
            }
        });
    }

    // Método para cargar datos
    private loadOrigen(id: number): void {
        this.origenState.set({data: undefined, loading: true, error: undefined});

        this.observacionService
            .obtenerOrigen(id)
            .pipe(
                catchError((error) =>
                    of({
                        success: false,
                        data: null,
                        message: error.message || 'Error al cargar origen',
                        timestamp: new Date().toISOString(),
                    }),
                ),
            )
            .subscribe((response) => {
                if(response.success) {
                    this.origenState.set({
                        data: response.data,
                        loading: false,
                        error: undefined,
                    });
                } else {
                    this.origenState.set({
                        data: undefined,
                        loading: false,
                        error: 'No se pudo obtener la información',
                    });
                }
            });
    }
}
