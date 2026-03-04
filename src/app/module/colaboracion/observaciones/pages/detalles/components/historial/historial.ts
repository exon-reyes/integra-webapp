import {ChangeDetectionStrategy, Component, computed, effect, inject, input, signal} from '@angular/core';
import {PanelModule} from 'primeng/panel';
import {ObservacionService} from '@/core/services/observacion/ObservacionService';
import {catchError, of} from 'rxjs';
import {Historial} from '@/models/observacion/historial';
import {DatePipe} from '@angular/common';

interface HistorialState {
    data: Historial[];
    loading: boolean;
    error?: string;
}

@Component({
    selector: 'app-historial',
    standalone: true,
    imports: [PanelModule, DatePipe],
    template: `
        <p-panel header="HISTORIAL" class="bg-white border-slate-300 rounded-xl shadow-md">
            <div class="relative ml-3">
                @if (loading()) {
                    <div class="flex items-center justify-center p-4">
                        <div class="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                        <span class="ml-2 text-sm text-slate-600">Cargando información...</span>
                    </div>
                } @else if (error()) {
                    <div class="text-red-500">{{ error() }}</div>
                } @else if (historial().length > 0) {
                    <div class="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-slate-600 to-slate-700"></div>

                    @for (item of historial(); track item.id) {
                        <div class="relative pl-7 mb-4">
                            <div class="absolute left-0 top-1.5 w-3.5 h-3.5 rounded-full bg-blue-500 shadow-lg shadow-blue-500/20"></div>
                            <div class="font-semibold text-sm">{{ item.accion }}</div>
                            <div class="text-xs mb-1 text-slate-500">
                                Por <span class="font-bold text-primary">{{ item.usuario }}</span> • {{ item.fechaAccion | date: 'dd/MM/yyyy HH:mm' }}
                            </div>
                            @if (item.detalle) {
                                <div class="text-xs text-slate-500">{{ item.detalle }}</div>
                            }
                        </div>
                    }
                } @else {
                    <div class="text-slate-500">No hay historial disponible.</div>
                }
            </div>
        </p-panel>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HistorialComponent {
    // Input signal
    readonly observacionId=input.required<number>();

    // Servicio inyectado
    private readonly observacionService=inject(ObservacionService);

    // State signal
    private readonly historialState=signal<HistorialState>({
        data: [],
        loading: false,
        error: undefined,
    });

    // Computed properties derivadas del state
    readonly loading=computed(() => this.historialState().loading);
    readonly error=computed(() => this.historialState().error);
    readonly historial=computed(() => this.historialState().data);

    // Effect para manejar cambios en observacionId
    constructor() {
        effect(() => {
            const id=this.observacionId();
            if(id) {
                this.loadHistorial(id);
            }
        });
    }

    // Método para cargar historial
    private loadHistorial(id: number): void {
        this.historialState.set({data: [], loading: true, error: undefined});

        this.observacionService
            .obtenerHistorial(id)
            .pipe(
                catchError((error) =>
                    of({
                        success: false,
                        data: [] as Historial[],
                        message: error.message || 'Error al cargar historial',
                        timestamp: new Date().toISOString(),
                    }),
                ),
            )
            .subscribe((response) => {
                if((response as any).success !== false) {
                    // API exitosa
                    this.historialState.set({
                        data: (response as any).data ?? [],
                        loading: false,
                        error: undefined,
                    });
                } else {
                    // API fallida
                    this.historialState.set({
                        data: [],
                        loading: false,
                        error: (response as any).message || 'No se pudo obtener el historial',
                    });
                }
            });
    }
}
