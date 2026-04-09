import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {VacacionAdminService, VacacionService} from '../../services/vacacion.service';
import {JWTService} from "@/core/security/JWTService";
import {Title} from "@/components/title";
import {SpinnerComponent} from "@/components/spinner.component";
import {VacacionCalendarComponent} from '../calendar-widget/vacacion-calendar.component';
import {DashboardVacacion, Festivo, SolicitudesGestionDTO} from '../../models/vacacion.model';
import {Button} from "primeng/button";
import {RouterLink} from "@angular/router";
import {Panel} from "primeng/panel";
import {DonutChartComponent, DonutSlice} from "@/components/WidgetCirculoData";
import {BarSlice, SegmentedBarComponent} from "@/components/SegmentedBarComponent";
import {AnniversaryCardComponent} from "@/components/AnniversaryCardComponent";
import {ConfirmationService} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {DialogModule} from "primeng/dialog";
import {SolicitudesTableComponent} from "@/modules/vacacion/components/solicitudes-table/solicitudes-table";
import {NgClass} from "@angular/common";

@Component({
    selector: 'app-dashboard-vacaciones', standalone: true, changeDetection: ChangeDetectionStrategy.OnPush, imports: [
        Title,
        SpinnerComponent,
        VacacionCalendarComponent,
        Button,
        RouterLink,
        Panel,
        DonutChartComponent,
        SegmentedBarComponent,
        AnniversaryCardComponent,
        ConfirmDialogModule,
        DialogModule,
        SolicitudesTableComponent,
        NgClass,
    ], providers: [ConfirmationService], template: `
        <!-- mis-vacaciones.component.html -->
        @if (dashboard()) {
            <app-title title="Dashboard Solicitudes" imageSrc="/assets/icon/vacation.svg"
                       description="Gestión de vacaciones dignas y solicitudes de descanso"/>
            <div class="flex flex-row my-3 justify-between">
                <div class="flex gap-2">
                    <p-button label="Solicitar vacaciones" icon="pi pi-crown" severity="warn"
                              routerLink="/integra/vacaciones/solicitar"></p-button>
                    <p-button label="Registrar descansos" icon="pi pi-calendar-clock"
                              routerLink="/integra/vacaciones/descansos"></p-button>
                </div>
                <p-button  label="Consultar solicitudes" icon="pi pi-inbox"
                          (onClick)="confirmCancel($event)"></p-button>
            </div>
            <p-panel header="Resumen del período actual" class="my-3">
                <div class="bg-white border font-medium border-gray-200 rounded-xl overflow-hidden">

                    <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">

                        <!-- Vacaciones -->
                        <div class="p-4 border-r border-gray-200">
                            <div class="p-panel-title mb-2">Vacaciones</div>

                            <div class="grid grid-cols-3 gap-2 mb-4">
                                <div class="bg-gray-100 rounded-lg p-2">
                                    <div
                                        class="text-xl font-medium leading-none text-blue-700">{{ dashboard().vacaciones.sumaAprobadas }}
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Aprobadas</div>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-2">
                                    <div
                                        class="text-xl font-medium leading-none text-amber-700">{{ dashboard().vacaciones.sumaPendientesAprobacion }}
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Pendientes</div>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-2">
                                    <div
                                        class="text-xl font-medium leading-none text-red-700">{{ dashboard().vacaciones.sumaCancelados }}
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Cancelados</div>
                                </div>
                            </div>

                            <div class="flex items-center gap-3">
                                <app-donut-chart
                                    [data]="vacaciones"
                                    [size]="110"
                                    [thickness]="15"
                                    [centerLabel]="dashboard().periodoVacacional.diasHabilitados"
                                    centerSublabel="Habilitados"
                                />
                            </div>
                        </div>

                        <!-- Permisos -->
                        <div class="p-4 border-r border-gray-200">
                            <div class="p-panel-title mb-3">Permisos</div>

                            <div class="grid grid-cols-3 gap-2 mb-4">
                                <div class="bg-gray-100 rounded-lg p-2">
                                    <div
                                        class="text-xl leading-none text-amber-700">{{ dashboard().descansos.sumaPendientes }}
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Pendientes</div>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-2">
                                    <div
                                        class="text-xl leading-none text-emerald-700">{{ dashboard().descansos.sumaAprobadas }}
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Aprobados</div>
                                </div>
                                <div class="bg-gray-100 rounded-lg p-2">
                                    <div
                                        class="text-xl leading-none text-red-700">{{ dashboard().descansos.sumaCanceladas }}
                                    </div>
                                    <div class="text-sm text-gray-500 mt-1">Cancelados</div>
                                </div>
                            </div>

                            <app-segmented-bar [data]="permisos"/>
                        </div>

                        <!-- Antigüedad y aniversario -->
                        <div class="p-4">
                            <div class="p-panel-title mb-3">Antigüedad y aniversario</div>
                            <app-anniversary-card [hireDate]="dashboard().empleado.fechaIngreso"/>
                        </div>

                    </div>
                </div>

            </p-panel>

            <div class="w-full bg-white rounded-xl border border-gray-200 p-5">
                <div class="flex items-center justify-between mb-4">
                    <div class="flex items-center gap-3">
                        <p-button outlined (onClick)="cambiarAnio(-1)" icon="pi pi-chevron-left" size="small"
                                  severity="secondary"></p-button>
                        <span
                            class="text-lg font-bold text-red-700 text-center">Calendario {{ calendarYear() }}</span>
                        <p-button outlined (onClick)="cambiarAnio(1)" icon="pi pi-chevron-right" severity="secondary"
                                  size="small"></p-button>
                    </div>
                    <!-- Year selector -->

                </div>
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

            <!-- Popups & Dialogs -->
            <p-confirmDialog #cd [style]="{width: '450px'}">
                <ng-template #headless let-message let-onAccept="onAccept" let-onReject="onReject">
                    @if (message) {
                    <div class="flex flex-col items-center p-8 bg-white rounded-xl shadow-sm">
                        <div [ngClass]="message.acceptButtonStyleClass === 'p-button-danger' ? 'bg-red-500 text-white' : 'bg-green-500 text-white'"
                            class="rounded-full inline-flex justify-center items-center h-24 w-24 -mt-20">
                            <i [class]="message.icon + ' !text-5xl'"></i>
                        </div>
                        <span class="font-bold text-2xl block mb-2 mt-6 text-slate-800 text-center">{{ message.header }}</span>
                        <p [innerHTML]="message.message" class="mb-0  text-center"></p>
                        <div class="flex items-center gap-2 mt-6">
                            <p-button (onClick)="onReject()" [label]="message.rejectLabel" [outlined]="true" severity="secondary"
                                styleClass="w-[150px]"></p-button>
                            <p-button (onClick)="onAccept()" [label]="message.acceptLabel"
                                [severity]="message.acceptButtonStyleClass === 'p-button-danger' ? 'danger' : 'primary'"
                                styleClass="w-[150px]"></p-button>
                        </div>
                    </div>
                    }
                </ng-template>
            </p-confirmDialog>
            <p-dialog [(visible)]="mostrarDialogoCancelacion" [modal]="true"
                      [style]="{width: '80vw'}">
                <ng-template #header>
                    <app-title imageSrc="/assets/icon/vacation.svg" title="Solicitudes" description="Solicitudes pendientes de aprobación"></app-title>
                </ng-template>
                <app-solicitudes-table
                    [showDetails]="false"
                    [solicitudes]="solicitudesCancelar()"
                    [loading]="loadingCancelaciones()"
                    [totalRecords]="totalCancelaciones()"
                    [first]="currentPageCancelaciones() * pageSizeCancelaciones()"
                    [rows]="pageSizeCancelaciones()"
                    (deleteClick)="eliminarSolicitud($event)"
                    (pageChange)="onCancelacionesPageChange($event)">
                </app-solicitudes-table>
            </p-dialog>
        } @else {
            <app-spinner></app-spinner>
        }
    `,
})
export class DashboardVacacionesComponent implements OnInit {
    vacaciones: DonutSlice[]=[];
    permisos: BarSlice[]=[];
    calendarYear=signal<number>(new Date().getFullYear());
    mostrarDialogoCancelacion=signal(false);
    solicitudesCancelar=signal<SolicitudesGestionDTO[]>([]);
    loadingCancelaciones=signal(false);
    totalCancelaciones=signal(0);
    currentPageCancelaciones=signal(0);
    pageSizeCancelaciones=signal(10);
    protected readonly dashboard=signal<DashboardVacacion | null>(null);
    protected readonly loading=signal(true);
    protected readonly festivos=signal<Festivo[]>([]);
    private readonly vacacionService=inject(VacacionService);
    private readonly vacacionAdminService=inject(VacacionAdminService);
    private readonly userSession=inject(JWTService);
    empleadoId=signal(this.userSession.getUser().employeeName.id);
    private readonly confirmationService=inject(ConfirmationService);

