import {Component, inject, OnInit, signal} from '@angular/core';
import {Title} from "@/components/title";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SelectButton} from "primeng/selectbutton";
import {SolicitudesGestionDTO} from "@/modules/vacacion/models/vacacion.model";
import {VacacionAdminService} from "@/modules/vacacion/services/vacacion.service";
import {Paginator} from "@/shared/util/paginator";
import {DialogModule} from "primeng/dialog";
import {InputNumberModule} from "primeng/inputnumber";
import {Button} from "primeng/button";
import {Menubar} from "primeng/menubar";
import {SpinnerService} from "@/shared/service/spinner.service";
import {Autoridades} from "@/core/Autoridades";
import {HasPermissionDirective} from "@/core/security/HasPermissionDirective";
import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";
import {Unidad} from "@/models/empresa/unidad";
import {Select} from "primeng/select";
import {ContextoConsultaService, RestriccionUsuario} from "@/service/contexto-consulta.service";
import {FiltroResponsabilidad} from "@/service/filtro-responsabilidad.service";
import {SolicitudesTableComponent} from "@/modules/vacacion/components/solicitudes-table/solicitudes-table";
import {normalizeProperties} from "@/shared/util/object.util";
import {MessageService} from "primeng/api";
import {DatePicker} from "primeng/datepicker";
import {DatePipe} from "@angular/common";
import {TooltipModule} from "primeng/tooltip";
import {FiltroStorageService} from "@/shared/service/filtro-storage.service";

export interface FiltroSolicitudes extends Paginator,
                                           FiltroResponsabilidad {
    estatus?: string;
    unidadId?: number;
    empleadoId?: number;
    fechaDesde?: string;
    fechaHasta?: string;
}

/** Prefijo de todas las claves de filtro de este módulo en localStorage */
const STORAGE_KEY = 'vacacion:solicitudes:filtros';

const KEYS = {
    statusFilter:  `${STORAGE_KEY}:statusFilter`,
    empleadoId:    `${STORAGE_KEY}:empleadoId`,
    unidadId:      `${STORAGE_KEY}:unidadId`,
    supervisorId:  `${STORAGE_KEY}:supervisorId`,
    fechaDesde:    `${STORAGE_KEY}:fechaDesde`,
    fechaHasta:    `${STORAGE_KEY}:fechaHasta`,
} as const;

/** Convierte un ISO string guardado en storage a Date, o devuelve null */
function isoToDate(iso: string | null): Date | null {
    if (!iso) return null;
    const d = new Date(iso);
    return isNaN(d.getTime()) ? null : d;
}

@Component({
    selector: 'app-solicitudes', imports: [
        Title,
        ReactiveFormsModule,
        SelectButton,
        FormsModule,
        Button,
        Menubar,
        DialogModule,
        InputNumberModule,
        HasPermissionDirective,
        Select,
        SolicitudesTableComponent,
        DatePicker,
        TooltipModule,
    ], templateUrl: './solicitudes.html'
})
export class Solicitudes implements OnInit {
    filterOptions=[
        {label: 'Todas', value: '', icon: 'pi-bars'},
        {label: 'Pendientes', value: 'PENDIENTE', icon: 'pi-clock'},
        {label: 'Aprobadas', value: 'APROBADA', icon: 'pi-check-circle'},
        {label: 'Canceladas', value: 'CANCELADA', icon: 'pi-times'}
    ];

    private readonly filtroStorage=inject(FiltroStorageService);

