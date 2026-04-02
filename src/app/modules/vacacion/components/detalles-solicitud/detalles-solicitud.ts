import {ChangeDetectionStrategy, Component, effect, inject, input, numberAttribute, signal} from '@angular/core';
import {VacacionAdminService} from "@/modules/vacacion/services/vacacion.service";
import {DetalleSolicitudDTO, FechaSolicitudDetalle} from "@/modules/vacacion/models/vacacion.model";
import {DatePipe, NgClass, NgOptimizedImage} from "@angular/common";
import {PanelModule} from "primeng/panel";
import {TableModule} from "primeng/table";
import {
    PipelineAprobacionComponent
} from "@/modules/vacacion/components/pipeline-aprobacion/PipelineAprobacionComponent";
import {getBadgeClasses} from "@/modules/vacacion/util/utils";
import {StatusBadgeComponent} from "@/components/StatusBadgeComponent";
import {Button} from "primeng/button";
import {JWTService} from "@/core/security/JWTService";
import {Autoridades} from "@/core/Autoridades";
import {SpinnerComponent} from "@/components/spinner.component";
import {Title} from "@/components/title";


@Component({
    selector: 'app-detalles-solicitud', changeDetection: ChangeDetectionStrategy.OnPush, imports: [
        DatePipe,
        NgClass,
        PanelModule,
        TableModule,
        PipelineAprobacionComponent,
        StatusBadgeComponent,
        NgOptimizedImage,
        Button,
        SpinnerComponent,
        Title
    ], templateUrl: './detalles-solicitud.html', styleUrl: './detalles-solicitud.scss'
})
export class DetallesSolicitud {
    folio=input.required<number, unknown>({transform: numberAttribute});
    detalles=signal<DetalleSolicitudDTO | undefined>(undefined);
    loading=signal(false);
    protected readonly getBadgeClasses=getBadgeClasses;
    protected readonly Autoridades=Autoridades;
    private readonly vacacionService=inject(VacacionAdminService);
    private userSession=inject(JWTService);
    protected currentUserId=this.userSession.getUser().employeeName.id;

    constructor() {
        console.log(this.currentUserId);
        console.log(this.folio)
        effect(() => {
            const f=this.folio();
            if(f) {
                this.loading.set(true);
                this.vacacionService.obtenerDetallesSolicitud(f).subscribe({
                    next: (res) => {
                        console.log(res.data.primerJefe.id)
                        this.detalles.set(res.data);
                        this.loading.set(false);
                    }, error: () => this.loading.set(false)
                });
            }
        });
    }

    get approvalPercentage(): number {
        const d=this.detalles();
        if(!d || !d.fechaSolicituds.length) return 0;
        const total=d.fechaSolicituds.length;
        const app=this.countStatus('APROBADA');
        return (app / total) * 100;
    }

    get puedeActualizarNivel1() {
        return this.userSession.hasAuthority(Autoridades.VACACIONES_AUTORIZACION_NIVEL1)
    }

    get puedeActualizarNivel2() {
        return this.userSession.hasAuthority(Autoridades.VACACIONES_AUTORIZACION_NIVEL2)
    }

    getStepCircleClasses(status: string | undefined): string {
        if(status === 'APROBADA') return 'bg-emerald-500 border-emerald-500 text-white';
        if(status === 'CANCELADA') return 'bg-rose-500 border-rose-500 text-white';
        if(status === 'PENDIENTE') return 'bg-amber-100 border-amber-400 text-amber-600';
        return 'bg-slate-100 border-slate-300 text-slate-400';
    }

    countStatus(status: string): number {
        const d=this.detalles();
        if(!d) return 0;
        return d.fechaSolicituds.filter(f => f.estatus === status).length;
    }

    marcarDia(day: FechaSolicitudDetalle, estatus: string): void {
        const nivel = this.resolverNivelActual();
        if (!nivel) return;
        this.loading.set(true);
        
        this.vacacionService.actualizarEstatusSolicitudGranular(day.id, {
            empleadoId: this.currentUserId,
            nuevoEstatus: estatus, nivel,
        }).subscribe({
            next: () => this.recargarDetalles(),
            error: () => this.loading.set(false),
        });
    }

    /** Determina el nivel de autorización del usuario actual (1 o 2), o null si no aplica. */
    private resolverNivelActual(): 1 | 2 | null {
        const d = this.detalles();
        if (!d) return null;
        if (this.currentUserId === d.primerJefe?.id || this.puedeActualizarNivel1) return 1;
        if (this.currentUserId === d.segundoJefe?.id || this.puedeActualizarNivel2) return 2;
        return null;
    }

    private recargarDetalles(): void {
        this.vacacionService.obtenerDetallesSolicitud(this.folio()).subscribe({
            next: (res) => {
                this.detalles.set(res.data);
                this.loading.set(false);
            },
            error: () => this.loading.set(false),
        });
    }

    actualizarEstatusNivel(nivel: 1 | 2,
                           estatus: string) {
        const currentDetalles=this.detalles();
        if(currentDetalles) {
            this.loading.set(true);

            this.vacacionService.actualizarEstatusSolicitud({
                empleadoId: this.currentUserId,
                folioSolicitud: this.folio(),
                nuevoEstatus: estatus,
                tipoSolicitud: currentDetalles.tipoSolicitud || 'VACACION',
                nivel: nivel
            }).subscribe({
                next: () => {
                    // Recargar datos
                    this.vacacionService.obtenerDetallesSolicitud(this.folio()).subscribe({
                        next: (res) => {
                            this.detalles.set(res.data);
                            this.loading.set(false);
                        }, error: () => this.loading.set(false)
                    });
                }, error: () => this.loading.set(false)
            });
        }
    }

}
