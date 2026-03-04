import {Component, inject, OnInit, signal} from '@angular/core';
import {forkJoin} from 'rxjs';
import {TableModule} from 'primeng/table';
import {DatePipe} from '@angular/common';
import {Button} from 'primeng/button';
import {
    AsistenciaService,
    EmpleadoReporte,
    EmpleadoReporteRequest,
} from '@/core/services/asistencia/asistencia.service';
import {FormsModule} from '@angular/forms';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {Dialog} from 'primeng/dialog';
import {Tooltip} from 'primeng/tooltip';
import {Select} from 'primeng/select';
import {DatePicker} from 'primeng/datepicker';
import {Unidad} from '@/models/empresa/unidad';
import {Title} from '@/components/title';
import {Panel} from 'primeng/panel';
import {PuestoService} from '@/core/services/empresa/puesto.service';
import {Puesto} from '@/models/empresa/puesto';
import {fechaISOString, obtenerFinDia} from '@/shared/util/date.util';
import {Zona} from '@/models/ubicacion/zona';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {JWTService} from '@/core/security/JWTService';
import {Autoridades} from '@/core/Autoridades';
import {InputText} from 'primeng/inputtext';
import {SpinnerService} from '@/shared/service/spinner.service';
import {PhotoViewerComponent} from '@/shared/component/photo-viewer/photo-viewer.component';
import {PhotoViewerService} from '@/shared/component/photo-viewer/photo-viewer.service';
import {AsistenciaCardComponent} from '@/shared/component/asistencia-card/asistencia-card.component';
import {CatalogoEmpleado, CatalogoEmpleadoService} from "@/service/catalogo-empleado.service";
import {StatWidgetComponent} from "@/components/stat-widget";
import {EmpleadoSesionService} from "@/core/empleado-sesion-service";

@Component({
    standalone: true,
    selector: 'app-admin', imports: [
        TableModule,
        DatePipe,
        Button,
        FormsModule,
        Dialog,
        Tooltip,
        Select,
        DatePicker,
        Title,
        Panel,
        InputText,
        PhotoViewerComponent,
        AsistenciaCardComponent,
        StatWidgetComponent,
    ], templateUrl: './admin.html',
})
export class Admin implements OnInit {
    empleados: EmpleadoReporte[]=[];
    expandedRows: { [key: string]: boolean }={};
    zonas=signal<Zona[]>([]);
    supervisores=signal<CatalogoEmpleado[]>([]);
    mostrarModalFiltros=false;
    filtros={
        fechaInicio: '', fechaFin: '', empleados: [] as number[],
    };
    supervisorSeleccionado: number | null=null;
    filtroActivo=false;
    unidades=signal<Unidad[]>([]);
    puestos=signal<Puesto[]>([]);
    listaColaboradores=signal<CatalogoEmpleado[]>([]);
    // Filtros
    filtroUnidad: number;
    filtroPuesto: number;
    filtroEmpleado: number;
    filtroSupervisor: number;
    filtroZona: number;
    rangeDates: Date[]=[];
    protected exportandoExcel=signal(false);
    protected incidencias: any;
    protected mostrarModalInconsistencias: boolean;
    protected readonly Autoridades=Autoridades;
    protected asistencias=inject(AsistenciaService);
    protected supRestringido!: boolean
    private loadingService=inject(SpinnerService);
    private catalagoEmpleado=inject(CatalogoEmpleadoService)
    private unidadService=inject(UnidadService);
    private readonly empleadoSessionService=inject(EmpleadoSesionService)
    private puestoService=inject(PuestoService);
    private zonaService=inject(ZonaService);
    private securityService=inject(JWTService);
    private photoViewerService=inject(PhotoViewerService);
    private colaboradoresAsignados!: boolean;

    get jornadasAbiertas(): number {
        return this.empleados.reduce((total,
                                      emp) => total + emp.asistencias.filter((a) => !a.jornadaCerrada).length, 0);
    }

    get puedeExportar() {
        return this.securityService.hasAuthority(Autoridades.CONSULTA_ASISTENCIA_EXPORTAR);
    }

    tieneJornadaAbierta(empleado: EmpleadoReporte): boolean {
        return empleado.asistencias.some(a => !a.jornadaCerrada);
    }

