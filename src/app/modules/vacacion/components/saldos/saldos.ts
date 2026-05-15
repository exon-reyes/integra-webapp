import {ChangeDetectionStrategy, Component, computed, inject, OnInit, signal,} from '@angular/core';
import {DatePipe} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Title} from '@/components/title';
import {TableModule} from 'primeng/table';
import {CardModule} from 'primeng/card';
import {TagModule} from 'primeng/tag';
import {ProgressBarModule} from 'primeng/progressbar';
import {ButtonModule} from 'primeng/button';
import {InputNumberModule} from 'primeng/inputnumber';
import {DialogModule} from 'primeng/dialog';
import {Select} from 'primeng/select';
import {Menubar} from 'primeng/menubar';
import {SelectButton} from 'primeng/selectbutton';
import {HasPermissionDirective} from '@/core/security/HasPermissionDirective';
import {StatusBadgeComponent} from '@/components/StatusBadgeComponent';
import {VacacionAdminService} from '../../services/vacacion.service';
import {
    EmpleadoAniversarioDTO,
    FiltroAniversario,
    FiltroPeriodo,
    PeriodoVacacionalResumen
} from '../../models/vacacion.model';
import {Autoridades} from '@/core/Autoridades';
import {CatalogoEmpleado, CatalogoEmpleadoService} from '@/service/catalogo-empleado.service';
import {Unidad} from '@/models/empresa/unidad';
import {ContextoConsultaService, RestriccionUsuario} from '@/service/contexto-consulta.service';
import {normalizeProperties} from '@/shared/util/object.util';
import {SpinnerService} from '@/shared/service/spinner.service';
import {StateComponent} from "@/components/state.component";
import {FiltroStorageService} from '@/shared/service/filtro-storage.service';

/** Prefijo de todas las claves de filtro de este módulo en localStorage */
const STORAGE_KEY = 'vacacion:saldos:filtros';

const KEYS = {
    empleadoId:  `${STORAGE_KEY}:empleadoId`,
    unidadId:    `${STORAGE_KEY}:unidadId`,
    supervisorId:`${STORAGE_KEY}:supervisorId`,
    estatus:     `${STORAGE_KEY}:estatus`,
    anioLaboral: `${STORAGE_KEY}:anioLaboral`,
} as const;

type TagSev='success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast';

function startOfMonth(d: Date): Date {
    return new Date(d.getFullYear(), d.getMonth(), 1);
}

function addMonths(d: Date,
                   delta: number): Date {
    const x=new Date(d.getFullYear(), d.getMonth(), 1);
    x.setMonth(x.getMonth() + delta, 1);
    return x;
}

const MS_DIA=864e5;

function partesFecha(iso: string): [number, number, number] {
    const s=(iso.includes('T') ? iso.split('T')[0] : iso.slice(0, 10)).split('-').map(Number);
    return [s[0]!, s[1]!, s[2]!];
}

function diaCalendarioUtc(y: number,
                          m: number,
                          d: number): number {
    return Math.floor(Date.UTC(y, m - 1, d) / MS_DIA);
}

function diasFaltantesAniversario(proximoAniversario: string): number {
    const [ty, tm, td]=partesFecha(proximoAniversario);
    const n=new Date();
    return diaCalendarioUtc(ty, tm, td) - diaCalendarioUtc(n.getFullYear(), n.getMonth() + 1, n.getDate());
}

function ordenAniversario(iso: string): number {
    const [y, m, d]=partesFecha(iso);
    return diaCalendarioUtc(y, m, d);
}

function ordenarPorFechaMasProxima(items: EmpleadoAniversarioDTO[]): EmpleadoAniversarioDTO[] {
    return [...items].sort((a,
                            b) => ordenAniversario(a.proximoAniversario) - ordenAniversario(b.proximoAniversario));
}

function tagSeverity(e: string): TagSev {
    switch(e?.toUpperCase()) {
        case 'VIGENTE':
            return 'success';
        case 'VENCIDO':
        case 'AGOTADO':
        case 'CONSUMIDO':
            return 'danger';
        default:
            return 'info';
    }
}

