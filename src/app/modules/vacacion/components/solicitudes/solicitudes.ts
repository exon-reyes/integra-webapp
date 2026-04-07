import {Component, inject, signal} from '@angular/core';
import {Title} from "@/components/title";
import {Panel} from "primeng/panel";
import {DatePipe, NgClass, NgOptimizedImage} from "@angular/common";
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {SelectButton} from "primeng/selectbutton";
import {TableModule} from "primeng/table";
import {SolicitudesGestionDTO} from "@/modules/vacacion/models/vacacion.model";
import {StateComponent} from "@/components/state.component";
import {VacacionAdminService} from "@/modules/vacacion/services/vacacion.service";
import {Paginator} from "@/shared/util/paginator";
import {PaginatorModule} from "primeng/paginator";
import {
    PipelineAprobacionComponent
} from "@/modules/vacacion/components/pipeline-aprobacion/PipelineAprobacionComponent";
import {StatusBadgeComponent} from "@/components/StatusBadgeComponent";
import {RouterLink} from '@angular/router';
import {Button} from "primeng/button";
import {Toolbar} from "primeng/toolbar";
import {Menubar} from "primeng/menubar";
import {SpinnerService} from "@/shared/service/spinner.service";


export interface FiltroSolicitudes extends Paginator {
    estatus?: string;
}

@Component({
    selector: 'app-solicitudes', imports: [
        Title,
        Panel,
        DatePipe,
        ReactiveFormsModule,
        SelectButton,
        TableModule,
        FormsModule,
        StateComponent,
        NgClass,
        PaginatorModule,
        PipelineAprobacionComponent,
        StatusBadgeComponent,
        NgOptimizedImage,
        RouterLink,
        Button,
        Toolbar,
        Menubar
    ], templateUrl: './solicitudes.html', styleUrl: './solicitudes.scss'
})
export class Solicitudes {

    filterOptions=[
        {label: 'Todas', value: '', icon:'pi-bars'},
        {label: 'Pendientes', value: 'PENDIENTE', icon: 'pi-clock'},
        {label: 'Aprobadas', value: 'APROBADA', icon: 'pi-check-circle'},
        {label: 'Canceladas', value: 'CANCELADA', icon: 'pi-times'}
    ];
    statusFilter=signal<string>('PENDIENTE');
    loading=signal(false);
    currentPage=signal(0);
    pageSize=signal(10);
    totalRecords=signal(0);
    protected solicitudes: SolicitudesGestionDTO[]=[];
    private readonly solicitudService=inject(VacacionAdminService);
    private readonly spinner=inject(SpinnerService);

    onFilterChange(value: string): void {
        this.statusFilter.set(value);
        this.currentPage.set(0);
        this.cargarSolicitudes();
    }

    onPageChange(event: any) {
        const page=event.first / event.rows;
        this.currentPage.set(page);
        this.pageSize.set(event.rows);
        this.cargarSolicitudes();
    }

    private cargarSolicitudes(): void {
        this.loading.set(true);
        const filtro: FiltroSolicitudes={
            estatus: this.statusFilter(), currentPage: this.currentPage(), pageSize: this.pageSize()
        };

        this.solicitudService.getSolicitudesFiltradas(filtro).subscribe({
            next: (response) => {
                this.solicitudes=response.data || [];
                // PaginatedResponse delivers totalElements at the root
                this.totalRecords.set(response.totalElements ?? 0);
                this.loading.set(false);
            }, error: () => {
                this.loading.set(false);
            }
        });
    }

    exportarDatosActuales(): void {
        this.spinner.show();
        this.solicitudService.exportarValoresActuales().subscribe({
            next: (blob: Blob) => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `Reporte_Vacaciones_${new Date().toISOString().split('T')[0]}.xlsx`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
                this.spinner.hide();
            },
            error: () => {
                this.spinner.hide();
            }
        });
    }
}