    /**
     * Abre el visor de fotos usando el servicio PhotoViewerService.
     *
     * @param pathFoto - Ruta relativa de la foto en el servidor
     * @param tipo - Tipo de foto (ej: 'Inicio', 'Fin', 'Inicio Pausa Comida')
     * @param fecha - Fecha de la asistencia
     */
    verFoto(pathFoto: string,
            tipo: string,
            fecha: string): void {
        const urlCompleta=`${this.asistencias.apiUrlImagen}/${pathFoto}`;

        const fechaFormateada=new Date(fecha).toLocaleDateString('es-MX', {
            day: '2-digit', month: '2-digit', year: 'numeric',
        });

        const titulo=`${tipo} - ${fechaFormateada}`;
        this.photoViewerService.open(urlCompleta, titulo);
    }

    ngOnInit() {
        this.supRestringido=this.securityService.hasAuthority(Autoridades.CONSULTA_ASISTENCIA_RESTRINGIR_FILTRO_SUPERVISOR)
        this.colaboradoresAsignados=this.securityService.hasAuthority(Autoridades.CONSULTA_ASISTENCIA_EMPLEADOS_RESPONSABLES)
        this.cargarOpcionesFiltros();
    }

    cargarAsistencias(): void {

        this.loadingService.show();

        // ---------------------------------------
        // 1. Validar fechas obligatorias
        // ---------------------------------------
        if(!this.rangeDates || this.rangeDates.length !== 2 || !this.rangeDates[1]) {
            this.loadingService.hide();
            return;
        }

        const [desde, hasta]=this.rangeDates;

        const params: EmpleadoReporteRequest={
            desde: fechaISOString(desde),
            hasta: fechaISOString(obtenerFinDia(hasta)),
        };

        const empleadoId=this.securityService.getUser().employeeName.id;

        // ---------------------------------------
        // 2. Restricciones por permisos
        // ---------------------------------------

        // Supervisor
        if(this.supRestringido && empleadoId) {
            params.supervisorId=empleadoId;
        } else if(this.filtroSupervisor) {
            params.supervisorId=this.filtroSupervisor;
        }

        // Empleado asociado
        if(this.colaboradoresAsignados && empleadoId) {
            params.empleadoResponsableId=empleadoId;
        } else if(this.filtroEmpleado) {
            params.empleadoId=this.filtroEmpleado;
        }

        // ---------------------------------------
        // 3. Filtros independientes
        // ---------------------------------------
        if(this.filtroUnidad) params.unidadId=this.filtroUnidad;
        if(this.filtroZona) params.zonaId=this.filtroZona;
        if(this.filtroPuesto) params.puestoId=this.filtroPuesto;

        // ---------------------------------------
        // 4. Validar que exista al menos 1 filtro adicional
        // ---------------------------------------
        const tieneFiltrosAdicionales=Boolean(
            params.supervisorId ||
            params.empleadoId ||
            params.empleadoResponsableId ||
            params.empleadoId ||
            params.unidadId ||
            params.zonaId ||
            params.puestoId,
        );

        if(!tieneFiltrosAdicionales) {
            this.loadingService.hide();
            return;
        }

        // ---------------------------------------
        // 5. Ejecutar consulta
        // ---------------------------------------
        this.asistencias.obtenerAsistencias(params).subscribe({
            next: (value) => {
                this.empleados=value.data.map(empleado => ({
                    ...empleado,
                    asistencias: empleado.asistencias.map(asistencia => ({
                        ...asistencia,
                        tiempoCalculado: this.asistencias.calcularTiempoEnMomento(asistencia),
                        diferenciaCalculada: this.asistencias.calcularDiferenciaEnMomento(asistencia),
                    })),
                }));
            },
            error: () => this.loadingService.hide(),
            complete: () => this.loadingService.hide(),
        });

    }


    cargarOpcionesFiltros() {
        if(this.supRestringido) {
            this.unidadService.filtrar({supervisorId: this.securityService.getUser().employeeName.id}).subscribe({
                next: (response) => {
                    this.unidades.set(response.data)
                },
            })
        } else {
            this.unidadService.filtrar({activos: true}).subscribe({
                next: (response) => {
                    this.unidades.set(response.data)
                },
            });
        }
        if(!this.supRestringido) {
            this.catalagoEmpleado.obtenerSupervisores().subscribe({
                next: (response) => {
                    this.supervisores.set(response.data);
                },
            })
        }

        this.loadingService.show();
        forkJoin([
            this.puestoService.obtenerPuestos(),
            this.catalagoEmpleado.obtenerEmpleados(this.empleadoSessionService.buildParams(Autoridades.CONSULTA_ASISTENCIA_RESTRINGIR_FILTRO_SUPERVISOR, Autoridades.CONSULTA_ASISTENCIA_EMPLEADOS_RESPONSABLES)),
            this.zonaService.obtenerZonas(),
        ]).subscribe({
            next: ([puestosResp, empleadosResp, zonaResp]) => {
                this.puestos.set(puestosResp.data);
                this.listaColaboradores.set(empleadosResp.data);
                this.zonas.set(zonaResp.data);
            }, complete: () => {
                this.loadingService.hide();
            }, error: () => {
                this.loadingService.hide();
            },
        });
    }

