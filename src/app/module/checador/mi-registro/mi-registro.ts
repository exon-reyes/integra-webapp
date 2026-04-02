import {Component, computed, effect, inject, OnDestroy, OnInit, signal, ViewChild} from '@angular/core';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {Subject, takeUntil} from 'rxjs';

import {WorktimeService} from '../service/worktime.service';
import {Empleado} from '@/core/services/checador/Empleado';
import {TipoPausa} from '@/core/services/checador/TipoPausa';
import {
    Asistencia,
    AsistenciaService,
    EmpleadoReporte,
    Pausa,
    ResumenMesAsistencia,
} from '@/core/services/asistencia/asistencia.service';
import {fechaISOString, obtenerFinDia, obtenerInicioDia, parseLocalDate} from '@/shared/util/date.util';
import {
    RegistroEntradaDialogComponent,
} from '@/shared/component/registro-entrada-dialog/registro-entrada-dialog.component';
import {Autoridades} from "@/core/Autoridades";
import {JWTService} from "@/core/security/JWTService";
import {DateTimeService} from "@/module/checador/registro-manual/services/datetime.service";

import {AsistenciaCardComponent} from "@/components/asistencia/asistencia-card/asistencia-card.component";
import {StateComponent} from "@/components/state.component";
import {Title} from "@/components/title";
import {Button} from "primeng/button";
import {Panel} from "primeng/panel";
import {SpinnerService} from "@/shared/service/spinner.service";
import {Calendar} from "@/components/calendar/calendar";
import {ResumenMes} from "@/components/asistencia/resumen-mes";

@Component({
    standalone: true,
    selector: 'app-mi-registro', imports: [
        AsistenciaCardComponent,
        StateComponent,
        ReactiveFormsModule,
        Title,
        FormsModule,
        Button,
        Panel,
        Calendar,
        ResumenMes,

    ], templateUrl: './mi-registro.html', styleUrl: './mi-registro.scss',
})
export class MiRegistro implements OnInit,
                                   OnDestroy {

    date: Date | undefined=new Date();
    maxDate: Date=new Date();

    /** Empleado autenticado */
    readonly empleadoBuscado=signal<Empleado | null>(null);

    /** Indicadores de estado */
    readonly isLoading=signal(false);
    readonly error=signal<string | null>(null);
    readonly success=signal<string | null>(null);

    /** Datos de asistencia */
    readonly jornadas=signal<EmpleadoReporte[]>([]);
    readonly asistencias=signal<Asistencia[]>([]);
    readonly pausas=signal<Pausa[]>([]);
    /** Resumen del mes en curso: días laborados y no laborados */
    readonly resumenMes=signal<ResumenMesAsistencia | null>(null);

    readonly tiposPausa=[
        {value: 'COMIDA' as TipoPausa, label: 'Comida'}, {value: 'OTRA' as TipoPausa, label: 'Otra'},
    ];

    /** Texto legible de la pausa activa */
    readonly pausaActivaTexto=computed(() => {
        const empleado=this.empleadoBuscado();
        if(!empleado?.tipoPausa) return null;
        return this.tiposPausa.find(p => p.value === empleado.tipoPausa)?.label || empleado.tipoPausa;
    });

    @ViewChild(RegistroEntradaDialogComponent) registroDialog!: RegistroEntradaDialogComponent;
    /** Fechas (días) con registro en el mes mostrado; el backend devuelve strings, se parsean a Date. */
    readonly diasTrabajados=signal<Date[]>([]);
    protected readonly Autoridades=Autoridades;
    protected readonly asistenciaService=inject(AsistenciaService);
    private readonly worktimeService=inject(WorktimeService);
    private readonly permisoService=inject(JWTService);
    private readonly dateTimeService=inject(DateTimeService);
    private readonly destroy$=new Subject<void>();

    constructor(private spinnerService: SpinnerService) {
        this.setupMessageEffects();
    }

    ngOnInit(): void {
        this.consultarEmpleadoSession();
        this.consultarFechasTrabajadasMes(this.date ?? new Date());
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    consultarJornadas(empleadoId: number): void {
        const fechaConsulta=this.date || new Date();

        const params={
            empleadoId,
            desde: fechaISOString(obtenerInicioDia(fechaConsulta)),
            hasta: fechaISOString(obtenerFinDia(fechaConsulta)),
        };

        this.asistenciaService.obtenerAsistencias(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe(response => {
                if(response?.success) {
                    this.jornadas.set(response.data);
                    this.actualizarAsistencias();
                }
            });
    }

    actualizarAsistencias(): void {
        const jornadasData=this.jornadas();

        if(!jornadasData.length) {
            this.asistencias.set([]);
            this.pausas.set([]);
            return;
        }
        const {asistencias=[], puesto}=jornadasData[0];

        const fechaFiltro=this.dateTimeService.formatDate(this.date || new Date());

        const asistenciasFiltradas=asistencias
            .filter(a => a.fecha === fechaFiltro)
            .map(a => ({
                ...a,
                tiempoCalculado: this.asistenciaService.calcularTiempoEnMomento(a),
                diferenciaCalculada: this.asistenciaService.calcularDiferenciaEnMomento(a),
            }));

        this.asistencias.set(asistenciasFiltradas);
        this.pausas.set(asistenciasFiltradas.flatMap(a => a.pausas || []));
    }

    actualizarTabla(): void {
        const empleado=this.empleadoBuscado();
        if(empleado) {
            this.consultarJornadas(empleado.id);
        }
    }

    protected diaSeleccionado(): void {
        const empleado=this.empleadoBuscado();
        if(empleado) {
            this.consultarJornadas(empleado.id);
        }
    }

    /**
     * Carga los días laborados del empleado en el mes de la fecha indicada.
     * El backend devuelve strings "yyyy-MM-dd"; se parsean a Date para el calendario.
     */
    protected consultarFechasTrabajadasMes(fecha: Date): void {
        const id=this.permisoService.getUser().employeeName.id;
        if(!id) return;
        const params={
            empleadoId: id,
            anio: fecha.getFullYear(),
            mes: fecha.getMonth() + 1,
        };
        this.asistenciaService.obtenerDiasLaborados(params)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (res) => {
                    const raw=res?.data ?? [];
                    this.diasTrabajados.set(raw.map((s) => parseLocalDate(s)));
                },
            });
    }

    /** Manejo automático de mensajes temporales */
    private setupMessageEffects(): void {
        effect(() => {
            if(this.success()) {
                setTimeout(() => this.success.set(null), 3000);
            }
        });

        effect(() => {
            if(this.error()) {
                setTimeout(() => this.error.set(null), 5000);
            }
        });
    }

    private consultarEmpleadoSession(): void {
        this.spinnerService.show();
        const id=this.permisoService.getUser().employeeName.id;

        this.worktimeService.consultarEmpleadoPorId(id).subscribe({
            next: ({data}) => {
                this.empleadoBuscado.set(data);
                this.consultarJornadas(data.id);
            },
            complete: () => this.spinnerService.hide(),
            error: () => this.spinnerService.hide(),
        });
    }
}
