import {Component, inject, Input, OnInit} from '@angular/core';
import {Subject, Subscription} from 'rxjs';
import {SpinnerComponent} from '@/components/spinner.component';
import {Panel} from 'primeng/panel';
import {UnidadService} from '@/core/services/empresa/unidad.service';

@Component({
    selector: 'app-operatividad',
    standalone: true,
    imports: [SpinnerComponent, Panel],
    template: `
        <p-panel header="Horarios de operación">
            @if (horarios || loading == false) {
                @if (horarios && horarios.length > 0) {
                    <div class="grid grid-cols-3 gap-3">
                        <div class="font-semibold">Horario</div>
                        <div class="font-semibold">Apertura</div>
                        <div class="font-semibold">Cierre</div>
                        <div class="col-span-3 border-b-1 border-b-gray-200"></div>
                        @for (i of horarios; track i.id) {
                            <div>{{ i.nombre }}</div>
                            <div>{{ i.apertura }}</div>
                            <div>{{ i.cierre }}</div>
                            <div class="col-span-3 border-b-1 border-b-gray-200"></div>
                        }
                    </div>
                } @else {
                    <span class="italic">No se encontraron resultados</span>
                }
            } @else {
                <br>
                <app-spinner></app-spinner>
            }
        </p-panel>

    `,
})
export class OperatividadComponent implements OnInit {
    @Input('id-unidad') idUnidad: number;
    protected loading: boolean=true;
    protected horarios!: any [];
    private subscription: Subscription;
    private destroy$=new Subject<void>();
    private unidadService=inject(UnidadService);

    ngOnInit(): void {
        this.subscription=this.unidadService
            .obtenerHorarios(this.idUnidad)
            .pipe()
            .subscribe({
                next: (value) => {
                    this.horarios=value.data;
                    this.loading=false;
                },
                error: () => (this.loading=false),
            });
    }
}
