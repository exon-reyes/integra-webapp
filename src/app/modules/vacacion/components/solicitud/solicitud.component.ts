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
import {ResumenVacaciones} from '@/components/resumen-vacaciones';
import {RouterLink} from "@angular/router";
import {HasPermissionDirective} from "@/core/security/HasPermissionDirective";
import {Autoridades} from "@/core/Autoridades";

@Component({
    selector: 'app-solicitud-vacaciones', standalone: true, imports: [
        FormsModule, Button, VacacionCalendarComponent, Title, Dialog, DatePicker, InputText, ResumenVacaciones,
        RouterLink, HasPermissionDirective,
    ], template: `
        <app-title imageSrc="/assets/icon/vacation.svg"
                   title="Gestión de vacaciones"
                   description="Selecciona los días que deseas tomar como vacaciones">
        </app-title>

        <hr class="border-gray-200 mb-6"/>
        <div class="flex flex-row gap-2 mb-4 justify-between">
            <div class="flex flex-row gap-2">
                <p-button label="Registrar descansos" icon="pi pi-calendar-clock"
                          routerLink="/integra/vacaciones/descansos" severity="warn"></p-button>

                <p-button label="Mis solicitudes" icon="pi pi-home"
                          routerLink="/integra/vacaciones/dashboard"></p-button>
            </div>
            <p-button icon="pi pi-refresh"></p-button>
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

                <app-resumen-vacaciones
                    [vacaciones]="dashboard()?.vacaciones"
                    [periodo]="dashboard()?.periodoVacacional">
                </app-resumen-vacaciones>
            </div>

            <!-- Calendar section -->
            <div class="flex-1 bg-white rounded-xl border border-gray-200 p-5">
                <app-vacacion-calendar
                    [year]="calendarYear()"
                    selectionMode="multiple"
                    [festivos]="festivos()"
                    [minDate]="hoy"
                    [maxDate]="maxDate()"
                    [anioGestion]="dashboard()?.periodoVacacional?.anioGestion"
                    [descansos]="dashboard()?.descansos?.aprobadas || []"
                    [descansosPendientes]="dashboard()?.descansos?.pendientes || []"
                    [aprobadas]="dashboard()?.vacaciones?.aprobadas || []"

                    [disfrutadas]="dashboard()?.vacaciones?.disfrutadas || []"
                    [pendientes]="dashboard()?.vacaciones?.pendientes || []"
                    [canceladas]="dashboard()?.vacaciones?.canceladas || []"
                    [descansosCancelados]="dashboard()?.descansos?.canceladas || []"
                    [allowCancelSolicitud]="true"
                    (dayClicked)="onDayClicked($event)"
                    (solicitudCancel)="cancelarSolicitud($event)"
                    (solicitudReactivar)="reactivarSolicitud($event)">
                </app-vacacion-calendar>
            </div>
        </div>

        <!-- Dialog para registrar vacaciones -->
        <p-dialog
            header="Solicitud de vacaciones"
            [(visible)]="dialogVisible"
            [modal]="true"
            [style]="{width: '480px'}"
            [closable]="true"
            [draggable]="false"
            [styleClass]="'p-fluid'">

            @if (calculoBase(); as c) {
                <div
                    class="flex items-center justify-between mb-6 rounded-lg border shadow-sm bg-white overflow-hidden transition-all duration-300"
                    [class.border-blue-200]="c.puedeSolicitar"
                    [class.border-red-400]="!c.puedeSolicitar"
                >
                    <!-- Icono o imagen a la izquierda -->
                    <div class="shrink-0 bg-gray-100 p-4">
                        <img
                            src="/assets/img/card.webp"
                            alt="Decorativo"
                            class="w-20 h-20 object-cover rounded-md"
                        />
                    </div>

                    <!-- Contenido principal -->
                    <div class="flex-1 px-6 py-4">
                        <div
                            class="text-lg font-semibold"
                            [class.text-red-700]="!c.puedeSolicitar"
                        >
                            Saldo disponible: {{ c.saldoDisponible }} días
                        </div>

                        @if (!c.puedeSolicitar) {
                            <div class="mt-2 flex items-center gap-2 text-sm text-red-600">
                                <i class="pi pi-exclamation-circle text-red-500"></i>
                                <span>
            La selección de fechas excede tu saldo o es inválida.
            <span class="font-medium">{{ c.mensajeError }}</span>
          </span>
                            </div>
                        } @else {
                            <div class="mt-2 text-sm text-blue-600">
                                <span class="font-medium">Días a descontar:</span> {{ c.diasLaborables }}
                            </div>
                        }
                    </div>
                </div>
            }

            <div class="flex flex-col gap-6 p-2 mt-3">
                <!-- Fechas -->
                <div class="flex gap-4">
                    <div class="flex flex-col flex-1">
                        <label for="fechaInicio" class="text-sm font-semibold text-gray-700">Fecha inicial</label>
                        <p-datePicker id="fechaInicio" [(ngModel)]="dialogFechaInicio" [showIcon]="true"
                                      dateFormat="dd/mm/yy" [minDate]="hoy" [maxDate]="dialogFechaFin ?? undefined"
                                      class="w-full"
                                      appendTo="body" (ngModelChange)="recalcularDias()"></p-datePicker>
                    </div>
                    <div class="flex flex-col flex-1">
                        <label for="fechaFin" class="text-sm font-semibold text-gray-700">Fecha final</label>
                        <p-datePicker id="fechaFin" [(ngModel)]="dialogFechaFin" [showIcon]="true" dateFormat="dd/mm/yy"
                                      appendTo="body" [minDate]="dialogFechaInicio" [maxDate]="maxDate() ?? undefined"
                                      [showOnFocus]="false" class="w-full"
                                      (ngModelChange)="recalcularDias()"></p-datePicker>
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
                        *hasPermission="Autoridades.VACACIONES_CREAR_SOLICITUD_AUSENCIAS"
                        label="Confirmar"
                        icon="pi pi-check"
                        [disabled]="guardando() || !puedeEnviar()"
                        [loading]="guardando()"
                        (onClick)="confirmarVacaciones()">
                    </p-button>
                </div>
            </ng-template>
        </p-dialog>
    `,
})
export class SolicitudVacacionesComponent implements OnInit {

