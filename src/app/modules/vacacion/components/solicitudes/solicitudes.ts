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


export interface FiltroSolicitudes extends Paginator,
                                           FiltroResponsabilidad {
    estatus?: string;
    unidadId?: number;
    empleadoId?: number;
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
    ], templateUrl: './solicitudes.html'
})
export class Solicitudes implements OnInit {
    filterOptions=[
        {label: 'Todas', value: '', icon: 'pi-bars'},
        {label: 'Pendientes', value: 'PENDIENTE', icon: 'pi-clock'},
        {label: 'Aprobadas', value: 'APROBADA', icon: 'pi-check-circle'},
        {label: 'Canceladas', value: 'CANCELADA', icon: 'pi-times'}
    ];
    statusFilter=signal<string>('PENDIENTE');
    loading=signal(false);
    currentPage=signal(0);
    pageSize=signal(10);
    totalRecords=signal(0);
    // Catálogos
    empleados=signal<CatalogoEmpleado[]>([]);
    supervisores=signal<CatalogoEmpleado[]>([]);
    unidades=signal<Unidad[]>([]);
    // Filtros de consulta
    filtroEmpleadoId=signal<number | null>(null);
    filtroUnidadId=signal<number | null>(null);
    filtroSupervisorId=signal<number | null>(null);
    // Modal Papeleta
    mostrarDialogoPapeleta=signal(false);
    folioSeleccionado=signal<number | null>(null);
    salarioDiario=signal<number | null>(null);
    diasAdicionales=signal<number>(0);

    protected solicitudes: SolicitudesGestionDTO[]=[];
    protected readonly Autoridades=Autoridades;
    private readonly solicitudService=inject(VacacionAdminService);
    private readonly spinner=inject(SpinnerService);
    private readonly contexto=inject(ContextoConsultaService);
    private readonly messageService=inject(MessageService)
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
                const url=window.URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download=`Reporte_Vacaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
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
        this.currentPage.set(0);
        this.cargarSolicitudes();
    }

    limpiarFiltros(): void {
        this.filtroEmpleadoId.set(null);
        this.filtroUnidadId.set(null);
        this.filtroSupervisorId.set(null);
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
        this.loading.set(true);

        const filtro: FiltroSolicitudes={
            estatus: this.statusFilter(),
            currentPage: this.currentPage(),
            pageSize: this.pageSize(),
            empleadoId: this.filtroEmpleadoId() ?? undefined,
            unidadId: this.filtroUnidadId() ?? undefined,
        };

        this.contexto.aplicarRestriccion(filtro, this.restriccion, this.filtroSupervisorId());

        this.solicitudService.getSolicitudesFiltradas(normalizeProperties(filtro, {
            removeUndefined: true,
            removeEmptyString: true,
            removeNull: true
        })).subscribe({
            next: (response) => {
                this.solicitudes=response.data || [];
                this.totalRecords.set(response.totalElements ?? 0);
                this.loading.set(false);
            }, error: () => {
                this.loading.set(false);
            }
        });
    }
}
