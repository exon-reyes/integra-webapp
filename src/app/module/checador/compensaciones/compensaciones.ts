import {Component, inject, OnInit, signal} from '@angular/core';
import {Title} from '@/components/title';
import {DatePicker} from 'primeng/datepicker';
import {Panel} from 'primeng/panel';
import {Select} from 'primeng/select';
import {TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {EmpleadoReporte} from '@/core/services/asistencia/asistencia.service';
import {CompensacionReporteQuery, CompensacionService} from '@/core/services/asistencia/compensacion.service';
import {Zona} from '@/models/ubicacion/zona';
import {Unidad} from '@/models/empresa/unidad';
import {Puesto} from '@/models/empresa/puesto';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {PuestoService} from '@/core/services/empresa/puesto.service';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {forkJoin} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {DatePipe, TitleCasePipe} from '@angular/common';
import {fechaISOString} from '@/shared/util/date.util';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {CatalogoEmpleado, CatalogoEmpleadoService} from "@/service/catalogo-empleado.service";
import {StateComponent} from "@/components/state.component";
import {EmpleadoSesionService} from "@/core/empleado-sesion-service";
import {Autoridades} from "@/core/Autoridades";
import {JWTService} from "@/core/security/JWTService";
import {AlertComponent} from "@/components/alert";

@Component({
    standalone: true,
    selector: 'app-compensaciones', imports: [
        Title,
        DatePicker,
        Panel,
        Select,
        TableModule,
        ButtonModule,
        FormsModule,
        DatePipe,
        InputText,
        IconField,
        InputIcon,
        TitleCasePipe,
        StateComponent,
        AlertComponent,
    ], templateUrl: './compensaciones.html', styleUrl: './compensaciones.scss',
})
export class Compensaciones implements OnInit {
    empleados: EmpleadoReporte[]=[];
    zonas=signal<Zona[]>([]);
    supervisores=signal<CatalogoEmpleado[]>([]);
    unidades=signal<Unidad[]>([]);
    puestos=signal<Puesto[]>([]);
    listaEmpleados=signal<CatalogoEmpleado[]>([]);
    compensaciones=signal<CompensacionReporteQuery[]>([]);
    loading=signal<boolean>(false);
    loadingExcel=signal<boolean>(false);
    // Filtros
    filtroUnidad: number;
    filtroEmpleado: number;
    filtroSupervisor: number;
    filtroZona: number;
    rangeDates: Date[]=[];
    protected supRestringido!: boolean
    private unidadService=inject(UnidadService);
    private puestoService=inject(PuestoService);
    private zonaService=inject(ZonaService);
    private compensacionService=inject(CompensacionService);
    private catalagoEmpleadoService=inject(CatalogoEmpleadoService)
    private readonly empleadoSessionService=inject(EmpleadoSesionService)
    private readonly securityService=inject(JWTService);
    private colaboradoresAsignados!: boolean;

    constructor() {
    }

    ngOnInit() {
        this.supRestringido=this.securityService.hasAuthority(Autoridades.COMPENSACIONES_RESTRINGIR_FILTRO_SUPERVISOR)

        this.cargarOpcionesFiltros();
    }

    cargarCompensacion() {
        if(!this.rangeDates || this.rangeDates.length !== 2 || !this.rangeDates[0] || !this.rangeDates[1]) {
            return;
        }
        this.loading.set(true);
        const params: any={
            desde: fechaISOString(this.rangeDates[0]), hasta: fechaISOString(this.rangeDates[1]),
        };

        // Only add parameters that have actual values
        if(this.filtroEmpleado) params.empleadoId=this.filtroEmpleado;
        if(this.filtroUnidad) params.unidadId=this.filtroUnidad;
        if(this.filtroZona) params.zonaId=this.filtroZona;
        if(this.filtroSupervisor) params.supervisorId=this.filtroSupervisor;

        this.compensacionService.obtenerCompensaciones(params).subscribe({
            next: (response) => {
                const data=response.data ?? [];
                // Ordenar por nombre de colaborador y luego por fecha para agrupar visualmente
                data.sort((a,
                           b) => {
                    const nombreA=(a.colaborador ?? '').localeCompare(b.colaborador ?? '');
                    if(nombreA !== 0) {
                        return nombreA;
                    }
                    const fechaA=a.fecha ? new Date(a.fecha).getTime() : 0;
                    const fechaB=b.fecha ? new Date(b.fecha).getTime() : 0;
                    return fechaA - fechaB;
                });
                this.compensaciones.set(data);
                this.loading.set(false);
            }, error: (error) => {
                this.loading.set(false);
            },
        });
    }

    descargarExcel() {
        if(!this.rangeDates || this.rangeDates.length !== 2 || !this.rangeDates[0] || !this.rangeDates[1]) {
            return;
        }

        this.loadingExcel.set(true);
        const params: any={
            desde: fechaISOString(this.rangeDates[0]), hasta: fechaISOString(this.rangeDates[1]),
        };

        // Only add parameters that have actual values
        if(this.filtroEmpleado) params.empleadoId=this.filtroEmpleado;
        if(this.filtroUnidad) params.unidadId=this.filtroUnidad;
        if(this.filtroZona) params.zonaId=this.filtroZona;
        if(this.filtroSupervisor) params.supervisorId=this.filtroSupervisor;
        this.compensacionService.descargarExcel(params).subscribe({
            next: (blob) => {
                const url=window.URL.createObjectURL(blob);
                const a=document.createElement('a');
                a.href=url;
                a.download='compensaciones.xlsx';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.loadingExcel.set(false);
            }, error: (error) => {
                this.loadingExcel.set(false);
            },
        });
    }

    cargarOpcionesFiltros() {
        if(!this.supRestringido) {
            this.catalagoEmpleadoService.obtenerSupervisores().subscribe({
                next: (response) => {
                    this.supervisores.set(response.data);
                },
            })
        }
        if(this.supRestringido) {
            this.unidadService.filtrar({supervisorId: this.securityService.getUser().employeeName.id}).subscribe({
                next: (response) => {
                    this.unidades.set(response.data)
                },
            })
        } else {
            this.unidadService.filtrar({activos: true}).subscribe({
                next: (response) => {
                    this.unidades.set(response.data.filter((unidad) => unidad.activo));
                },
            });
        }
        forkJoin([
            this.puestoService.obtenerPuestos(),
            this.catalagoEmpleadoService.obtenerEmpleados(this.empleadoSessionService.buildParams(Autoridades.COMPENSACIONES_RESTRINGIR_FILTRO_SUPERVISOR, "")),
            this.zonaService.obtenerZonas(),
        ]).subscribe({
            next: ([puestosResp, empleadosResp, zonaResp]) => {
                this.puestos.set(puestosResp.data);
                this.listaEmpleados.set(empleadosResp.data);
                this.zonas.set(zonaResp.data);
            },
        });
    }
}
