import {Component, input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
    selector: 'app-pipeline-aprobacion',
    standalone: true,
    imports: [NgClass],
    template: `
        <div class="inline-flex items-center gap-1.5 text-[9px] uppercase font-medium">

            <!-- JEFE INMEDIATO -->
            <div
                [ngClass]="getStatusClass(estatusJefe())"
                class="flex items-center gap-2 px-3 py-1.5 rounded-md"
            >
                <i [ngClass]="getStatusIcon(estatusJefe())" class="pi text-[10px]"></i>
                <span>Jefe Inmediato</span>
            </div>

            <!-- Separador -->
            <span class="text-slate-400"><i class="pi pi-angle-right"></i></span>

            <!-- RRHH -->
            <div
                [ngClass]="getStatusClass(estatusRrhh())"
                class="flex items-center gap-2 px-3 py-1.5 rounded-sm "
            >
                <i [ngClass]="getStatusIcon(estatusRrhh())" class="pi text-[10px]"></i>
                <span>RRHH</span>
            </div>

        </div>
    `
})
export class PipelineAprobacionComponent {
    estatusJefe=input<string | undefined>('');
    estatusRrhh=input<string | undefined>('');

    getStatusClass(status?: string): string {
        switch(status) {
            case 'APROBADA':
                return 'bg-emerald-600 text-white';
            case 'CANCELADA':
                return 'bg-red-600 text-white';
            case 'PENDIENTE':
                return 'bg-amber-500 text-white';
            default:
                return 'bg-slate-300 text-slate-700';
        }
    }

    getStatusIcon(status?: string): string {
        switch(status) {
            case 'APROBADA':
                return 'pi-check-circle';
            case 'CANCELADA':
                return 'pi-times-circle';
            case 'PENDIENTE':
                return 'pi-clock';
            default:
                return 'pi-minus-circle';
        }
    }
}