    empleadoId=signal<number | null>(null);
    calendarYear=signal<number>(new Date().getFullYear());
    hoy=new Date();
    maxDate=signal<Date | null>(null);

    // Dialog state
    dialogVisible=false;
    dialogFechaInicio: Date | null=null;
    dialogFechaFin: Date | null=null;
    dialogComentario='';

    // Cálculo en vivo de la selección actual
    calculoBase=signal<any | null>(null);

    protected readonly dashboard=signal<DashboardVacacion | null>(null);
    protected readonly festivos=signal<Festivo[]>([]);
    protected readonly guardando=signal(false);

    // Fechas bloqueadas estáticamente para no poder seleccionarlas como inicio
    // (Festivos, descansos aprobados/pendientes, y todas las solicitudes)
    private fechasBloqueadas=computed<Set<string>>(() => {
        const set=new Set<string>();
        const desc=this.dashboard()?.descansos;
        const vac=this.dashboard()?.vacaciones;

        desc?.aprobadas?.forEach(d => {
            if(d.fecha) set.add(d.fecha);
        });
        desc?.pendientes?.forEach(d => {
            if(d.fecha) set.add(d.fecha);
        });

        vac?.aprobadas?.forEach(v => {
            if(v.fecha) set.add(v.fecha);
        });
        vac?.pendientes?.forEach(v => {
            if(v.fecha) set.add(v.fecha);
        });

        vac?.disfrutadas?.forEach(v => {
            if(v.fecha) set.add(v.fecha);
        });

        this.festivos().forEach(f => {
            if(f.fecha) set.add(f.fecha);
        });
        return set;
    });

