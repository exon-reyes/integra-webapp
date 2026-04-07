import {ChangeDetectionStrategy, Component, computed, inject, input, output, signal, ViewChild} from '@angular/core';
import {Button} from 'primeng/button';
import {Popover, PopoverModule} from 'primeng/popover';
import {DialogModule} from 'primeng/dialog';
import {TimelineModule} from 'primeng/timeline';
import {Festivo, SolicitudEmpleado} from "@/modules/vacacion/models/vacacion.model";
import {DatePipe} from '@angular/common';
import {EmpleadoTiempoHistorialDTO, VacacionService} from '../../services/vacacion.service';
import {StateComponent} from "@/components/state.component";

// ─── Tipos internos ────────────────────────────────────────────────────────

type DayKind=
    | 'selected'
    | 'today'
    | 'festivo'
    | 'descanso'
    | 'descansoPendiente'
    | 'cancelada'
    | 'pendiente'
    | 'disfrutada'
    | 'aprobada'
    | 'disabled'
    | 'default';

interface DayState {
    kind: DayKind;
    /** Clases Tailwind ya resueltas = BASE_CLS + KIND_CLS[kind] */
    cls: string;
    tooltip: string;
}

interface DayCell {
    /** Número del día (1-31) */
    day: number;
    /** YYYY-MM-DD pre-formateado — evita recalcular en template */
    date: string;
    fechaSolicitud?: string;
    state: DayState;
}

interface MonthData {
    name: string;
    monthIndex: number;
    /** Cantidad de celdas vacías antes del día 1 */
    startBlanks: number;
    cells: readonly DayCell[];
}

/**
 * Metadata de un evento de calendario usado para renderizar el popover.
 * Toda la lógica de cancelabilidad se decide aquí, en el markerMap.
 */
interface EventMarker {
    kind: DayKind;
    /** Texto para el atributo title del botón (accesibilidad) */
    tooltip: string;
    /** Encabezado del popover (ej. "Descanso pendiente") */
    label: string;
    fechaSolicitud?: string;
    /** Detalle/comentario opcional mostrado en el popover */
    motivo?: string;
    /** ID del evento para emitir en el output de cancelación */
    id?: number;
    /**
     * true  → mostrar botón "Cancelar" en el popover.
     * Solo aplica a descansos PENDIENTE y solicitudes PENDIENTE.
     */
    cancelable: boolean;
    /** Discrimina el output de cancelación a usar */
    eventType?: 'descanso' | 'solicitud';
}

// ─── Estilos centralizados ─────────────────────────────────────────────────

const KIND_CLS: Readonly<Record<DayKind, string
>>={
    selected: 'bg-sky-500 text-white font-bold ring-2 ring-sky-300 ring-offset-1 scale-105 shadow-md',
    today: 'bg-sky-50 text-sky-700 font-bold ring-1 ring-sky-300 hover:bg-sky-100',
    festivo: 'bg-purple-200 text-slate-500 font-medium cursor-default',
    descanso: 'bg-emerald-200 text-emerald-800 border border-dashed border-emerald-400 cursor-pointer hover:bg-emerald-300',
    descansoPendiente: 'bg-amber-50 text-amber-700 border border-dashed border-2 border-amber-400 cursor-pointer hover:bg-amber-100',
    cancelada: 'bg-red-400 text-white line-through cursor-pointer hover:bg-gray-200',
    pendiente: 'bg-white text-amber-600 border-2 border-double border-amber-400 cursor-pointer hover:bg-amber-50',
    disfrutada: 'bg-green-600 text-white cursor-pointer hover:bg-green-700',
    aprobada: 'bg-blue-500 text-white font-semibold shadow-sm cursor-pointer hover:bg-blue-600',
    disabled: 'opacity-30 cursor-not-allowed pointer-events-none',
    default: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
} as const;