    // ── Filtros (se restauran desde localStorage al iniciar) ───────────
    statusFilter=signal<string>(this.filtroStorage.leer<string>(KEYS.statusFilter, 'PENDIENTE'));
    // Catálogos
    loading=signal(false);
    currentPage=signal(0);
    pageSize=signal(50);
    totalRecords=signal(0);
    empleados=signal<CatalogoEmpleado[]>([]);
    supervisores=signal<CatalogoEmpleado[]>([]);
    unidades=signal<Unidad[]>([]);
    // Filtros de consulta
    filtroEmpleadoId=signal<number | null>(this.filtroStorage.leer<number | null>(KEYS.empleadoId, null));
    filtroUnidadId=signal<number | null>(this.filtroStorage.leer<number | null>(KEYS.unidadId, null));
    filtroSupervisorId=signal<number | null>(this.filtroStorage.leer<number | null>(KEYS.supervisorId, null));
    fechaDesde=signal<Date | null>(isoToDate(this.filtroStorage.leer<string | null>(KEYS.fechaDesde, null)));
    fechaHasta=signal<Date | null>(isoToDate(this.filtroStorage.leer<string | null>(KEYS.fechaHasta, null)));
    // Modal Papeleta
    mostrarDialogoPapeleta=signal(false);
    folioSeleccionado=signal<number | null>(null);
    salarioDiario=signal<number | null>(null);
    diasAdicionales=signal<number>(0);
    readonly maxDate = new Date();

    protected solicitudes: SolicitudesGestionDTO[]=[];
    protected readonly Autoridades=Autoridades;
    private readonly solicitudService=inject(VacacionAdminService);
    private readonly spinner=inject(SpinnerService);
    private readonly contexto=inject(ContextoConsultaService);
    private readonly messageService=inject(MessageService)
    private readonly datePipe = new DatePipe('es-MX');
    private restriccion!: RestriccionUsuario;

    get tieneRestriccion(): boolean {
        return this.restriccion.tieneRestriccion;
    }

    ngOnInit(): void {
        this.restriccion=this.contexto.resolverRestriccion({
            keySupervisor: Autoridades.VACACIONES_GESTOR_FILTRO_SUPERVISOR,
            keyResponsable: Autoridades.VACACIONES_GESTOR_FILTRO_RESPONSABLE
        });

        this.contexto.cargarCatalogos(this.restriccion).subscribe(res => {
            this.empleados.set(res.empleados.data ?? []);
            this.unidades.set(res.unidades.data ?? []);
            this.supervisores.set(res.supervisores.data ?? []);
        });
    }

    onFilterChange(value: string): void {
        this.statusFilter.set(value);
        this.filtroStorage.guardar(KEYS.statusFilter, value);
        this.currentPage.set(0);
        this.cargarSolicitudes();
    }

    onPageChange(event: { first: number; rows: number }) {
        this.currentPage.set(event.first / event.rows);
        this.pageSize.set(event.rows);
        this.cargarSolicitudes();
    }

    exportarDatosActuales(): void {
        this.spinner.show();
        this.solicitudService.exportarValoresActuales().subscribe({
            next: (blob: Blob) => {
                this.descargarBlob(blob, `Reporte_Vacaciones_${new Date().toISOString().split('T')[0]}.xlsx`);
                this.spinner.hide();
            }, error: () => {
                this.spinner.hide();
            }
        });
    }

    exportarSolicitudes(): void {
        const d = this.fechaDesde();
        const h = this.fechaHasta();

        if (!d || !h) {
            this.messageService.add({
                severity: 'warn',
                summary: 'Fechas requeridas',
                detail: 'Selecciona el período (Desde y Hasta) para exportar.'
            });
            return;
        }

        const params: Record<string, string> = {
            fechaDesde: this.datePipe.transform(d, 'yyyy-MM-dd')!,
            fechaHasta: this.datePipe.transform(h, 'yyyy-MM-dd')!,
        };

        if (this.statusFilter()) params['estatus'] = this.statusFilter();
        if (this.filtroEmpleadoId()) params['empleadoId'] = String(this.filtroEmpleadoId());
        if (this.filtroUnidadId()) params['unidadId'] = String(this.filtroUnidadId());

        const filtroConRestriccion: any = {...params};
        this.contexto.aplicarRestriccion(filtroConRestriccion, this.restriccion, this.filtroSupervisorId());
        if (filtroConRestriccion['responsableId']) params['responsableId'] = String(filtroConRestriccion['responsableId']);
        if (filtroConRestriccion['rrhhId']) params['rrhhId'] = String(filtroConRestriccion['rrhhId']);
        if (filtroConRestriccion['supervisorId']) params['supervisorId'] = String(filtroConRestriccion['supervisorId']);

        this.spinner.show();
        this.solicitudService.exportarSolicitudes(params).subscribe({
            next: (blob: Blob) => {
                const fecha = this.datePipe.transform(new Date(), 'yyyy-MM-dd')!;
                this.descargarBlob(blob, `Solicitudes_${fecha}.xlsx`);
                this.spinner.hide();
            },
            error: () => {
                this.spinner.hide();
            }
        });
    }

