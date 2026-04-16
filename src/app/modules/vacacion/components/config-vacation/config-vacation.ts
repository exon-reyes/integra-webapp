import {ChangeDetectionStrategy, Component, computed, inject, signal} from '@angular/core';
import {Button} from 'primeng/button';
import {TableLazyLoadEvent, TableModule} from 'primeng/table';
import {Title} from '@/components/title';
import {StateComponent} from '@/components/state.component';
import {CatalogoEmpleado, CatalogoEmpleadoService, FiltroEmpleado} from "@/service/catalogo-empleado.service";
import {UnidadService} from "@/core/services/empresa/unidad.service";
import {Unidad} from "@/models/empresa/unidad";
import {MessageService} from "primeng/api";
import {DialogModule} from 'primeng/dialog';
import {FormsModule} from '@angular/forms';
import {Select} from "primeng/select";
import {InputTextModule} from "primeng/inputtext";
import {normalizeProperties} from "@/shared/util/object.util";
import {TabsModule} from 'primeng/tabs';
import {Subject} from "rxjs";
import {debounceTime, distinctUntilChanged} from "rxjs/operators";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {IconField} from "primeng/iconfield";
import {InputIcon} from "primeng/inputicon";
import {SpinnerComponent} from "@/components/spinner.component";

@Component({
    selector: 'app-config-vacation',
    standalone: true,
    imports: [
        Button,
        TableModule,
        Title,
        StateComponent,
        DialogModule,
        FormsModule,
        Select,
        InputTextModule,
        TabsModule,
        IconField,
        InputIcon,
        SpinnerComponent
    ],
    templateUrl: './config-vacation.html',
    styleUrl: './config-vacation.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfigVacation {
    readonly empleados=signal<CatalogoEmpleado[]>([]);
    readonly totalRecords=signal<number>(0);
    readonly loading=signal<boolean>(false);

    readonly empleadosCompletos=computed(() => this.empleados().filter(e => e.primerJefe && e.segundoJefe));
    readonly empleadosIncompletos=computed(() => this.empleados().filter(e => !e.primerJefe || !e.segundoJefe));

    // Filtros
    readonly displayFilterDialog=signal<boolean>(false);
    readonly supervisores=signal<CatalogoEmpleado[]>([]);
    readonly unidades=signal<Unidad[]>([]);
    readonly empleadosFiltro=signal<CatalogoEmpleado[]>([]);
    readonly activeFiltersCount=signal<number>(0);

    // Edicion
    readonly displayEditDialog=signal<boolean>(false);
    readonly loadingEdit=signal<boolean>(false);
    readonly selectedEditEmpleado=signal<CatalogoEmpleado | undefined>(undefined);
    editPrimerJefe: number | undefined;
    editSegundoJefe: number | undefined;

    selectedSupervisor: number | undefined=undefined;
    selectedUnidad: number | undefined=undefined;
    selectedEmpleado: number | undefined=undefined;

    // Busqueda
    searchQuery=signal<string>('');
    searchSubject=new Subject<string>();

    lastTableEvent: TableLazyLoadEvent | undefined=undefined;

    private messageService=inject(MessageService);
    private readonly catalogoEmpleadoService=inject(CatalogoEmpleadoService);
    private readonly unidadService=inject(UnidadService);

    constructor() {
        this.searchSubject.pipe(
            debounceTime(700),
            distinctUntilChanged(),
            takeUntilDestroyed()
        ).subscribe(value => {
            this.searchQuery.set(value);
            if(this.lastTableEvent) {
                this.lastTableEvent.first=0;
            }
            this.loadEmpleados(this.lastTableEvent);
        });
    }

    onSearchChange(event: Event) {
        const target=event.target as HTMLInputElement;
        this.searchSubject.next(target.value);
    }

    loadEmpleados(event?: TableLazyLoadEvent) {
        if(event) {
            this.lastTableEvent=event;
        } else {
            event=this.lastTableEvent;
        }

        this.loading.set(true);
        const filtros: FiltroEmpleado={
            page: event?.first !== undefined ? Math.floor((event.first || 0) / (event.rows || 50)) : 0,
            size: event?.rows || 50,
            idSupervisor: this.selectedSupervisor,
            unidadId: this.selectedUnidad,
            id: this.selectedEmpleado,
            clave: this.searchQuery() || undefined
        };

        this.catalogoEmpleadoService.obtenerAsignaciones(normalizeProperties(filtros, {
            removeUndefined: true,
            removeNull: true
        })).subscribe({
            next: (response) => {
                this.empleados.set(response.data);
                this.totalRecords.set(response.totalElements);
                this.loading.set(false);
            },
            error: () => {
                this.loading.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al cargar empleados, intente nuevamente'
                })
            }
        });
    }

    refreshTable() {
        this.loadEmpleados();
    }

    openFilterDialog() {
        this.displayFilterDialog.set(true);
        if(this.supervisores().length === 0) {
            this.catalogoEmpleadoService.obtenerSupervisores().subscribe({
                next: (response) => this.supervisores.set(response.data)
            });
        }
        if(this.unidades().length === 0) {
            this.unidadService.obtenerActivas().subscribe({
                next: (response) => this.unidades.set(response.data)
            });
        }
        if(this.empleadosFiltro().length === 0) {
            this.catalogoEmpleadoService.obtenerEmpleados({activos: true}).subscribe({
                next: (response) => this.empleadosFiltro.set(response.data)
            });
        }
    }

    applyFilters() {
        this.displayFilterDialog.set(false);

        let count=0;
        if(this.selectedSupervisor) count++;
        if(this.selectedUnidad) count++;
        if(this.selectedEmpleado) count++;
        this.activeFiltersCount.set(count);

        if(this.lastTableEvent) {
            this.lastTableEvent.first=0;
        }
        this.loadEmpleados(this.lastTableEvent);
    }

    clearFilters() {
        this.selectedSupervisor=undefined;
        this.selectedUnidad=undefined;
        this.selectedEmpleado=undefined;
        this.activeFiltersCount.set(0);
        this.applyFilters();
    }

    openEditDialog(empleado: CatalogoEmpleado) {
        this.selectedEditEmpleado.set(empleado);
        this.editPrimerJefe=empleado.primerJefe?.id;
        this.editSegundoJefe=empleado.segundoJefe?.id;

        if(this.empleadosFiltro().length === 0) {
            this.catalogoEmpleadoService.obtenerEmpleados({activos: true}).subscribe({
                next: (response) => this.empleadosFiltro.set(response.data)
            });
        }

        this.displayEditDialog.set(true);
    }

    saveEdit() {
        const emp=this.selectedEditEmpleado();
        if(!emp || !emp.id) return;

        this.loadingEdit.set(true);
        this.catalogoEmpleadoService.actualizarResponsables(emp.id, {
            primerResponsableId: this.editPrimerJefe || null,
            segundoResponsableId: this.editSegundoJefe || null
        }).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Éxito',
                    detail: 'Responsables actualizados correctamente'
                });
                this.displayEditDialog.set(false);
                this.loadingEdit.set(false);
                this.refreshTable();
            },
            error: () => {
                this.loadingEdit.set(false);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Ocurrió un error al actualizar los responsables'
                });
            }
        });
    }
}