/** Clases base fusionadas con KIND_CLS — binding directo [class], sin interpolación */
const BASE_CLS='flex items-center justify-center text-sm h-7 rounded-lg transition-all duration-150 select-none w-full';
const FULL_CLS=Object.fromEntries((Object.keys(KIND_CLS) as DayKind[]).map(k => [
    k, `${BASE_CLS} ${KIND_CLS[k]}`,
])) as Readonly<Record<DayKind, string>>;

/** Clases para el badge de estatus dentro del popover */
const KIND_BADGE: Readonly<Record<DayKind, string
>>={
    selected: 'bg-sky-100 text-sky-700',
    today: 'bg-sky-50 text-sky-700',
    festivo: 'bg-purple-100 text-purple-700',
    descanso: 'bg-emerald-100 text-emerald-800',
    descansoPendiente: 'bg-amber-100 text-amber-700',
    cancelada: 'bg-red-100 text-red-700',
    pendiente: 'bg-amber-100 text-amber-700',
    disfrutada: 'bg-green-100 text-green-700',
    aprobada: 'bg-blue-100 text-blue-700',
    disabled: 'bg-slate-100 text-slate-400',
    default: 'bg-slate-100 text-slate-600',
} as const;

// ─── Constantes fuera de la clase ─────────────────────────────────────────

const MONTH_NAMES=[
    'Enero',
    'Febrero',
    'Marzo',
    'Abril',
    'Mayo',
    'Junio',
    'Julio',
    'Agosto',
    'Septiembre',
    'Octubre',
    'Noviembre',
    'Diciembre',
] as const;

const DAY_HEADERS=['D', 'L', 'M', 'M', 'J', 'V', 'S'] as const;

const LEGEND: ReadonlyArray<{ kind: DayKind; label: string }>=[
    {kind: 'aprobada', label: 'Vacaciones aprobadas'},
    {kind: 'disfrutada', label: 'Disfrutada'},
    {kind: 'pendiente', label: 'Vacaciones Pendientes'},
    {kind: 'cancelada', label: 'Cancelada'},
    {kind: 'festivo', label: 'Festivo'},
    {kind: 'descanso', label: 'Descansos aprobados'},
    {kind: 'today', label: 'Hoy'},
    {kind: 'descansoPendiente', label: 'Descansos pdte. de aprobación'},
];

/** Fecha de hoy normalizada, calculada una sola vez en módulo-load */
const TODAY_STR=(() => {
    const t=new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
})();