    private descargarBlob(blob: Blob, nombre: string): void {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = nombre;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    }



    abrirModalPapeleta(folio: number): void {
        this.folioSeleccionado.set(folio);
        this.salarioDiario.set(null);
        this.diasAdicionales.set(0);
        this.mostrarDialogoPapeleta.set(true);
    }

    generarPapeleta(): void {
        const folio=this.folioSeleccionado();
        const salario=this.salarioDiario();
        const adicionales=this.diasAdicionales();

        if(!folio || salario === null || adicionales === null) return;

        this.mostrarDialogoPapeleta.set(false);
        this.spinner.show();
        this.solicitudService.exportarPapeleta(folio, salario, adicionales).subscribe({
            next: (blob: Blob) => {
                const url=window.URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download=`Papeleta_${folio}.xlsx`;
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

    onFiltroChange(): void {
        this.filtroStorage.guardar(KEYS.empleadoId, this.filtroEmpleadoId());
        this.filtroStorage.guardar(KEYS.unidadId, this.filtroUnidadId());
        this.filtroStorage.guardar(KEYS.supervisorId, this.filtroSupervisorId());
        const d = this.fechaDesde();
        const h = this.fechaHasta();
        this.filtroStorage.guardar(KEYS.fechaDesde, d ? d.toISOString() : null);
        this.filtroStorage.guardar(KEYS.fechaHasta, h ? h.toISOString() : null);
        this.currentPage.set(0);
        this.cargarSolicitudes();
    }

    limpiarFiltros(): void {
        this.filtroEmpleadoId.set(null);
        this.filtroUnidadId.set(null);
        this.filtroSupervisorId.set(null);
        this.fechaDesde.set(null);
        this.fechaHasta.set(null);
        this.filtroStorage.limpiarPorPrefijo(STORAGE_KEY);
        this.currentPage.set(0);
        this.cargarSolicitudes();
    }

    protected eliminarSolicitud($event) {
        this.solicitudService.eliminarSolicitud($event).subscribe({
            next: () => {
                this.cargarSolicitudes();
                this.messageService.add({
                    severity: 'success',
                    summary: 'Completado',
                    detail: 'Solicitud eliminada con éxito'
                })
            }
        })
    }

    protected cargarSolicitudes(): void {
        const d = this.fechaDesde();
        const h = this.fechaHasta();

        if ((d && !h) || (!d && h)) {
            // Si solo uno de los dos está seleccionado, lo consideramos en edición y no consultamos
            return;
        }

        if (d && h && d > h) {
            this.messageService.add({
                severity: 'error',
                summary: 'Fechas inválidas',
                detail: 'La fecha "Desde" no puede ser mayor que "Hasta".'
            });
            return;
        }

        this.loading.set(true);

        const filtro: FiltroSolicitudes={
            estatus: this.statusFilter(),
            currentPage: this.currentPage(),
            pageSize: this.pageSize(),
            empleadoId: this.filtroEmpleadoId() ?? undefined,
            unidadId: this.filtroUnidadId() ?? undefined,
            fechaDesde: this.fechaDesde() ? this.datePipe.transform(this.fechaDesde(), 'yyyy-MM-dd')! : undefined,
            fechaHasta: this.fechaHasta() ? this.datePipe.transform(this.fechaHasta(), 'yyyy-MM-dd')! : undefined,
        };

        this.contexto.aplicarRestriccion(filtro, this.restriccion, this.filtroSupervisorId());

        this.solicitudService.getSolicitudesFiltradas(normalizeProperties(filtro, {
            removeUndefined: true,
            removeEmptyString: true,
            removeNull: true
        })).subscribe({
            next: (response) => {
                this.solicitudes = response.data || [];
                this.totalRecords.set(response.totalElements ?? 0);
                this.loading.set(false);
            }, error: () => {
                this.loading.set(false);
            }
        });
    }
}
