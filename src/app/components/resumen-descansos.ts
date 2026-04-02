import {ChangeDetectionStrategy, Component, input} from '@angular/core';
import {SolicituDescanso} from '@/modules/vacacion/models/vacacion.model';

@Component({
    selector: 'app-resumen-descansos',
    imports: [],
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="bg-white rounded-xl border border-gray-200 p-4 w-full">
            <h6>Permisos / Descansos</h6>
            <div class="space-y-3 text-sm font-medium">
                <div class="flex flex-col border-b pb-3">
                    <span class="text-2xl font-semibold text-amber-600">
                        {{ descansos()?.sumaPendientes || 0 }}
                    </span>
                    <span>Pendientes</span>
                </div>
                <div class="flex flex-col border-b pb-3">
                    <span class="text-2xl font-semibold text-emerald-600">
                        {{ descansos()?.sumaAprobadas || 0 }}
                    </span>
                    <span>Aprobados</span>
                </div>
                <div class="flex flex-col">
                    <span class="text-2xl font-semibold text-gray-400">
                        {{ descansos()?.sumaCanceladas || 0 }}
                    </span>
                    <span>Cancelados</span>
                </div>
            </div>
        </div>
    `,
})
export class ResumenDescansos {
    readonly descansos=input<SolicituDescanso>();
}