/** Formatea YYYY-MM-DD sin crear un objeto Date */
function fmtDate(y: number,
                 m: number,
                 d: number): string {
    return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

/** Timestamp a medianoche sin crear strings intermedios */
function midnightTs(y: number,
                    m: number,
                    d: number): number {
    return new Date(y, m, d).getTime();
}

@Component({
    selector: 'app-vacacion-calendar',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [PopoverModule, DialogModule, TimelineModule, Button, DatePipe, StateComponent],
    template: `
        <div class="select-none">

            <!-- ── Leyenda ──────────────────────────────────────────────────── -->
            <div class="flex flex-wrap gap-x-5 gap-y-2 mb-6 text-sm font-medium justify-center">
                @for (item of legend; track item.kind) {
                    <span class="flex items-center gap-1.5">
            <span class="inline-block w-4 h-4 rounded" [class]="kindCls(item.kind)"></span>
                        {{ item.label }}
          </span>
                }
            </div>

            <!-- ── Grid de meses ────────────────────────────────────────────── -->
            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-2">

                @for (month of calendarData(); track month.monthIndex) {
                    <section class="rounded bg-white border border-slate-100 shadow-xs p-3 min-w-0">

                        <h6>
                            {{ month.name }}
                        </h6>

                        <div class="grid grid-cols-7 gap-0.5">

                            <!-- Cabeceras de días -->
                            @for (h of dayHeaders; track h + $index) {
                                <div class="flex items-center justify-center text-[10px] font-semibold h-6">
                                    {{ h }}
                                </div>
                            }

                            <!-- Offset inicial: un solo @for con $count, sin array -->
                            @for (_ of blankRange(month.startBlanks); track $index) {
                                <div class="h-7"></div>
                            }

                            <!-- Días — click unificado para todos los tipos -->
                            @for (cell of month.cells; track cell.date) {
                                <button
                                    type="button"
                                    [class]="cell.state.cls"
                                    [title]="cell.state.tooltip"
                                    [attr.aria-label]="cell.state.tooltip || cell.date"
                                    [attr.aria-disabled]="cell.state.kind === 'disabled'"
                                    [attr.aria-pressed]="cell.state.kind === 'selected'"
                                    (click)="handleDayClick($event, cell.date, cell.state.kind)"
                                >{{ cell.day }}
                                </button>
                            }

                        </div>
                    </section>
                }

            </div>

            <!-- ── Popover unificado para todos los eventos ───────────────── -->
            <p-popover #eventPopover>
                @if (popoverData(); as data) {
                    <div class="flex flex-col w-80">

                        <!-- Header con título y botón cerrar -->
                        <div class="flex items-center justify-between px-3 py-2 border-b border-slate-200">
                            <div class="text-lg  font-semibold text-blue-800">
                                @if (data.eventType === 'solicitud' && anioGestion()) {
                                    Vacaciones dignas {{ anioGestion() }}
                                } @else if (data.eventType === 'descanso') {
                                    Ausencia
                                } @else if (data.kind === 'festivo') {
                                    Festivo
                                } @else {
                                    Vacaciones
                                }
                            </div>
                        </div>
                        <!-- Grid de información -->
                        <div class="grid grid-cols-2 gap-x-4 gap-y-3 px-3 py-4 text-sm">
                            <div class="font-semibold">Estatus:</div>
                            <div>


                                <span class="px-2 py-0.5 rounded-md font-semibold"
                                       [class]="kindBadgeCls(data.kind)">{{ data.label }}</span>

                            </div>

                            @if (data.fechaSolicitud) {
                                <div class="font-semibold ">Fecha de solicitud:</div>
                                {{ data.fechaSolicitud | date:'dd/MM/yyyy' }}
                            }

                            @if (data.motivo) {
                                <div
                                    class="italic my-3 pt-3 col-span-2 border-t border-slate-200">{{ data.motivo }}
                                </div>
                            }
                        </div>

                        <!-- Acciones -->
                        <div class="flex flex-col gap-2 mt-3">
                            <p-button label="Ver Historial" icon="pi pi-history"
                                      styleClass="w-full"
                                      (onClick)="verHistorial()"></p-button>
                            @if (data.cancelable) {
                                <p-button label="Cancelar día solicitado" severity="danger" styleClass="w-full"

                                          (onClick)="confirmarCancelacion()"></p-button>
                            }
                            @if (data.reactivable) {
                                <p-button label="Volver a solicitar" icon="pi pi-replay" severity="warn"
                                          styleClass="w-full"
                                          (onClick)="confirmarReactivacion()"></p-button>
                            }
                        </div>
                    </div>
                }
            </p-popover>

            <!-- ── Dialog de Historial ────────────────────────────────────── -->
            <p-dialog header="Historial de eventos"
                      [modal]="true"
                      [(visible)]="displayHistorial"
                      [style]="{ width: '32rem' }"
                      [dismissableMask]="true">

                @if (historialData()) {
                    @if (historialData()?.length > 0) {

                        <!-- Contenedor principal -->
                        <div class="relative max-h-[70vh] overflow-y-auto pr-2">

                            <!-- Línea vertical con gradiente -->
                            <div class="absolute left-4 top-0 bottom-0 w-[2px] bg-gradient-to-b from-blue-500 via-indigo-400 to-transparent"></div>

                            <ol class="space-y-6 ml-6">

                                @for (item of historialData(); track item.id; let last = $last) {

                                    <li class="relative">

                                        <!-- Card -->
                                        <div class="group relative bg-white/70 backdrop-blur-md border border-white/40 shadow-lg rounded-xl p-4 hover:shadow-xl transition-all duration-300">

                                            <!-- Glow hover -->
                                            <div class="absolute inset-0 rounded-xl bg-gradient-to-r from-blue-500/0 via-blue-500/10 to-indigo-500/0 opacity-0 group-hover:opacity-100 transition"></div>

                                            <!-- Header -->
                                            <div class="flex justify-between items-start mb-2">
                                                <div class="flex flex-col">
                                        <span class="text-sm font-semibold text-blue-700 tracking-wide uppercase">
                                            {{ item.tipoEvento }}
                                        </span>
                                                    <span class="text-sm text-gray-500">
                                            {{ item.fechaEvento | date:'dd MMM yyyy · HH:mm' }}
                                        </span>
                                                </div>

                                                <!-- Badge decorativo -->
                                                <span class="text-[10px] px-2 py-1 rounded-full bg-blue-100 text-blue-700 font-semibold shadow-sm">
                                        Evento
                                    </span>
                                            </div>

                                            <!-- Divider -->
                                            <div class="h-px w-full bg-gradient-to-r from-transparent via-gray-300 to-transparent my-2"></div>

                                            <!-- Contenido -->
                                            <div class="text-sm text-gray-700 leading-relaxed"
                                                 [innerHTML]="item.comentario">
                                            </div>

                                        </div>

                                    </li>

                                }

                            </ol>

                        </div>

                    } @else {

                        <!-- Empty state más moderno -->
                        <div class="flex flex-col items-center justify-center py-10 text-center">

                            <div class="h-14 w-14 rounded-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center shadow-inner mb-4">
                                <i class="pi pi-inbox text-gray-500 text-xl"></i>
                            </div>

                            <span class="text-gray-700 font-semibold text-sm">
                    Sin registros
                </span>

                            <span class="text-gray-500 text-xs mt-1">
                    No se han registrado eventos de la solicitud
                </span>

                        </div>

                    }
                }

            </p-dialog>

        </div>
    `,
})
export class VacacionCalendarComponent {

    readonly displayHistorial=signal(false);
    readonly historialData=signal<EmpleadoTiempoHistorialDTO[]>([]);
    readonly year=input.required<number>();

    // ── Inputs ────────────────────────────────────────────────────────────
    readonly festivos=input<Festivo[]>([]);
    readonly descansos=input<SolicitudEmpleado[]>([]);
    readonly descansosPendientes=input<SolicitudEmpleado[]>([]);
    readonly aprobadas=input<SolicitudEmpleado[]>([]);
    readonly disfrutadas=input<SolicitudEmpleado[]>([]);
    readonly pendientes=input<SolicitudEmpleado[]>([]);
    readonly canceladas=input<SolicitudEmpleado[]>([]);
    readonly descansosCancelados=input<SolicitudEmpleado[]>([]);
    readonly anioGestion=input<number>();
    readonly selectionMode=input<'read' | 'multiple'>('read');
    readonly selectedDates=input<string[]>([]);
    readonly minDate=input<Date | null>(null);
    readonly maxDate=input<Date | null>(null);
    /**
     * Habilita el botón "Cancelar" en el popover para descansos PENDIENTES.
     * Por defecto `false` — actívalo solo en vistas de gestión de descansos.
     */
    readonly allowCancelDescanso=input<boolean>(false);
    /**
     * Habilita el botón "Cancelar" en el popover para solicitudes de vacaciones PENDIENTES.
     * Por defecto `false` — actívalo solo en vistas de gestión de vacaciones.
     */
    readonly allowCancelSolicitud=input<boolean>(false);
    /**
     * Habilita el botón "Volver a solicitar" (reactivar) en el popover para solicitudes CANCELADAS.
     * Por defecto `false` — en el dashboard no se debe de ver el botón de reactivar.
     */
    readonly allowReactivar=input<boolean>(false);
    /**
     * Habilita la selección de días festivos en modo 'multiple' emitiendo dayClicked en lugar de abrir el popover.
     */
    readonly allowFestivoSelection=input<boolean>(false);
    readonly dayClicked=output<{ date: string; jsDate: Date }>();

    // ── Outputs ───────────────────────────────────────────────────────────
    /** Emite el ID del descanso PENDIENTE a cancelar */
    readonly descansoPendienteCancel=output<number>();
    /** Emite el ID de la solicitud de vacaciones PENDIENTE a cancelar */
    readonly solicitudCancel=output<number>();
    /** Emite el ID de la solicitud CANCELADA a reactivar (volver a PENDIENTE) */
    readonly solicitudReactivar=output<{ id: number; eventType: 'descanso' | 'solicitud' }>();
    @ViewChild('eventPopover') eventPopover!: Popover;

    // ── Estado del popover ────────────────────────────────────────────────
    readonly popoverData=signal<{
        kind: DayKind;
        label: string;
        motivo?: string;
        id?: number;
        cancelable: boolean;
        reactivable: boolean;
        fechaSolicitud?: string;
        eventType?: 'descanso' | 'solicitud';
    } | null>(null);
    readonly dayHeaders=DAY_HEADERS;

    // ── Constantes expuestas al template ──────────────────────────────────
    readonly legend=LEGEND;
    private readonly vacacionService=inject(VacacionService);
    private readonly selectedSet=computed(() => new Set(this.selectedDates()));
    private readonly minDateTs=computed<number | null>(() => {
        const d=this.minDate();
        return d ? midnightTs(d.getFullYear(), d.getMonth(), d.getDate()) : null;
    });
    private readonly maxDateTs=computed<number | null>(() => {
        const d=this.maxDate();
        return d ? midnightTs(d.getFullYear(), d.getMonth(), d.getDate()) : null;
    });

    // ── Computed auxiliares (privados) ────────────────────────────────────
    /**
     * Mapa de marcadores de eventos enriquecido.
     *
     * Cada entrada incluye la metadata necesaria para renderizar el popover:
     * tipo, label, comentario, id y si el evento es cancelable.
     *
     * Regla de cancelabilidad:
     *  - Disfrutada -> no cancelable
     *  - Cualquier otro estado -> cancelable si se habilita allowCancelDescanso/allowCancelSolicitud
     */
    private readonly markerMap=computed(() => {
        const map=new Map<string, EventMarker>();

        const add=(fecha: string | undefined,
                   data: Omit<EventMarker, 'tooltip'>) => {
            if(!fecha) return;
            const tooltip=data.motivo ? `${data.label}: ${data.motivo}` : data.label;
            map.set(fecha, {...data, tooltip});
        };

        // Festivos — solo informativos, no cancelables
        this.festivos().forEach(f => add(f.fecha, {
            kind: 'festivo', label: f.nombre ?? 'Festivo', cancelable: false,
        }));

        // Descansos aprobados — cancelables si allowCancelDescanso = true
        this.descansos().forEach(d => add(d.fecha, {
            kind: 'descanso',
            label: 'Descanso aprobado',
            motivo: d.comentario,
            id: d.id,
            cancelable: this.allowCancelDescanso() && d.estatus?.toUpperCase() !== 'DISFRUTADA',
            eventType: 'descanso',
            fechaSolicitud: d.createdAt || undefined,
        }));

        // Descansos PENDIENTES — cancelables si allowCancelDescanso = true
        this.descansosPendientes().forEach(d => add(d.fecha, {
            kind: 'descansoPendiente',
            label: 'Descanso pdte. de validar',
            motivo: d.comentario,
            id: d.id,
            cancelable: this.allowCancelDescanso() && d.estatus?.toUpperCase() !== 'DISFRUTADA',
            eventType: 'descanso',
            fechaSolicitud: d.createdAt || undefined,
        }));

        // Helper para solicitudes de vacaciones (un solo día por registro)
        const addSolicitud=(s: SolicitudEmpleado,
                            kind: DayKind,
                            label: string,
                            cancelable=false) => {
            if(s.fecha) {
                add(s.fecha, {
                    kind,
                    label,
                    motivo: s.comentario || undefined,
                    id: s.id || undefined,
                    cancelable: cancelable && s.estatus?.toUpperCase() !== 'DISFRUTADA',
                    eventType: 'solicitud',
                    fechaSolicitud: s.createdAt || undefined,
                });
            }
        };

        this.disfrutadas().forEach(s => addSolicitud(s, 'disfrutada', 'Disfrutada', false));
        this.aprobadas().forEach(s => addSolicitud(s, 'aprobada', 'Aprobada', false)); // aprobadas: el usuario no puede cancelar
        // Solicitudes PENDIENTES
        this.pendientes().forEach(s => addSolicitud(s, 'pendiente', 'Pdte. validar', this.allowCancelSolicitud()));

        // Solicitudes CANCELADAS (vacaciones y descansos)
        this.canceladas().forEach(s => addSolicitud(s, 'cancelada', 'Cancelada', false));
        this.descansosCancelados().forEach(d => add(d.fecha, {
            kind: 'cancelada',
            label: 'Descanso cancelado',
            motivo: d.comentario,
            id: d.id,
            cancelable: false,
            eventType: 'descanso',
            fechaSolicitud: d.createdAt || undefined,
        }));

        return map;
    });
    /**
     * ★ Computed maestro unificado — estructura de meses + estados de días.
     */
    readonly calendarData=computed<readonly MonthData[]>(() => {
        const y=this.year();
        const markers=this.markerMap();
        const selected=this.selectedSet();
        const minTs=this.minDateTs();
        const maxTs=this.maxDateTs();
        const mode=this.selectionMode();

        return MONTH_NAMES.map((name,
                                m) => {
            const daysInMonth=new Date(y, m + 1, 0).getDate();
            const startBlanks=new Date(y, m, 1).getDay();
            const cells: DayCell[]=[];

            for(let d=1; d<=daysInMonth; d++) {
                const date=fmtDate(y, m, d);
                const state=resolveState(date, y, m, d, minTs, maxTs, mode, selected, markers);
                cells.push({day: d, date, state});
            }

            return {name, monthIndex: m, startBlanks, cells};
        });
    });

    kindCls(kind: DayKind): string {
        return KIND_CLS[kind];
    }

    kindBadgeCls(kind: DayKind): string {
        return KIND_BADGE[kind];
    }

    /**
     * Genera un array de longitud `n` para el @for de blancos.
     */
    blankRange(n: number): readonly unknown[] {
        return BLANK_RANGES[n];
    }

    // ── Handlers ──────────────────────────────────────────────────────────

    /**
     * Click unificado para todos los días del calendario.
     *
     * - Días con evento (festivo, descanso, vacación): abre popover con info
     *   y, si el evento es cancelable (PENDIENTE), muestra botón de cancelar.
     * - Días libres: emite `dayClicked` para selección normal.
     */
    handleDayClick(event: Event,
                   date: string,
                   kind: DayKind): void {
        if(kind === 'disabled') return;

        const marker=this.markerMap().get(date);

        if(marker) {
            if (marker.kind === 'festivo' && this.selectionMode() === 'multiple' && this.allowFestivoSelection()) {
                const [y, m, d]=date.split('-').map(Number);
                const currentTs = new Date(y, m - 1, d).getTime();
                const minTs = this.minDateTs();
                const maxTs = this.maxDateTs();

                const isOutOfRange = (minTs !== null && currentTs < minTs) || (maxTs !== null && currentTs > maxTs);

                if (!isOutOfRange) {
                    this.dayClicked.emit({date, jsDate: new Date(y, m - 1, d)});
                    return;
                }
            }

            this.popoverData.set({
                kind: marker.kind,
                label: marker.label,
                motivo: marker.motivo,
                id: marker.id,
                fechaSolicitud: marker.fechaSolicitud,
                cancelable: marker.cancelable,
                reactivable: this.allowReactivar() && marker.kind === 'cancelada' && date>=TODAY_STR,
                eventType: marker.eventType,
            });
            this.eventPopover.show(event);
            return;
        }

        // Día sin evento → emite dayClicked (modo selección)
        const [y, m, d]=date.split('-').map(Number);
        this.dayClicked.emit({date, jsDate: new Date(y, m - 1, d)});
    }

    /**
     * Confirma la cancelación del evento activo en el popover.
     * Emite el output correspondiente según el tipo de evento.
     */
    confirmarCancelacion(): void {
        const data=this.popoverData();
        if(!data?.id) return;

        if(data.eventType === 'descanso') {
            this.descansoPendienteCancel.emit(data.id);
        } else if(data.eventType === 'solicitud') {
            this.solicitudCancel.emit(data.id);
        }

        this.popoverData.set(null);
        this.eventPopover.hide();
    }

    /**
     * Abre el diálogo con el historial de la solicitud.
     */
    verHistorial(): void {
        const data=this.popoverData();
        if(!data?.id) return;

        this.vacacionService.getLineaTiempo(data.id).subscribe({
            next: (res) => {
                this.historialData.set(res.data);
                this.displayHistorial.set(true);
            }, error: (err) => {
                console.error('Error fetching timeline', err);
            },
        });
    }

    /**
     * Reactivar una solicitud cancelada — emite el output para que el padre la procese.
     */
    confirmarReactivacion(): void {
        const data=this.popoverData();
        if(!data?.id || !data.eventType) return;

        this.solicitudReactivar.emit({id: data.id, eventType: data.eventType});
        this.popoverData.set(null);
        this.eventPopover.hide();
    }
}

// ─── Función pura de resolución de estado (fuera de la clase) ──────────────

function resolveState(date: string,
                      y: number,
                      m: number,
                      d: number,
                      minTs: number | null,
                      maxTs: number | null,
                      mode: 'read' | 'multiple',
                      selected: ReadonlySet<string>,
                      markers: ReadonlyMap<string, EventMarker>): DayState {

    // 1. Marcador de evento (siempre visible, incluso antes de minDate/después de maxDate)
    const marker=markers.get(date);
    if(marker) {
        return {kind: marker.kind, cls: FULL_CLS[marker.kind], tooltip: marker.tooltip};
    }

    const currentTs=midnightTs(y, m, d);

    // 2. Deshabilitado por rango (antes de minDate o después de maxDate)
    if((minTs !== null && currentTs<minTs) || (maxTs !== null && currentTs>maxTs)) {
        return DISABLED_STATE;
    }

    // 3. Seleccionado
    if(mode === 'multiple' && selected.has(date)) {
        return {kind: 'selected', cls: FULL_CLS['selected'], tooltip: date};
    }

    // 4. Hoy
    if(date === TODAY_STR) return TODAY_STATE;

    // 5. Normal
    return DEFAULT_STATE;
}

// ─── Estados y rangos de blancos pre-construidos ───────────────────────────

const DISABLED_STATE: DayState={kind: 'disabled', cls: FULL_CLS['disabled'], tooltip: ''};
const TODAY_STATE: DayState={kind: 'today', cls: FULL_CLS['today'], tooltip: 'Hoy'};
const DEFAULT_STATE: DayState={kind: 'default', cls: FULL_CLS['default'], tooltip: ''};

/** Arrays de blancos 0-6 pre-construidos — reutilizados por referencia en cada render */
const BLANK_RANGES: ReadonlyArray<readonly unknown[]>=Array.from({length: 7}, (_,
                                                                               i) => Object.freeze(Array(i).fill(null)));
