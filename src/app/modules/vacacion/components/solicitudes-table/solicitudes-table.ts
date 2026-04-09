import {ChangeDetectionStrategy, Component, Input, input, output} from '@angular/core';
import {DatePipe, NgClass, NgOptimizedImage} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Button} from 'primeng/button';
import {RouterLink} from '@angular/router';
import {SolicitudesGestionDTO} from '@/modules/vacacion/models/vacacion.model';
import {PipelineAprobacionComponent} from '@/modules/vacacion/components/pipeline-aprobacion/PipelineAprobacionComponent';
import {StatusBadgeComponent} from '@/components/StatusBadgeComponent';
import {StateComponent} from '@/components/state.component';
import {HasPermissionDirective} from '@/core/security/HasPermissionDirective';
import {Autoridades} from '@/core/Autoridades';

@Component({
    selector: 'app-solicitudes-table',
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        DatePipe,
        NgClass,
        NgOptimizedImage,
        TableModule,
        Button,
        RouterLink,
        PipelineAprobacionComponent,
        StatusBadgeComponent,
        StateComponent,
        HasPermissionDirective,
    ],
    templateUrl: './solicitudes-table.html',
    styles: `th.text-center { text-align: center !important; }`
})
export class SolicitudesTableComponent {
    solicitudes = input.required<SolicitudesGestionDTO[]>();
    loading = input(false);
    totalRecords = input(0);
    first = input(0);
    rows = input(10);
    paginator = input(true);
    lazy = input(true);
    showActions = input(true);

    pageChange = output<{ first: number; rows: number }>();
    papeletaClick = output<number>();
    deleteClick = output<number>();

    protected readonly Autoridades = Autoridades;
    @Input() showDetails!: boolean;

    onLazyLoad(event: any): void {
        this.pageChange.emit({first: event.first, rows: event.rows});
    }
}
