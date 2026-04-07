import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {VacacionAdminService, VacacionService} from '../../services/vacacion.service';
import {JWTService} from "@/core/security/JWTService";
import {Title} from "@/components/title";
import {SpinnerComponent} from "@/components/spinner.component";
import {VacacionCalendarComponent} from '../calendar-widget/vacacion-calendar.component';
import {DashboardVacacion, Festivo} from '../../models/vacacion.model';
import {Button} from "primeng/button";
import {RouterLink} from "@angular/router";
import {ResumenVacaciones} from "@/components/resumen-vacaciones";
import {ResumenDescansos} from "@/components/resumen-descansos";

@Component({
    selector: 'app-dashboard-vacaciones', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [
        Title, SpinnerComponent, VacacionCalendarComponent, Button, RouterLink, ResumenVacaciones, ResumenDescansos,
    ], template: `
        <!-- mis-vacaciones.component.html -->
        @if (dashboard()) {
            <div class="font-sans">
                <app-title title="Dashboard Solicitudes" imageSrc="/assets/icon/vacation.svg"
                           description="Gestión de vacaciones dignas y solicitudes de descanso"/>

                <hr class="border-gray-200 mb-6"/>
                <div class="flex flex-row gap-2 mb-4 justify-between">
                    <div class="flex flex-row gap-2">
                        <p-button label="Solicitar vacaciones" icon="pi pi-crown" severity="warn"
                                  routerLink="/integra/vacaciones/solicitar"></p-button>
                        <p-button label="Registrar descansos" icon="pi pi-calendar-clock"
                                  routerLink="/integra/vacaciones/descansos"></p-button>
                    </div>
                </div>
                <div class="flex gap-6">
                    <!-- Sidebar -->
                    <div class="w-60 shrink-0 space-y-3">
                        <!-- Year selector -->
                        <div class="flex items-center gap-2 mb-4">
                            <span class="text-sm font-medium text-gray-600">Vacaciones</span>
                            <div class="flex items-center gap-1 ml-auto">
                                <button (click)="cambiarAnio(-1)"
                                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg class="w-6 h-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M15 19l-7-7 7-7"/>
                                    </svg>
                                </button>
                                <span class="text-sm font-semibold text-gray-700">{{ calendarYear() }}</span>
                                <button (click)="cambiarAnio(1)"
                                        class="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                                    <svg class="w-6 h-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                                              d="M9 5l7 7-7 7"/>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <!--Resumen vacaciones-->
                        <app-resumen-vacaciones
                            [vacaciones]="dashboard().vacaciones"
                            [periodo]="dashboard().periodoVacacional">
                        </app-resumen-vacaciones>
                        <div class="mt-3"></div>

                        <!-- Resumen de Descansos/Permisos -->
                        <app-resumen-descansos
                            [descansos]="dashboard().descansos">
                        </app-resumen-descansos>

                        <div class="border-t border-gray-200 py-4 space-y-3 text-sm">

                            <!-- Antigüedad -->
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 flex items-center justify-center rounded-md bg-blue-100 text-blue-600">
                                    <i class="pi pi-clock text-sm"></i>
                                </div>
                                <div>
                                    <div>Antigüedad</div>
                                    <p class="font-semibold text-slate-800">{{ dashboard().empleado.antiguedadAnios }}
                                        años</p>
                                </div>
                            </div>

                            <!-- Próximo aniversario -->
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-8 h-8 flex items-center justify-center rounded-md bg-emerald-100 text-emerald-600">
                                    <i class="pi pi-calendar text-sm"></i>
                                </div>
                                <div>
                                    <div>Próximo aniversario</div>
                                    <p class="font-semibold text-slate-800">{{ dashboard().proximoAniversario }}</p>
                                </div>
                            </div>

                        </div>
                    </div>
                    <!-- Calendar section -->
                    <div class="flex-1 bg-white rounded-xl border border-gray-200 p-5">
                        <app-vacacion-calendar
                            [year]="calendarYear()"
                            [festivos]="festivos()"
                            [anioGestion]="dashboard()?.periodoVacacional?.anioGestion"
                            [descansos]="dashboard()?.descansos?.aprobadas || []"
                            [descansosPendientes]="dashboard()?.descansos?.pendientes || []"
                            [aprobadas]="dashboard()?.vacaciones?.aprobadas || []"

                            [disfrutadas]="dashboard()?.vacaciones?.disfrutadas ||[]"
                            [pendientes]="dashboard()?.vacaciones?.pendientes || []"
                            [canceladas]="dashboard()?.vacaciones?.canceladas || []"
                            [descansosCancelados]="dashboard()?.descansos?.canceladas || []"
                        >
                        </app-vacacion-calendar>
                    </div>
                </div>
            </div>
        } @else {
            <app-spinner></app-spinner>
        }
    `,
})
export class DashboardVacacionesComponent implements OnInit {
    calendarYear=signal<number>(new Date().getFullYear());
    protected readonly dashboard=signal<DashboardVacacion | null>(null);
    protected readonly loading=signal(true);
    protected readonly festivos=signal<Festivo[]>([]);
    private readonly vacacionService=inject(VacacionService);
    private readonly vacacionAdminService=inject(VacacionAdminService);
    private readonly userSession=inject(JWTService);
    empleadoId=signal(this.userSession.getUser().employeeName.id);

    ngOnInit() {
        this.cargarFestivos(this.calendarYear())
        this.cargarDashboard();
    }

    cambiarAnio(delta: number) {
        this.calendarYear.update(y => y + delta);
        this.cargarFestivos(this.calendarYear())
        this.cargarDashboard();
    }

    private cargarFestivos(anio: number) {
        this.vacacionAdminService.getFestivos(anio).subscribe({
            next: value => this.festivos.set(value.data),
        })
    }

    private cargarDashboard() {
        this.loading.set(true);
        this.vacacionService.getDashboard(this.empleadoId(), this.calendarYear()).subscribe({
            next: (data) => this.dashboard.set(data.data), error: (err) => {
                console.error('Error cargando dashboard:', err);
                this.loading.set(false);
            }, complete: () => this.loading.set(false),
        });
    }
}
