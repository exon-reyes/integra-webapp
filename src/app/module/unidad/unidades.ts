import {Component, computed, DestroyRef, inject, OnInit, signal, ViewChild} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {CommonModule} from '@angular/common';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {ToastModule} from 'primeng/toast';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {DialogModule} from 'primeng/dialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {Button} from 'primeng/button';
import {Table, TableModule} from 'primeng/table';
import {ContactoComponent} from '@/components/unidad/contacto.component';
import {SpinnerComponent} from '@/components/spinner.component';
import {Unidad} from '@/models/empresa/unidad';
import {OperatividadComponent} from '@/components/unidad/operatividad.component';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {Zona} from '@/models/ubicacion/zona';
import {catchError, finalize, of} from 'rxjs';
import {Zonas} from '@/module/zonas/zonas';
import {Title} from '@/components/title';
import {Autoridades} from '@/core/Autoridades';
import {HasPermissionDirective} from '@/core/security/HasPermissionDirective';
import {SpinnerService} from '@/shared/service/spinner.service';
import {UnidadExcelGenerator} from './unidad-excel-generator';
import {Panel} from 'primeng/panel';
import {StatWidgetComponent} from "@/components/stat-widget";
import {EditarUnidad} from "@/module/unidad/editar-unidad/editar-unidad";
import {ZonaService} from "@/core/services/ubicacion/zona.service";
import {RouterLink} from "@angular/router";

@Component({
    selector: 'app-sucursal', standalone: true, imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        ToastModule,
        ConfirmDialogModule,
        DialogModule,
        Button,
        TableModule,
        ContactoComponent,
        SpinnerComponent,
        OperatividadComponent,
        IconField,
        InputIcon,
        InputText,
        Select,
        Zonas,
        Title,
        HasPermissionDirective,
        Panel,
        StatWidgetComponent,
        EditarUnidad,
        RouterLink,
    ], templateUrl: './unidades.html',
})
export class Unidades implements OnInit {
    @ViewChild('dt') dt!: Table;

    // Signals
    readonly unidades=signal<Unidad[]>([]);
    readonly zonas=signal<Zona[]>([]);
    readonly exporting=signal(false);
    isEditMode=false
    readonly filtroSupervisor=signal<string | null>(null);
    readonly filtroZona=signal<string | null>(null);
    readonly filtroEstatus=signal<boolean | null>(null);

    displayZonasDialog=false;
    openGeneralDialog=false;
    unidadSeleccionada=0;
    searchValue='';

    // Constants
    readonly estatusOptions=[
        {label: 'Activo', value: true}, {label: 'Inactivo', value: false},
    ];
    // Computed signals (memoizados automáticamente)
    readonly stats=computed(() => {
        const unidades=this.unidades();
        const activas=unidades.filter((u) => u.activo).length;
        return {
            activas, inactivas: unidades.length - activas, total: unidades.length,
        };
    });
    readonly supervisores=computed(() => {
        const seen=new Set<string>();
        return this.unidades()
            .filter((u) => {
                const nombre=u.supervisor?.nombreCompleto;
                if(!nombre || seen.has(nombre)) return false;
                seen.add(nombre);
                return true;
            })
            .map((u) => ({nombreCompleto: u.supervisor!.nombreCompleto}));
    });
    readonly unidadesFiltradas=computed(() => {
        const supervisor=this.filtroSupervisor();
        const zona=this.filtroZona();
        const estatus=this.filtroEstatus();

        // Early return si no hay filtros
        if(!supervisor && !zona && estatus === null) {
            return this.unidades();
        }

        return this.unidades().filter((unidad) => {
            if(supervisor && unidad.supervisor?.nombreCompleto !== supervisor) return false;
            if(zona && unidad.contacto?.zona?.nombre !== zona) return false;
            if(estatus !== null && unidad.activo !== estatus) return false;
            return true;
        });
    });
    protected readonly Autoridades=Autoridades;
    protected selectedUnidad: Unidad;

    private readonly unidadService=inject(UnidadService);
    private readonly messageService=inject(MessageService);
    private readonly confirmationService=inject(ConfirmationService);
    private readonly spinnerService=inject(SpinnerService);
    private readonly zonaService=inject(ZonaService);
    private readonly destroyRef=inject(DestroyRef);

    ngOnInit(): void {
        this.spinnerService.show();
        this.zonaService.obtenerZonas().pipe(takeUntilDestroyed(this.destroyRef)).subscribe({
            next: (response) => {
                this.zonas.set(response.data);
            },
        });
        this.loadData();
    }

    refreshData(): void {
        this.loadData()
    }

    openEditDialog(unidad: Unidad): void {
        this.selectedUnidad=unidad
        this.isEditMode=true
    }

    toggleStatus(unidad: Unidad): void {
        const newStatus=!unidad.activo;
        this.confirmAction(`¿Desea ${newStatus ? 'activar' : 'desactivar'} la unidad "${unidad.nombreCompleto}"?`, () => this.executeToggleStatus(unidad.id!, newStatus));
    }

    deleteUnidad(unidad: Unidad): void {
        this.confirmAction(`¿Está seguro de eliminar la unidad "${unidad.nombreCompleto}"? Esta acción no se puede deshacer.`, () => this.executeDelete(unidad.id!), true);
    }

    exportarExcel(): void {
        this.exporting.set(true);
        try {
            const datos=this.dt.filteredValue || this.unidadesFiltradas();
            UnidadExcelGenerator.generarExcel(datos);
        } finally {
            // Pequeño delay para feedback visual
            setTimeout(() => this.exporting.set(false), 500);
        }
    }

    abrirInfoGeneral(id: number): void {
        this.unidadSeleccionada=id;
        this.openGeneralDialog=true;
    }

    abrirDilogZonas(): void {
        this.displayZonasDialog=true;
    }

    sincronizar(): void {
        this.loadData();
    }

    onSupervisorChange(value: string | null): void {
        this.filtroSupervisor.set(value);
    }

    onZonaChange(value: string | null): void {
        this.filtroZona.set(value);
    }

    onEstatusChange(value: boolean | null): void {
        this.filtroEstatus.set(value);
    }

    // Private methods
    private loadData(): void {
        this.unidadService.filtrar({}).pipe(finalize(() => this.spinnerService.hide()), takeUntilDestroyed(this.destroyRef), catchError((err) => {
            this.messageService.add({
                severity: 'error',
                summary: 'Error al cargar datos',
                detail: 'No se pudieron obtener los registros',
            });
            return of({data: []});
        })).subscribe({
            next: (res) => {
                this.unidades.set(res.data);
            },
        })
    }

    private executeToggleStatus(id: number,
                                newStatus: boolean): void {
        this.unidadService
            .deshabilitarUnidad(id, newStatus)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Proceso completado',
                    detail: `Unidad ${newStatus ? 'activada' : 'desactivada'}`,
                })
                this.loadData();
            });
    }

    private executeDelete(id: number): void {
        this.unidadService
            .eliminarUnidad(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Proceso completado',
                    detail: 'Unidad eliminada',
                })
                this.loadData();
            });
    }

    private confirmAction(message: string,
                          accept: () => void,
                          danger=false): void {
        this.confirmationService.confirm({
            message,
            header: 'Confirmar acción',
            icon: 'pi pi-exclamation-triangle',
            rejectLabel: 'Cancelar',
            rejectButtonProps: {
                label: 'Cancelar', severity: 'secondary', outlined: true,
            },
            acceptButtonProps: {
                label: 'Si, continuar', severity: danger ? 'danger' : 'primary',
            },
            accept,
        });
    }
}
