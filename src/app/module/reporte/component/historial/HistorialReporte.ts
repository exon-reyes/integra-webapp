import {Component, EventEmitter, inject, Input, OnInit, Output} from '@angular/core';
import {FormsModule} from '@angular/forms';
import {Seguimiento} from '@/models/reporte/seguimiento';
import {EstatusColorService} from '@/shared/service/estatus-color.service';
import {EstatusPublicoService} from '@/shared/service/estatus-publico.service';

@Component({
    selector: 'historial-ticket',
    imports: [FormsModule],
    templateUrl: './HistorialReporte.html',
    styleUrl: './HistorialReporte.scss',
})
export class HistorialReporte implements OnInit {
    @Input() historial: Seguimiento[] | null=null;
    @Output() hasData=new EventEmitter<boolean>();
    private tagEstatusService=inject(EstatusColorService);
    private estatusPublicoService=inject(EstatusPublicoService);

    ngOnInit(): void {
        this.checkHasData();
        this.evtCambioEstatusPublico();
    }

    getBadgeSeverity(statusId: number) {
        return this.tagEstatusService.getClass(statusId);
    }

    private checkHasData() {
        this.hasData.emit(this.historial?.length>0);
    }

    private evtCambioEstatusPublico() {
        this.estatusPublicoService.estatus$.subscribe({
            next: (value) => {
                if(value) {
                    this.checkHasData();
                }
            },
        });
    }
}
