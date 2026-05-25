import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {VacacionAdminService, VacacionService} from '../../services/vacacion.service';
import {DashboardVacacion, Festivo, SolicitudVacacionRequest} from '../../models/vacacion.model';
import {JWTService} from '@/core/security/JWTService';
import {VacacionCalendarComponent} from '../calendar-widget/vacacion-calendar.component';
import {Title} from '@/components/title';
import {Dialog} from 'primeng/dialog';
import {DatePicker} from 'primeng/datepicker';
import {InputText} from 'primeng/inputtext';
import {InfoItem, InfoList} from "@/components/info-list";
import {RouterLink} from "@angular/router";
import {StatWidgetComponent} from "@/components/stat-widget";


@Component({
    selector: 'app-configuracion-descansos', standalone: true, imports: [
        FormsModule,
        Button,
        VacacionCalendarComponent,
        Title,
        Dialog,
        DatePicker,
        InputText,
        InfoList,
        RouterLink,
        StatWidgetComponent,

    ], template: `
        <app-title imageSrc="/assets/icon/vacation.svg"
                   title="Gestión de descansos / permisos"
                   description="Gestiona las solicitudes de descansos y permisos">
        </app-title>
        <div class="grid grid-cols-1 gap-3 md:grid-cols-3 my-4">
            <app-stat-widget [title]="dashboard().descansos.sumaAprobadas" color="green" subtitle="Descansos aprobados"
                             icon="pi pi-check-circle"></app-stat-widget>
            <app-stat-widget [title]="dashboard().descansos.sumaPendientes" color="yellow"
                             subtitle="Descansos pendientes" icon="pi pi-check-circle"></app-stat-widget>
            <app-stat-widget [title]="dashboard().descansos.sumaCanceladas" color="red" subtitle="Descansos cancelados"
                             icon="pi pi-check-circle"></app-stat-widget>
        </div>
        <!--BANNER INFORMATIVO-->
        <div class="mt-4"></div>
        <app-info-card [items]="infoItem" title="Instrucciones de registro"></app-info-card>
        <div class="flex flex-row gap-2 mb-4 justify-between">
            <div class="flex flex-row gap-2">


                <p-button label="Solicitar vacaciones" icon="pi pi-crown" severity="warn"
                          routerLink="/integra/vacaciones/solicitar"></p-button>
                <p-button label="Dashboard" icon="pi pi-home"
                          routerLink="/integra/vacaciones/dashboard"></p-button>
            </div>
        </div>

        <!-- Calendar section -->
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
                selectionMode="multiple"
                [festivos]="festivos()"
                [minDate]="hoy"
                [anioGestion]="dashboard()?.periodoVacacional?.anioGestion"
                [descansos]="dashboard()?.descansos?.aprobadas || []"
                [descansosPendientes]="dashboard()?.descansos?.pendientes || []"
                [aprobadas]="dashboard()?.vacaciones?.aprobadas || []"

                [disfrutadas]="dashboard()?.vacaciones?.disfrutadas || []"
                [pendientes]="dashboard()?.vacaciones?.pendientes || []"
                [canceladas]="dashboard()?.vacaciones?.canceladas || []"
                [descansosCancelados]="dashboard()?.descansos?.canceladas || []"
                [allowCancelDescanso]="true"
                [allowFestivoSelection]="true"
                (dayClicked)="onDayClicked($event)"
                (descansoPendienteCancel)="cancelarDescanso($event)"
            >
            </app-vacacion-calendar>
        </div>

        <!-- Dialog para registrar descanso -->
        <p-dialog
            header="Registrar descanso"
            [(visible)]="dialogVisible"
            [modal]="true"
            [style]="{width: '480px'}"
            [closable]="true"
            [draggable]="false"
            [styleClass]="'p-fluid'">
            <div class="flex flex-col gap-6 p-2 mt-3">
                <!-- Fechas -->
                <div class="flex gap-4">
                    <div class="flex flex-col flex-1">
                        <label for="fechaInicio" class="text-sm font-semibold text-gray-700">Fecha inicial</label>
                        <p-datePicker id="fechaInicio" [(ngModel)]="dialogFechaInicio" [showIcon]="true"
                                      dateFormat="dd/mm/yy" [disabled]="true" class="w-full"></p-datePicker>
                    </div>
                    <div class="flex flex-col flex-1">
                        <label for="fechaFin" class="text-sm font-semibold text-gray-700">Fecha final</label>
                        <p-datePicker id="fechaFin" [(ngModel)]="dialogFechaFin" [showIcon]="true" dateFormat="dd/mm/yy"
                                      appendTo="body" [minDate]="dialogFechaInicio" [showOnFocus]="false"
                                      class="w-full"></p-datePicker>
                    </div>
                </div>

                <!-- Comentario -->
                <div class="flex flex-col">
                    <label for="comentario" class="text-sm font-semibold text-gray-700">Comentario (opcional)</label>
                    <input pInputText id="comentario" [(ngModel)]="dialogComentario"
                           placeholder="Agregue un comentario sobre su solicitud" class="w-full">
                </div>
            </div>

            <!-- Footer -->
            <ng-template #footer>
                <div class="flex justify-end gap-3">
                    <p-button
                        label="Cancelar"
                        severity="secondary"
                        [text]="true"
                        (onClick)="dialogVisible = false">
                    </p-button>
                    <p-button
                        label="Confirmar"
                        icon="pi pi-check"
                        [disabled]="guardando()"
                        [loading]="guardando()"
                        (onClick)="confirmarDescanso()">
                    </p-button>
                </div>
            </ng-template>
        </p-dialog>
    `,
})
export class ConfiguracionDescansosComponent implements OnInit {
    infoItem: InfoItem[]=[
        {
            subtitle: 'Registrar solicitud', description: 'Selecciona la fecha y agrega una nota opcional',
        }, {
            subtitle: 'Confirmar', description: 'Verifica la información antes de enviar',
        }, {
            subtitle: 'Aprobación',
            description: 'La solicitud será revisada; podrás consultar el detalle al seleccionar la fecha nuevamente',
        },
    ];
    empleadoId=signal<number | null>(null);
    calendarYear=signal<number>(new Date().getFullYear());
    hoy=new Date();
    // Dialog state
    dialogVisible=false;
    dialogFechaInicio: Date | null=null;
    dialogFechaFin: Date | null=null;
    dialogComentario='';
    protected readonly dashboard=signal<DashboardVacacion | null>(null);
    protected readonly festivos=signal<Festivo[]>([]);
    protected readonly guardando=signal(false);
    private fechasBloqueadas=computed<Set<string>>(() => {
        const set=new Set<string>();
        const desc=this.dashboard()?.descansos;
        desc?.aprobadas?.forEach(d => {
            if(d.fecha) set.add(d.fecha);
        });
        desc?.pendientes?.forEach(d => {
            if(d.fecha) set.add(d.fecha);
        });
        return set;
    });
    private readonly vacacionService=inject(VacacionService);
    private readonly vacacionAdminService=inject(VacacionAdminService)
    private readonly messageService=inject(MessageService);
    private readonly userSession=inject(JWTService);

