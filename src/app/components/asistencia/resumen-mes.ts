import {ChangeDetectionStrategy, Component, computed, inject, input} from '@angular/core';
import {toObservable, toSignal} from '@angular/core/rxjs-interop';
import {catchError, concat, map, of, switchMap} from 'rxjs';
import {AsistenciaService, ResumenMesAsistencia} from '@/core/services/asistencia/asistencia.service';

@Component({
    selector: 'app-resumen-mes',
    imports: [],
    standalone: true,
    template: `
        <div class="w-full bg-white border border-slate-200 rounded-xl overflow-hidden relative my-2">
            @if (view().loading) {
                <div class="absolute inset-0 z-20 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
                    <div class="h-6 w-6 animate-spin rounded-full border-2 border-sky-600 border-t-transparent"></div>
                </div>
            }
            <div class="relative z-10 p-4">
                <div class="mb-5 flex items-center justify-between">
                    <div class="space-y-0.5">
                        <div class="text-[11px] font-semibold  tracking-[0.15em] text-sky-600">
                            Resumen
                        </div>
                        <p class="text-md font-bold text-slate-800">Asistencia en el mes</p>
                    </div>

                    <div
                        class="flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-[10px] font-bold text-slate-600">
                        {{ view().nombreMes }}
                    </div>
                </div>

                <div class="flex gap-4">
                    <div class="relative flex-1 rounded-xl bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
                        <div class="mb-2 flex items-center justify-between">
                            <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Laborados</span>
                            <svg class="h-3.5 w-3.5 text-emerald-500" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path d="M5 13l4 4L19 7" stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="3"></path>
                            </svg>
                        </div>
                        <div class="flex items-end justify-between">
          <span class="text-3xl font-light tracking-tighter text-slate-800">
            {{ view().diasLaborados }}
          </span>
                            <span class="mb-1 text-[10px] font-bold text-slate-400">DÍAS</span>
                        </div>
                        <div class="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-emerald-400/30"></div>
                    </div>

                    <div class="relative flex-1 rounded-xl bg-slate-50/50 p-3 transition-colors hover:bg-slate-50">
                        <div class="mb-2 flex items-center justify-between">
                            <span class="text-[9px] font-bold uppercase tracking-wider text-slate-400">Ausencias</span>
                            <svg class="h-3.5 w-3.5 text-rose-400" fill="none" stroke="currentColor"
                                 viewBox="0 0 24 24">
                                <path d="M6 18L18 6M6 6l12 12" stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="3"></path>
                            </svg>
                        </div>
                        <div class="flex items-end justify-between">
          <span class="text-3xl font-light tracking-tighter text-slate-800">
            {{ view().diasNoLaborados }}
          </span>
                            <span class="mb-1 text-[10px] font-bold text-slate-400">FALTAS</span>
                        </div>
                        <div class="absolute bottom-0 left-3 right-3 h-0.5 rounded-full bg-rose-400/30"></div>
                    </div>
                </div>
            </div>
        </div>
    `,
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResumenMes {
    readonly empleadoId=input.required<number>();
    private readonly asistenciaService=inject(AsistenciaService);
    /** Estado: loading + datos; al cambiar empleadoId se muestra loading y se pide de nuevo. */
    private readonly state=toSignal(
        toObservable(this.empleadoId).pipe(
            switchMap((id) =>
                concat(
                    of({loading: true, data: null as ResumenMesAsistencia | null}),
                    this.asistenciaService.obtenerResumenMes({empleadoId: id}).pipe(
                        map((res) => ({
                            loading: false,
                            data: res?.success && res.data ? res.data : null,
                        })),
                        catchError(() => of({loading: false, data: null as ResumenMesAsistencia | null})),
                    ),
                ),
            ),
        ),
        {initialValue: {loading: true, data: null as ResumenMesAsistencia | null}},
    );

    /** Un solo computed para la vista; el template lee una vez por ciclo de detección. */
    readonly view=computed(() => {
        const {loading, data: r}=this.state();
        return {
            loading,
            nombreMes: r?.nombreMes ?? '—',
            diasLaborados: r?.diasLaborados ?? 0,
            diasNoLaborados: r?.diasNoLaborados ?? 0,
        };
    });
}
