import {Component, computed, inject, OnInit, signal} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {MessageService} from 'primeng/api';
import {VacacionAdminService, VacacionService} from '../../services/vacacion.service';
import {DashboardVacacion, Festivo, SolicitudVacacionRequest} from '../../models/vacacion.model';
import {Panel} from 'primeng/panel';
import {JWTService} from '@/core/security/JWTService';
import {VacacionCalendarComponent} from '../calendar-widget/vacacion-calendar.component';
import {Title} from '@/components/title';
import {Dialog} from 'primeng/dialog';
import {DatePicker} from 'primeng/datepicker';
import {InputText} from 'primeng/inputtext';


@Component({
    selector: 'app-configuracion-descansos', standalone: true, imports: [
        FormsModule, Button, Panel, VacacionCalendarComponent, Title, Dialog, DatePicker, InputText,

    ], template: `
        <app-title imageSrc="/assets/icon/vacation.svg"
                   title="Solicitud de días de descanso"
                   description="Selecciona los días de descanso a registrar">
        </app-title>

        <p-panel class="mt-3">
            <ng-template #header>
                <div class="flex items-center gap-2 my-4">
                    <button (click)="cambiarAnio(-1)" class="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="pi pi-chevron-left"></i>
                    </button>
                    <span class="text-sm font-semibold text-gray-700">{{ calendarYear() }}</span>
                    <button (click)="cambiarAnio(1)" class="p-1 text-gray-400 hover:text-gray-600 transition-colors">
                        <i class="pi pi-chevron-right"></i>
                    </button>
                </div>
            </ng-template>
            <div class="flex items-center gap-4 p-4  mb-6">
                <!-- Imagen -->
                <img src="/assets/img/calendar.webp" alt="Imagen descriptiva" class="w-30 h-20 rounded">

                <!-- Texto -->
                <div class="flex flex-col">
                    <div class="text-lg  font-semibold text-orange-600">Proceso de cancelación</div>
                    <div class="text-gray-600">Para cancelar una solicitud, haga clic en la fecha del calendario y seleccione 'Cancelar día solicitado'. No es posible cancelar descansos que ya han sido disfrutados.
                    </div>
                </div>
            </div>
            <!-- Selector de año -->

            <!-- Calendario -->
            <br>
            <app-vacacion-calendar
                [year]="calendarYear()"
                selectionMode="multiple"
                [festivos]="festivos()"
                [minDate]="hoy"
                [anioGestion]="dashboard()?.periodoVacacional?.anioGestion"
                [descansos]="dashboard()?.descansos?.aprobadas || []"
                [descansosPendientes]="dashboard()?.descansos?.pendientes || []"
                [aprobadas]="dashboard()?.vacaciones?.aprobadas || []"
                [aprobadasPorTomar]="dashboard()?.vacaciones?.aprobadasPorTomar || []"
                [disfrutadas]="dashboard()?.vacaciones?.disfrutadas || []"
                [pendientes]="dashboard()?.vacaciones?.pendientes || []"
                [canceladas]="dashboard()?.vacaciones?.canceladas || []"
                [descansosCancelados]="dashboard()?.descansos?.canceladas || []"
                [allowCancelDescanso]="true"
                (dayClicked)="onDayClicked($event)"
                (descansoPendienteCancel)="cancelarDescanso($event)"
                (solicitudReactivar)="reactivarSolicitud($event)">
            </app-vacacion-calendar>
        </p-panel>
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
            diasSeleccionados, motivo: this.dialogComentario || undefined, tipoSolicitud: 'DESCANSO',

        };

        this.vacacionService.crearSolicitud(this.empleadoId()!, request).subscribe({
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
        this.vacacionAdminService.cancelarDescanso(descansoId,this.empleadoId()).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Proceso completado', detail: 'Descanso cancelado correctamente',
                });
                this.recargarDatos();
            }, error: () => this.guardando.set(false), complete: () => this.guardando.set(false),
        })
    }

    protected reactivarSolicitud(event: { id: number; eventType: 'descanso' | 'solicitud' }) {
        this.guardando.set(true);
        this.vacacionAdminService.reactivarSolicitud(event.id, this.empleadoId()!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Proceso completado', detail: 'Solicitud reenviada para aprobación',
                });
                this.recargarDatos();
            },
            error: () => this.guardando.set(false),
            complete: () => this.guardando.set(false),
        });
    }

    private recargarDatos() {
        this.cargarDashboard();
    }

    private cargarDashboard() {
        this.vacacionService.getDashboard(this.empleadoId()!).subscribe({
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