    cambiarAnio(delta: number) {
        this.calendarYear.update(y => y + delta);
        this.vacacionAdminService.getFestivos(this.calendarYear()).subscribe({
            next: res => this.festivos.set((res as any).data ?? []),
        });
        this.cargarDashboard();
    }

    ngOnInit() {
        this.empleadoId.set(this.userSession.getUser().employeeName.id);
        this.hoy.setHours(0, 0, 0, 0);
        this.vacacionAdminService.getFestivos(this.hoy.getFullYear()).subscribe({
            next: res => this.festivos.set(res.data),
        })
        this.cargarDashboard();
    }

    onDayClicked(event: { date: string; jsDate: Date }) {
        // Ignorar días ya registrados (aprobados o vacacionesPendientes)
        if(this.fechasBloqueadas().has(event.date)) return;

        // Abrir dialog con la fecha seleccionada
        this.dialogFechaInicio=event.jsDate;
        this.dialogFechaFin=event.jsDate;
        this.dialogComentario='';
        this.dialogVisible=true;
    }

    confirmarDescanso() {
        if(!this.dialogFechaInicio) return;

        this.guardando.set(true);
        const fechaFin=this.dialogFechaFin || this.dialogFechaInicio;

        const diasSeleccionados=this.generarRangoFechas(this.dialogFechaInicio, fechaFin);

        const request: SolicitudVacacionRequest={
            usuarioId: this.empleadoId()!,
            diasSeleccionados,
            motivo: this.dialogComentario || undefined,
            tipoSolicitud: 'DESCANSO',

        };

        this.vacacionService.crearSolicitud(request).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Proceso completado',
                    detail: 'Solicitud de descanso enviada para aprobación',
                });
                this.dialogVisible=false;
                this.recargarDatos();
            }, error: () => {
                this.guardando.set(false);
            }, complete: () => this.guardando.set(false),
        });
    }

    protected cancelarDescanso(descansoId: number) {
        this.guardando.set(true);
        this.vacacionAdminService.cancelarSolicitud(descansoId, this.empleadoId()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Proceso completado', detail: 'Descanso cancelado correctamente',
                });
                this.recargarDatos();
            }, error: () => this.guardando.set(false), complete: () => this.guardando.set(false),
        })
    }

    private recargarDatos() {
        this.cargarDashboard();
    }

    private cargarDashboard() {
        this.vacacionService.getDashboard(this.empleadoId()!, this.calendarYear()!).subscribe({
            next: (res) => {
                this.dashboard.set(res.data);
            },
        });
    }

    private generarRangoFechas(inicio: Date,
                               fin: Date): string[] {
        const fechas: string[]=[];
        const current=new Date(inicio);
        current.setHours(0, 0, 0, 0);
        const end=new Date(fin);
        end.setHours(0, 0, 0, 0);

        while(current<=end) {
            fechas.push(this.fmt(new Date(current)));
            current.setDate(current.getDate() + 1);
        }
        return fechas;
    }

    private fmt(date: Date): string {
        const y=date.getFullYear();
        const m=String(date.getMonth() + 1).padStart(2, '0');
        const d=String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }
}
