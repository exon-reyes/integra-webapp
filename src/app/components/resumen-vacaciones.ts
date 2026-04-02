import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {PeriodoVacacional, SolicitudVacaciones} from '@/modules/vacacion/models/vacacion.model';

@Component({
    selector: 'app-resumen-vacaciones',
    imports: [],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <h6>Resumen de Vacaciones</h6>

            <div class="space-y-3 text-sm font-medium">

                <!-- Disponibles -->
                <div class="flex flex-col border-b pb-3">
                    <span class="text-3xl font-semibold text-blue-600">
                        {{ periodo()?.diasRestantes }}
                    </span>
                    <span>
                        Días disponibles
                    </span>
                    <span>
                        de {{ periodo()?.diasHabilitados }} totales del año
                    </span>
                </div>

                <!-- Pendientes -->
                <div class="flex flex-col border-b pb-3">
                    <span class="text-2xl font-semibold text-amber-600">
                        {{ vacaciones()?.sumaPendientesAprobacion }}
                    </span>
                    <span>
                        Pendientes de aprobación
                    </span>
                </div>

                <!-- Disfrutados -->
                <div class="flex flex-col border-b pb-3">
                    <span class="text-2xl font-semibold text-green-600">
                        {{ vacaciones()?.sumaDisfrutados }}
                    </span>
                    <span>
                        Días disfrutados
                    </span>
                </div>

                <!-- Cancelados -->
                <div class="flex flex-col">
                    <span class="text-2xl font-semibold text-gray-400">
                        {{ vacaciones()?.sumaCancelados }}
                    </span>
                    <span>
                        Días cancelados
                    </span>
                </div>

            </div>
        </div>
    `,
})
export class ResumenVacaciones {
    readonly vacaciones=input<SolicitudVacaciones>();
    readonly periodo=input<PeriodoVacacional>();
}