    private readonly vacacionService=inject(VacacionService);
    private readonly vacacionAdminService=inject(VacacionAdminService);
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
            next: res => this.festivos.set((res as any).data ?? []),
        });
        this.cargarDashboard();
    }

    onDayClicked(event: { date: string; jsDate: Date }) {
        // Ignorar días ya registrados o bloqueados
        if(this.fechasBloqueadas().has(event.date)) return;

        // Abrir dialog con la fecha seleccionada
        this.dialogFechaInicio=event.jsDate;
        this.dialogFechaFin=event.jsDate;
        this.dialogComentario='';
        this.calculoBase.set(null);
        this.recalcularDias();
        this.dialogVisible=true;
    }

    recalcularDias() {
        if(!this.dialogFechaInicio || !this.dialogFechaFin) {
            this.calculoBase.set(null);
            return;
        }

        // Swap si el inicio es mayor al final (por comodidad del usuario)
        let inicioDate=new Date(this.dialogFechaInicio);
        let finDate=new Date(this.dialogFechaFin);
        inicioDate.setHours(0, 0, 0, 0);
        finDate.setHours(0, 0, 0, 0);

        if(inicioDate>finDate) {
            const temp=inicioDate;
            inicioDate=finDate;
            finDate=temp;
            this.dialogFechaInicio=inicioDate;
            this.dialogFechaFin=finDate;
        }

        // Obtener el rango de días y filtrar los bloqueados (festivos, otras solicitudes)
        const rangoCompleto=this.generarRangoFechas(inicioDate, finDate);
        const diasValidos=rangoCompleto.filter(fechaIso => !this.fechasBloqueadas().has(fechaIso));

        const saldoDisponible=this.dashboard()?.periodoVacacional?.diasRestantes ?? 0;
        const diasLaborables=diasValidos.length;

        const tieneSaldo=diasLaborables>0 && diasLaborables<=saldoDisponible;

        this.calculoBase.set({
            puedeSolicitar: tieneSaldo,
            diasLaborables: diasLaborables,
            saldoDisponible: saldoDisponible,
            mensajeError: diasLaborables === 0 ? 'No se seleccionaron días válidos.' : (!tieneSaldo ? 'No tienes suficientes días de saldo disponible.' : null),
        });
    }

    puedeEnviar(): boolean {
        return this.calculoBase()?.puedeSolicitar ?? false;
    }

    confirmarVacaciones() {
        if(!this.dialogFechaInicio || !this.dialogFechaFin || !this.puedeEnviar()) return;

        this.guardando.set(true);
        // Generar el rango pero únicamente con los días que no estén bloqueados
        const diasTodos=this.generarRangoFechas(this.dialogFechaInicio, this.dialogFechaFin);
        const diasSeleccionados=diasTodos.filter(fechaIso => !this.fechasBloqueadas().has(fechaIso));

        const request: SolicitudVacacionRequest={
            usuarioId: this.empleadoId()!,
            diasSeleccionados: diasSeleccionados,
            motivo: this.dialogComentario || undefined,
            tipoSolicitud: 'VACACION',
        };

        this.vacacionService.crearSolicitud(this.empleadoId()!, request).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Proceso completado',
                    detail: 'Solicitud de vacaciones enviada para aprobación',
                });
                this.dialogVisible=false;
                this.recargarDatos();
            }, error: (err) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: err.error?.detail || 'No se pudo crear la solicitud',
                });
                this.guardando.set(false);
            }, complete: () => this.guardando.set(false),
        });
    }

    protected cancelarSolicitud(solicitudId: number) {
        this.guardando.set(true)
        console.log(this.empleadoId())
        this.vacacionAdminService.cancelarSolicitudVacaciones(solicitudId, this.empleadoId()!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Éxito', detail: 'Solicitud cancelada correctamente',
                });
                this.recargarDatos();
            }, error: () => {
                this.guardando.set(false);
            }, complete: () => this.guardando.set(false),
        })
    }

    protected reactivarSolicitud(event: { id: number; eventType: 'descanso' | 'solicitud' }) {
        this.guardando.set(true);
        this.vacacionAdminService.reactivarSolicitud(event.id, this.empleadoId()!).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success', summary: 'Éxito', detail: 'Solicitud reenviada para aprobación',
                });
                this.recargarDatos();
            },
            error: () => this.guardando.set(false),
            complete: () => this.guardando.set(false),
        });
    }

    private generarRangoFechas(inicio: Date,
                               fin: Date): string[] {
        const fechas: string[]=[];
        const current=new Date(inicio);
        while(current<=fin) {
            fechas.push(this.fmt(current));
            current.setDate(current.getDate() + 1);
        }
        return fechas;
    }

    private recargarDatos() {
        this.cargarDashboard();
    }

    private cargarDashboard() {
        this.vacacionService.getDashboard(this.empleadoId()!).subscribe({
            next: (res) => {
                this.dashboard.set(res.data);

                // Configurar máximo de fecha permitido (1 día antes del aniversario)
                if(res.data?.proximoAniversario) {
                    const d=new Date(res.data.proximoAniversario);
                    d.setDate(d.getDate() - 1);
                    this.maxDate.set(d);
                }
            },
        });
    }

    private fmt(date: Date): string {
        const y=date.getFullYear();
        const m=String(date.getMonth() + 1).padStart(2, '0');
        const d=String(date.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
    }

    protected readonly Autoridades=Autoridades;
}
