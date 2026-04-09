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
import {PuestoService} from '@/core/services/empresa/puesto.service';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {forkJoin} from 'rxjs';
import {FormsModule} from '@angular/forms';
import {DatePipe, TitleCasePipe} from '@angular/common';
import {fechaISOString} from '@/shared/util/date.util';
import {InputText} from 'primeng/inputtext';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";
import {StateComponent} from "@/components/state.component";
import {Autoridades} from "@/core/Autoridades";
import {AlertComponent} from "@/components/alert";
import {ContextoConsultaService, RestriccionUsuario} from "@/service/contexto-consulta.service";

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
    private puestoService=inject(PuestoService);
    private zonaService=inject(ZonaService);
    private compensacionService=inject(CompensacionService);
    private readonly contexto=inject(ContextoConsultaService);
    private restriccion!: RestriccionUsuario;

    get tieneRestriccion(): boolean {
        return this.restriccion.tieneRestriccion;
    }

    ngOnInit() {
        this.restriccion=this.contexto.resolverRestriccion({
            keySupervisor: Autoridades.COMPENSACIONES_RESTRINGIR_FILTRO_SUPERVISOR,
        });
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

        if(this.filtroEmpleado) params.empleadoId=this.filtroEmpleado;
        if(this.filtroUnidad) params.unidadId=this.filtroUnidad;
        if(this.filtroZona) params.zonaId=this.filtroZona;

        this.contexto.aplicarRestriccion(params, this.restriccion, this.filtroSupervisor);

        this.compensacionService.obtenerCompensaciones(params).subscribe({
            next: (response) => {
                const data=response.data ?? [];
                data.sort((a, b) => {
                    const nombreA=(a.colaborador ?? '').localeCompare(b.colaborador ?? '');
                    if(nombreA !== 0) return nombreA;
                    const fechaA=a.fecha ? new Date(a.fecha).getTime() : 0;
                    const fechaB=b.fecha ? new Date(b.fecha).getTime() : 0;
                    return fechaA - fechaB;
                });
                this.compensaciones.set(data);
                this.loading.set(false);
            }, error: () => {
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

        if(this.filtroEmpleado) params.empleadoId=this.filtroEmpleado;
        if(this.filtroUnidad) params.unidadId=this.filtroUnidad;
        if(this.filtroZona) params.zonaId=this.filtroZona;

        this.contexto.aplicarRestriccion(params, this.restriccion, this.filtroSupervisor);

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
            }, error: () => {
                this.loadingExcel.set(false);
            },
        });
    }

    cargarOpcionesFiltros() {
        this.contexto.cargarCatalogos(this.restriccion).subscribe({
            next: (res) => {
                this.listaEmpleados.set(res.empleados.data ?? []);
                this.unidades.set(res.unidades.data ?? []);
                this.supervisores.set(res.supervisores.data ?? []);
            }
        });

        forkJoin([
            this.puestoService.obtenerPuestos(),
            this.zonaService.obtenerZonas(),
        ]).subscribe({
            next: ([puestosResp, zonaResp]) => {
                this.puestos.set(puestosResp.data);
                this.zonas.set(zonaResp.data);
            },
        });
    }
}
