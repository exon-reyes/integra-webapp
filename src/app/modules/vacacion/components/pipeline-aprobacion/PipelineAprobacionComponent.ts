import {Component, input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
  selector: 'app-pipeline-aprobacion',
  standalone: true,
  imports: [NgClass],
  template: `
      <div class="inline-flex items-center  p-1 gap-1">
          <div
              [ngClass]="estatusJefe()==='APROBADA' ? 'bg-emerald-600 text-white' : estatusJefe()==='CANCELADA' ? 'bg-red-500 text-white' : 'text-white bg-amber-500'"
              class="flex items-center gap-1.5 px-3 py-1 rounded-full">
              <i [ngClass]="estatusJefe()==='APROBADA' ? 'pi-check-circle' : estatusJefe()==='CANCELADA' ? 'pi-times-circle' : 'pi-clock'"
                 class="pi"
              ></i>
              <span class="text-[10px] font-semibold">JEFE INMEDIATO</span>
          </div>

          <i class="pi pi-angle-right"></i>

          <div
              [ngClass]="estatusRrhh()==='APROBADA' ? 'bg-emerald-600 text-white' : estatusRrhh()==='CANCELADA' ? 'bg-red-500 text-white' : 'text-slate-500'"
              class="flex items-center gap-1.5 px-3 py-1 rounded-full transition-all duration-300">
              <i [ngClass]="estatusRrhh()==='APROBADA' ? 'pi-check-circle' : estatusRrhh()==='CANCELADA' ? 'pi-times-circle' : 'pi-clock'"
                 class="pi"
              ></i>
              <span class="text-[10px] font-bold">RRHH</span>
          </div>

      </div>
  `
})
export class PipelineAprobacionComponent {
  estatusJefe = input<string | undefined>('');
  estatusRrhh = input<string | undefined>('');
}