    ngOnInit() {
        this.cargarFestivos(this.calendarYear())
        this.cargarDashboard();
    }

    cambiarAnio(delta: number) {
        this.calendarYear.update(y => y + delta);
        this.cargarFestivos(this.calendarYear())
        this.cargarDashboard();
    }

    confirmCancel(event: Event) {
        this.confirmationService.confirm({
            header: 'Aviso Importante',
            message: 'Las solicitudes en proceso solo pueden ser canceladas por Jefatura o RH. Favor de planificar sus fechas antes de registrarlas',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Continuar',
            rejectLabel: 'Cancelar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => {
                this.mostrarDialogoCancelacion.set(true);
                this.cargarSolicitudesParaCancelar();
            }
        });
    }

    cargarSolicitudesParaCancelar() {
        this.loadingCancelaciones.set(true);
        const filtro={
            estatus: 'PENDIENTE',
            empleadoId: this.empleadoId(),
            currentPage: this.currentPageCancelaciones(),
            pageSize: this.pageSizeCancelaciones()
        };
        this.vacacionAdminService.getSolicitudesFiltradas(filtro).subscribe({
            next: (response) => {
                this.solicitudesCancelar.set(response.data || []);
                this.totalCancelaciones.set(response.totalElements ?? 0);
                this.loadingCancelaciones.set(false);
            }, error: () => this.loadingCancelaciones.set(false)
        });
    }

    onCancelacionesPageChange(event: { first: number, rows: number }) {
        this.currentPageCancelaciones.set(event.first / event.rows);
        this.pageSizeCancelaciones.set(event.rows);
        this.cargarSolicitudesParaCancelar();
    }

    private cargarFestivos(anio: number) {
        this.vacacionAdminService.getFestivos(anio).subscribe({
            next: value => this.festivos.set(value.data),
        })
    }

    private cargarDashboard() {
        this.loading.set(true);
        this.vacacionService.getDashboard(this.empleadoId(), this.calendarYear()).subscribe({
            next: (data) => {
                this.dashboard.set(data.data);
                this.updateDonutVacaciones();
            }, error: (err) => {
                console.error('Error cargando dashboard:', err);
                this.loading.set(false);
            }, complete: () => this.loading.set(false),
        });
    }

    private updateDonutVacaciones() {
        this.permisos=[
            {
                label: 'Aprobados',
                value: this.dashboard().descansos.sumaAprobadas,
                color: '#5DCAA5',
                textColor: '#0F6E56'
            }, {
                label: 'Pendientes',
                value: this.dashboard().descansos.sumaPendientes,
                color: '#EF9F27',
                textColor: '#854F0B'
            }, {
                label: 'Cancelados',
                value: this.dashboard().descansos.sumaCanceladas,
                color: '#E24B4A',
                textColor: '#A32D2D'
            }, {label: 'Disfrutados', value: this.dashboard().descansos.sumaDisfrutadas, color: '#B4B2A9'},
        ];
        this.vacaciones=[
            {label: 'Disfrutados', value: this.dashboard().vacaciones.sumaDisfrutados, color: '#5DCAA5'},
            {label: 'Disponibles', value: this.dashboard().periodoVacacional.diasRestantes, color: '#185FA5'},
            {label: 'Pendientes', value: this.dashboard().vacaciones.sumaPendientesAprobacion, color: '#EF9F27'},
        ]
    }

    protected eliminarSolicitud($event: number) {
        this.loading.set(true);
        this.vacacionAdminService.eliminarSolicitud($event).subscribe({
            next:() => {
                this.cargarDashboard()
                this.cargarSolicitudesParaCancelar()
            }
        })
    }
}