@Component({
    selector: 'app-saldos',
    standalone: true,
    imports: [
        Title,
        TableModule,
        CardModule,
        TagModule,
        ProgressBarModule,
        ButtonModule,
        InputNumberModule,
        DialogModule,
        DatePipe,
        FormsModule,
        Select,
        Menubar,
        SelectButton,
        HasPermissionDirective,
        StatusBadgeComponent,
        StateComponent,

    ],
    templateUrl: './saldos.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Saldos implements OnInit {
    private readonly catalogoEmpleadoService=inject(CatalogoEmpleadoService);
    private readonly filtroStorage=inject(FiltroStorageService);
    readonly mesFmt='MMMM y';
    // ── Datos del backend ──────────────────────────────────────────────
    saldosData=signal<PeriodoVacacionalResumen[]>([]);
    totalRegistros=signal(0);
    loadingSaldos=signal(false);
    // ── Catálogos ──────────────────────────────────────────────────────
    empleados=signal<CatalogoEmpleado[]>([]);
    supervisores=signal<CatalogoEmpleado[]>([]);
    unidades=signal<Unidad[]>([]);
    // ── Filtros individuales (se restauran desde localStorage al iniciar) ──
    filtroEmpleadoId=signal<number | null>(this.filtroStorage.leer<number | null>(KEYS.empleadoId, null));
    filtroUnidadId=signal<number | null>(this.filtroStorage.leer<number | null>(KEYS.unidadId, null));
    filtroSupervisorId=signal<number | null>(this.filtroStorage.leer<number | null>(KEYS.supervisorId, null));
    filtroEstatus=signal<string | null>(this.filtroStorage.leer<string | null>(KEYS.estatus, null));
    filtroAnioLaboral=signal<number | null>(this.filtroStorage.leer<number | null>(KEYS.anioLaboral, null));
    // ── Paginación ─────────────────────────────────────────────────────
    currentPage=signal(0);
    pageSize=signal(500);
    // ── UI ─────────────────────────────────────────────────────────────
    visibleFiltros=signal(false);
    readonly tieneFiltrosActivos=computed(() =>
        this.filtroEmpleadoId() !== null ||
        this.filtroUnidadId() !== null ||
        this.filtroSupervisorId() !== null ||
        this.filtroAnioLaboral() !== null
    );
    readonly filterOptions=[
        {label: 'Todos', value: null, icon: 'pi-bars'},
        {label: 'Vigentes', value: 'VIGENTE', icon: 'pi-check-circle'},
        {label: 'Consumidos', value: 'CONSUMIDO', icon: 'pi-chart-pie'},
        {label: 'Vencidos', value: 'VENCIDO', icon: 'pi-times-circle'},
    ];
    readonly Autoridades=Autoridades;
    // ── Aniversarios ───────────────────────────────────────────────────
    aniversarios=signal<EmpleadoAniversarioDTO[]>([]);
    loadingAniversarios=signal(false);
    currentDate=signal(startOfMonth(new Date()));
    readonly isCurrentMonth=computed(() => {
        const n=new Date(), c=this.currentDate();
        return c.getFullYear() === n.getFullYear() && c.getMonth() === n.getMonth();
    });
    readonly aniversariosRows=computed(() =>
        this.aniversarios().map(aniv => ({
            aniv,
            diasFaltantes: diasFaltantesAniversario(aniv.proximoAniversario),
        }))
    );
    readonly tagSev=tagSeverity;
    private spinner=inject(SpinnerService);
    private readonly vacacion=inject(VacacionAdminService);
    private readonly contexto=inject(ContextoConsultaService);
    private restriccion!: RestriccionUsuario;


    constructor() {
    }

    get tieneRestriccion(): boolean {
        return this.restriccion?.tieneRestriccion ?? false;
    }

    // ── Acciones ───────────────────────────────────────────────────────

    ngOnInit(): void {
        this.restriccion=this.contexto.resolverRestriccion({
            keySupervisor: Autoridades.VACACIONES_SALDO_FILTRO_SUPERVISOR,
            keyResponsable: Autoridades.VACACIONES_SALDO_FILTRO_RESPONSABLE,
        });

        this.contexto.cargarCatalogos(this.restriccion).subscribe(res => {
            this.empleados.set(res.empleados.data ?? []);
            this.unidades.set(res.unidades.data ?? []);
            this.supervisores.set(res.supervisores.data ?? []);
        });

        this.cargarPeriodos();
        this.cargarAniversarios();
    }

    onFiltroChange(): void {
        this.filtroStorage.guardar(KEYS.empleadoId, this.filtroEmpleadoId());
        this.filtroStorage.guardar(KEYS.unidadId, this.filtroUnidadId());
        this.filtroStorage.guardar(KEYS.supervisorId, this.filtroSupervisorId());
        this.filtroStorage.guardar(KEYS.anioLaboral, this.filtroAnioLaboral());
        this.currentPage.set(0);
        this.cargarPeriodos();
        this.cargarAniversarios();
    }

    onEstatusFilterChange(value: string | null): void {
        this.filtroEstatus.set(value);
        this.filtroStorage.guardar(KEYS.estatus, value);
        this.currentPage.set(0);
        this.cargarPeriodos();
    }

    limpiarFiltros(): void {
        this.filtroEmpleadoId.set(null);
        this.filtroUnidadId.set(null);
        this.filtroSupervisorId.set(null);
        this.filtroEstatus.set(null);
        this.filtroAnioLaboral.set(null);
        this.filtroStorage.limpiarPorPrefijo(STORAGE_KEY);
        this.currentPage.set(0);
        this.cargarPeriodos();
        this.cargarAniversarios();
    }

    onPageChange(event: { first: number; rows: number }): void {
        this.currentPage.set(event.first / event.rows);
        this.pageSize.set(event.rows);
        this.cargarPeriodos();
    }

    exportarDatosActuales(): void {
        this.spinner.show();
        this.vacacion.exportarValoresActuales().subscribe({
            next: (blob: Blob) => {
                const url=window.URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download=`Reporte_Saldos_Vacacionales_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.spinner.hide();
            }, error: () => {
                this.spinner.hide();
            }
        });
    }

    cargarPeriodos(): void {
        this.loadingSaldos.set(true);

        const filtro: FiltroPeriodo={
            currentPage: this.currentPage(),
            pageSize: this.pageSize(),
            empleadoId: this.filtroEmpleadoId() ?? undefined,
            unidadId: this.filtroUnidadId() ?? undefined,
            estatus: this.filtroEstatus() ?? undefined,
            anioLaboral: this.filtroAnioLaboral() ?? undefined,
        };

        this.contexto.aplicarRestriccion(filtro, this.restriccion, this.filtroSupervisorId());

        this.vacacion.getPeriodos(normalizeProperties(filtro, {
            removeUndefined: true,
            removeNull: true,
            removeEmptyString: true,
        })).subscribe({
            next: response => {
                this.saldosData.set(response.data ?? []);
                this.totalRegistros.set(response.totalElements ?? 0);
                this.loadingSaldos.set(false);
            },
            error: () => {
                this.loadingSaldos.set(false);
            },
        });
    }

    // ── Helpers ────────────────────────────────────────────────────────

    cargarAniversarios(): void {
        this.loadingAniversarios.set(true);

        const d=this.currentDate();
        const filtro: FiltroAniversario={
            anio: d.getFullYear(),
            mes: d.getMonth() + 1
        };

        this.contexto.aplicarRestriccion(filtro, this.restriccion, this.filtroSupervisorId());

        this.vacacion.proximosAniversarios(normalizeProperties(filtro, {
            removeUndefined: true,
            removeNull: true,
            removeEmptyString: true,
        })).subscribe({
            next: response => {
                this.aniversarios.set(ordenarPorFechaMasProxima(response.data ?? []));
                this.loadingAniversarios.set(false);
            },
            error: () => {
                this.loadingAniversarios.set(false);
            }
        });
    }

    diasRestantes(row: PeriodoVacacionalResumen): number {
        return (row.diasHabilitados ?? 0) - (row.diasTomados ?? 0);
    }

    badgeLabel(dias: number): string {
        if(dias === 0) return 'Hoy';
        if(dias === 1) return 'Falta 1 día';
        if(dias<0) return dias === -1 ? 'Ayer' : `Hace ${Math.abs(dias)} días`;
        return `Faltan ${dias} días`;
    }

    badgeClass(dias: number): string {
        if(dias<0) return 'text-slate-600 bg-slate-100';
        if(dias === 0) return 'text-green-700 bg-green-100';
        return 'text-blue-600 bg-blue-50';
    }

    nextMonth(): void {
        this.currentDate.update(d => addMonths(d, 1));
        this.cargarAniversarios();
    }

    previousMonth(): void {
        if(!this.isCurrentMonth()) {
            this.currentDate.update(d => addMonths(d, -1));
            this.cargarAniversarios();
        }
    }

    habilitarPeriodo(idPeriodo: number) {
        this.loadingSaldos.set(true);
        this.catalogoEmpleadoService.habilitarPeriodoVencido(idPeriodo).subscribe({
            next: (response) => {
                this.cargarPeriodos();
            },
            error: (err) => {
                this.loadingSaldos.set(false);
            }
        });
    }
}