    descargarExcel() {
        this.exportandoExcel.set(true);
        if(!this.rangeDates || this.rangeDates.length !== 2 || !this.rangeDates[1]) {
            this.exportandoExcel.set(false);
            return;
        }

        const params: EmpleadoReporteRequest={};
        const [desde, hasta]=this.rangeDates;
        params.desde=fechaISOString(desde);
        params.hasta=fechaISOString(obtenerFinDia(hasta));

        // Si tiene restricción de supervisor, asignar automáticamente su ID
        const empleadoId=this.securityService.getUser().employeeName.id;
        if(!this.supRestringido && empleadoId) {
            params.supervisorId=empleadoId;
        } else if(this.filtroSupervisor) {
            params.supervisorId=this.filtroSupervisor;
        }

        if(this.filtroUnidad) {
            params.unidadId=this.filtroUnidad;
        }
        if(this.filtroZona) {
            params.zonaId=this.filtroZona;
        }
        if(this.filtroPuesto) {
            params.puestoId=this.filtroPuesto;
        }
        if(this.filtroEmpleado) {
            params.empleadoId=this.filtroEmpleado;
        }

        // Verificar que exista al menos un filtro además del rango de fecha
        const tieneAlMenosUnFiltro=this.filtroUnidad || this.filtroSupervisor || this.filtroZona || this.filtroPuesto || this.filtroEmpleado || (!this.supRestringido && empleadoId);

        if(!tieneAlMenosUnFiltro) {
            this.exportandoExcel.set(false);
            return;
        }
        this.asistencias.descargarExcel(params).subscribe({
            next: (blob) => {
                const url=window.URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download='reporte-asistencias-detallado.xlsx';
                a.click();
                window.URL.revokeObjectURL(url);
                this.mostrarModalFiltros=false;
                this.exportandoExcel.set(false);
            }, complete: () => {
                this.exportandoExcel.set(false);
            }, error: () => {
                this.exportandoExcel.set(false);
            },
        });
    }


    mostrarInconsistencias(id: number) {
        this.mostrarModalInconsistencias=true;
        if(!this.rangeDates || this.rangeDates.length !== 2 || !this.rangeDates[0] || !this.rangeDates[1]) {
            return;
        }

        const params: any={
            fechaInicio: fechaISOString(this.rangeDates[0]),
            fechaFin: fechaISOString(obtenerFinDia(this.rangeDates[1])),
            empleadoId: id,
        };

        this.asistencias.obtenerInconsistencias(params).subscribe({
            next: (response) => {
                this.incidencias=response.data;
            },
        });
    }

    actulizarTabla() {
        // Verificar que exista al menos un filtro además del rango de fecha
        const empleadoId=this.securityService.getUser().employeeName.id;
        const tieneAlMenosUnFiltro=this.filtroUnidad || this.filtroSupervisor || this.filtroZona || this.filtroPuesto || this.filtroEmpleado || (!this.supRestringido && empleadoId);

        if(!tieneAlMenosUnFiltro) {
            this.empleados=[];
            return;
        }
        this.cargarAsistencias();
    }

    mostrarFiltroAvanzado() {
        this.mostrarModalFiltros=true;
    }

    aplicarFiltroAvanzado() {
        if(this.supervisorSeleccionado) {
            this.filtroSupervisor=this.supervisorSeleccionado;
            this.filtroActivo=true;
            this.cargarAsistencias();
        }
        this.mostrarModalFiltros=false;
    }

    limpiarFiltros() {
        this.supervisorSeleccionado=null;
        this.filtroSupervisor=null;
        this.filtroActivo=false;
        this.cargarAsistencias();
        this.mostrarModalFiltros=false;
    }
}
