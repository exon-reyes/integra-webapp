import {Component, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {Table, TableModule} from 'primeng/table';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {Button} from 'primeng/button';
import {FormsModule} from '@angular/forms';
import {MultiSelectModule} from 'primeng/multiselect';
import {Panel} from 'primeng/panel';
import {DialogModule} from 'primeng/dialog';
import {Title} from '@/components/title';
import {HasPermissionDirective} from '@/core/security/HasPermissionDirective';
import {Autoridades} from '@/core/Autoridades';
import {JWTService} from '@/core/security/JWTService';
import {EmpleadoExcelGenerator} from './empleado-excel-generator';
import {Select} from 'primeng/select';
import {CatalogoEmpleado, CatalogoEmpleadoService, FiltroEmpleado} from "@/service/catalogo-empleado.service";
import {finalize} from "rxjs";
import {StatWidgetComponent} from "@/components/stat-widget";
import {StatusBadgeComponent} from "@/components/StatusBadgeComponent";

@Component({
    selector: 'app-admin',standalone:true, imports: [
        CommonModule,
        TableModule,
        IconField,
        InputIcon,
        InputText,
        Button,
        FormsModule,
        MultiSelectModule,
        Panel,
        Title,
        HasPermissionDirective,
        DialogModule,
        Select,
        StatWidgetComponent,
        StatusBadgeComponent,

    ], templateUrl: './admin.html', styleUrl: './admin.scss',
})
export class Admin implements OnInit {
    @ViewChild('dt') dt!: Table;
    empleados=signal<CatalogoEmpleado[]>([]);
    empleadosOriginales: CatalogoEmpleado[]=[]; // Catálogo completo original
    loading=signal(true);
    searchValue='';
    selectedUnidad: string[]=[];
    selectedPuesto: string[]=[];
    selectedEstatus: string[]=[];
    unidades: { name: string; code: string }[]=[];
    puestos: { name: string; code: string }[]=[];
    estatusOptions: { name: string; code: string }[]=[
        {name: 'Activo', code: 'A'}, {
            name: 'Reingreso', code: 'R',
        }, {name: 'Baja', code: 'B'},
    ];
    mostrarModal=false;
    supervisores: CatalogoEmpleado[]=[];
    supervisorSeleccionado: number | null=null;
    zonas: any[]=[];
    zonaSeleccionada: number | null=null;
    filtroActivo=false;
    protected readonly Autoridades=Autoridades;
    private securityService=inject(JWTService);
    private zonaService=inject(ZonaService);
    private catalogoEmpleadoService=inject(CatalogoEmpleadoService)

    get numEmpleadosActivos() {
        return this.empleados().filter((z) => z.estatus === 'A').length;
    }

    get numEmpleadosInactivos() {
        return this.empleados().filter((z) => z.estatus === 'B').length;
    }

    get numEmpleadosReingreso() {
        return this.empleados().filter((z) => z.estatus === 'R').length;
    }

    get puedeUsarFiltroAvanzado() {
        const empleadoId=this.securityService.getUser().employeeName.id;
        return !(this.securityService.hasAuthority(Autoridades.EMPLEADOS_RESTRINGIR_FILTRO_SUPERVISOR) && empleadoId);
    }

    ngOnInit() {
        this.loadEmpleados();
    }

    loadEmpleados() {
        this.loading.set(true)
        const usuarioSessionId=this.securityService.getUser().employeeName.id;
        const params=this.buildParams(usuarioSessionId);
        this.catalogoEmpleadoService.obtenerEmpleados(params).pipe(finalize(() => this.loading.set(false))).subscribe({
            next: (response) => {
                this.handleEmpleadosResponse(response.data);

            }, error: () => this.loading.set(false),
        });
    }

    extractUnidadesFromData(data: CatalogoEmpleado[]) {
        this.unidades=this.extractUniqueOptions(data, emp => emp.unidad.nombreCompleto);
    }

    extractPuestosFromData(data: CatalogoEmpleado[]) {
        this.puestos=this.extractUniqueOptions(data, emp => emp.puesto.nombre);
    }

    extractEstatusFromData(data: CatalogoEmpleado[]) {
        if(!this.securityService.hasAuthority(Autoridades.EMPLEADOS_VER_INDICADORES)) return;

        const estatusMap={'A': 'Activo', 'R': 'Reingreso', 'B': 'Baja'};
        this.estatusOptions=[...new Set(data.map(emp => emp.estatus))]
            .filter(Boolean)
            .map(estatus => ({name: estatusMap[estatus] || estatus, code: estatus}))
            .sort((a,
                   b) => a.name.localeCompare(b.name));
    }

    onUnidadChange(value: string[]) {
        this.selectedUnidad=value;
        this.applyFilters();
    }

    onPuestoChange(value: string[]) {
        this.selectedPuesto=value;
        this.applyFilters();
    }

    onEstatusChange(value: string[]) {
        this.selectedEstatus=value;
        this.applyFilters();
    }

    onSearchChange(value: string) {
        this.searchValue=value;
        this.applyFilters();
    }

    onFilter(event: any) {
        // No actualizar las opciones de filtro cuando se filtra la tabla
        // Las opciones deben mantenerse basadas en el catálogo original
    }

    sincronizar() {
        this.catalogoEmpleadoService.removeCache();
        this.loadEmpleados();
    }

    exportarExcel() {
        const datosParaExportar: CatalogoEmpleado[]=this.dt.filteredValue || this.empleados();
        EmpleadoExcelGenerator.generarExcel(datosParaExportar);
    }

    imprimir() {
        const tableElement=this.dt.el.nativeElement.querySelector('table');
        const clonedTable=tableElement.cloneNode(true) as HTMLElement;

        // Remover controles de paginación y elementos no necesarios
        const sortIcons=clonedTable.querySelectorAll('p-sorticon, .p-sortable-column-icon');
        sortIcons.forEach((icon) => icon.remove());

        const printWindow=window.open('', '_blank');

        if(printWindow) {
            const totalEmpleados=this.dt.filteredValue ? this.dt.filteredValue.length : this.empleados().length;

            printWindow.document.documentElement.innerHTML=`
                <html>
                    <head>
                        <title>Catálogo de Colaboradores</title>
                        <style>
                            body { font-family: Inter, sans-serif; margin: 20px; }
                            h1 { text-align: center; margin-bottom: 20px; }
                            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; font-size: 8px; }
                            th { background-color: #f5f5f5; font-weight: bold; }
                            tr:nth-child(even) { background-color: #f9f9f9; }
                            .inline-flex { display: inline; }
                            .pi { display: none; }
                            .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; font-size: 10px; color: #666; }
                            .footer-content { display: flex; justify-content: space-between; align-items: center; }
                        </style>
                    </head>
                    <body>
                        <h1>Catálogo de Colaboradores</h1>
                        ${clonedTable.outerHTML}
                        <div class="footer">
                            <div class="footer-content">
                                <div>Total de empleados: ${totalEmpleados}</div>
                                <div>Generado el ${new Date().toLocaleString('es-ES')}</div>
                            </div>
                        </div>
                    </body>
                </html>
            `;
            printWindow.focus();
            printWindow.print();
            printWindow.close();
        }
    }

    mostrarFiltroAvanzado() {
        this.cargarSupervisores();
        this.cargarZonas();
        this.mostrarModal=true;
    }

    cargarSupervisores() {
        this.catalogoEmpleadoService.obtenerSupervisores().subscribe({
            next: (response) => {
                this.supervisores=response.data;
            }, error: (error) => console.error('Error al cargar supervisores:', error),
        });
    }

    cargarZonas() {
        this.zonaService.obtenerZonas().subscribe({
            next: (response) => {
                this.zonas=response.data;
            }, error: (error) => console.error('Error al cargar zonas:', error),
        });
    }

    aplicarFiltroAvanzado() {
        const params=this.buildFiltroAvanzadoParams();
        if(!params) {
            this.mostrarModal=false;
            return;
        }

        this.catalogoEmpleadoService.obtenerEmpleados(params).subscribe({
            next: (response) => {
                this.handleEmpleadosResponse(response.data);
                this.filtroActivo=true;
            }, error: (error) => console.error('Error al filtrar empleados:', error),
        });
        this.mostrarModal=false;
    }

    limpiarFiltros() {
        this.supervisorSeleccionado=null;
        this.zonaSeleccionada=null;
        this.filtroActivo=false;
        this.mostrarModal=false;

        // Limpiar filtros de la tabla y del input de búsqueda
        this.searchValue='';
        this.selectedUnidad=[];
        this.selectedPuesto=[];
        this.selectedEstatus=[];

        // Restaurar datos originales y recargar
        this.loadEmpleados();

        // Limpiar filtros de la tabla
        if(this.dt) {
            this.dt.clear();
        }
    }

    private applyFilters() {
        if(!this.dt) {
            return;
        }

        // Limpiar todos los filtros primero
        this.dt.clear();

        // Aplicar filtros de columna primero (estos se aplican a nivel de columna)
        if(this.selectedUnidad && this.selectedUnidad.length>0) {
            this.dt.filter(this.selectedUnidad, 'unidadNombreCompleto', 'in');
        }

        if(this.selectedPuesto && this.selectedPuesto.length>0) {
            this.dt.filter(this.selectedPuesto, 'puestoNombre', 'in');
        }

        if(this.selectedEstatus && this.selectedEstatus.length>0) {
            this.dt.filter(this.selectedEstatus, 'estatus', 'in');
        }

        // Aplicar filtro global al final (este busca en múltiples campos)
        // Solo aplicar si hay valor, de lo contrario dejar que los filtros de columna funcionen solos
        if(this.searchValue && this.searchValue.trim()) {
            this.dt.filterGlobal(this.searchValue.trim(), 'contains');
        }
    }

    private buildParams(empleadoId: number | null): FiltroEmpleado {
        if(this.securityService.hasAuthority(Autoridades.EMPLEADOS_RESTRINGIR_FILTRO_SUPERVISOR) && empleadoId) {
            return {idSupervisor: empleadoId};
        } else if(this.securityService.hasAuthority(Autoridades.EMPLEADOS_VISUALIZAR_EMPLEADOS_RESPONSABLES) && empleadoId) {
            return {idResponsable: empleadoId};
        }
        return {};
    }

    private handleEmpleadosResponse(data: CatalogoEmpleado[]) {
        // Agregar campos planos para los filtros de PrimeNG
        const dataConCamposPlanos=data.map(emp => ({
            ...emp,
            unidadNombreCompleto: emp.unidad?.nombreCompleto || '',
            puestoNombre: emp.puesto?.nombre || '',
        }));

        this.empleados.set(dataConCamposPlanos);
        this.loading.set(false);

        // Si no hay filtro activo, actualizar el catálogo original y los filtros
        if(!this.filtroActivo) {
            this.empleadosOriginales=[...dataConCamposPlanos];
            this.updateFilters(dataConCamposPlanos);
        }
        // Si hay filtro activo, mantener las opciones de filtro del catálogo original

        // Aplicar filtros después de que la tabla esté lista (usando setTimeout para asegurar que dt esté inicializado)
        setTimeout(() => {
            if(this.dt) {
                this.applyFilters();
            }
        }, 0);
    }

    private updateFilters(data: CatalogoEmpleado[]) {
        this.extractUnidadesFromData(data);
        this.extractPuestosFromData(data);
        this.extractEstatusFromData(data);
    }

    private extractUniqueOptions(data: CatalogoEmpleado[],
                                 mapper: (emp: CatalogoEmpleado) => string) {
        return [...new Set(data.map(mapper))]
            .filter(Boolean)
            .map(value => ({name: value, code: value}))
            .sort((a,
                   b) => a.name.localeCompare(b.name));
    }

    private buildFiltroAvanzadoParams() {
        if(!this.supervisorSeleccionado && !this.zonaSeleccionada) return null;

        const params: any={};
        if(this.supervisorSeleccionado) params.idSupervisor=this.supervisorSeleccionado;
        if(this.zonaSeleccionada) params.idZona=this.zonaSeleccionada;
        return params;
    }
}
