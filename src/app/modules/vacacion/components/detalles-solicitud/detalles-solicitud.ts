import {
    ChangeDetectionStrategy,
    Component,
    computed,
    effect,
    inject,
    input,
    numberAttribute,
    signal
} from '@angular/core';
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
import {AlertComponent} from "@/components/alert";
import {ConfirmationService, MenuItem} from "primeng/api";
import {ConfirmDialogModule} from "primeng/confirmdialog";
import {DialogModule} from "primeng/dialog";
import {SelectButtonModule} from "primeng/selectbutton";
import {FormsModule} from "@angular/forms";
import {SplitButtonModule} from "primeng/splitbutton";
import {Checkbox} from "primeng/checkbox";

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
        Title,
        AlertComponent,
        ConfirmDialogModule,
        DialogModule,
        SelectButtonModule,
        FormsModule,
        SplitButtonModule,
        Checkbox
    ], providers: [ConfirmationService], templateUrl: './detalles-solicitud.html', styleUrl: './detalles-solicitud.scss'
})
export class DetallesSolicitud {
    folio=input.required<number, unknown>({transform: numberAttribute});
    detalles=signal<DetalleSolicitudDTO | undefined>(undefined);
    loading=signal(false);
    mostrarDialogoDias=signal(false);
    diasSeleccionados=signal<FechaSolicitudDetalle[]>([]);
    estatusSeleccionado=signal<string | null>(null);
    todosDiasSeleccionados=computed(() => {
        const d=this.detalles();
        if(!d || d.fechaSolicituds.length === 0) return false;
        return this.diasSeleccionados().length === d.fechaSolicituds.length;
    });
    configuracionBotonNivel1=computed(() => {
        const d=this.detalles();
        if(!d) return null;
        return {
            main: this.getSplitButtonMainAction(1, d.estatusPrimerResponsable),
            menu: this.getSplitButtonMenuItems(1, d.estatusPrimerResponsable)
        };
    });
    porcentajeDisponible=computed(() => {
        const d=this.detalles();
        if(!d || d.diasHabilitados === 0) return 0;
        const calculado=(d.restanteSiAprueba / d.diasHabilitados) * 100;
        // Evitamos valores negativos en el gráfico visual
        return calculado>0 ? Math.round(calculado) : 0;
    });
    configuracionBotonNivel2=computed(() => {
        const d=this.detalles();
        if(!d) return null;
        return {
            main: this.getSplitButtonMainAction(2, d.estatusSegundoResponsable),
            menu: this.getSplitButtonMenuItems(2, d.estatusSegundoResponsable)
        };
    });
    protected readonly getBadgeClasses=getBadgeClasses;
    protected readonly Autoridades=Autoridades;
    private readonly vacacionService=inject(VacacionAdminService);
    private userSession=inject(JWTService);
    protected currentUserId=this.userSession.getUser().employeeName.id;
    private readonly confirmationService=inject(ConfirmationService);

    constructor() {
        console.log(this.currentUserId);
        console.log(this.folio)
        effect(() => {
            const f=this.folio();
            if(f) {
                this.loading.set(true);
                this.vacacionService.obtenerDetallesSolicitud(f).subscribe({
                    next: (res) => {
                        this.detalles.set(res.data);
                        this.loading.set(false);
                    }, error: () => this.loading.set(false)
                });
            }
        });
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

    abrirDialogoDias() {
        this.diasSeleccionados.set([]);
        this.estatusSeleccionado.set(null);
        this.mostrarDialogoDias.set(true);
    }

    toggleTodosDias(event: any) {
        if(event.checked) {
            this.diasSeleccionados.set([...this.detalles()!.fechaSolicituds]);
        } else {
            this.diasSeleccionados.set([]);
        }
    }

    guardarCambiosDias() {
        const nivel=this.resolverNivelActual();
        const seleccionados=this.diasSeleccionados();
        const estatus=this.estatusSeleccionado();

        if(!nivel || seleccionados.length === 0 || !estatus) return;

        this.loading.set(true);
        const diasIds=seleccionados.map(d => d.id);

        this.vacacionService.actualizarEstatusSolicitudGranular({
            empleadoId: this.currentUserId, nuevoEstatus: estatus, nivel, diasIds
        }).subscribe({
            next: () => {
                this.mostrarDialogoDias.set(false);
                this.recargarDetalles();
            }, error: () => this.loading.set(false),
        });
    }

    getSplitButtonMainAction(nivel: 1 | 2,
                             estatus: string | undefined): any {
        // Nivel 2 no puede aprobar si nivel 1 ya canceló
        const nivel1Cancelo = nivel === 2 && this.detalles()?.estatusPrimerResponsable === 'CANCELADA';

        if (estatus === 'PENDIENTE') {
            if (nivel1Cancelo) {
                return {
                    label: 'Nivel 1 canceló',
                    icon: 'pi pi-ban',
                    severity: 'danger',
                    disabled: true,
                    command: () => {}
                };
            }
            return {
                label: 'Aprobar',
                icon: 'pi pi-check',
                severity: 'success',
                command: () => this.confirmarActualizacionGlobal(nivel, 'APROBADA')
            };
        } else if(estatus === 'APROBADA' || estatus === 'CANCELADA') {
            return {
                label: 'Revertir estatus',
                icon: 'pi pi-refresh',
                severity: 'secondary',
                command: () => this.confirmarActualizacionGlobal(nivel, 'PENDIENTE')
            };
        }
        return {
            label: 'Opciones', icon: 'pi pi-cog', command: () => {
            }
        };
    }

    getSplitButtonMenuItems(nivel: 1 | 2,
                            estatus: string | undefined): MenuItem[] {
        if(!estatus) return [];

        // Nivel 2 no puede aprobar si nivel 1 ya canceló
        const nivel1Cancelo = nivel === 2 && this.detalles()?.estatusPrimerResponsable === 'CANCELADA';

        const items: MenuItem[]=[];

        if(estatus !== 'APROBADA' && !nivel1Cancelo) {
            items.push({
                label: 'Aprobar',
                icon: 'pi pi-check',
                command: () => this.confirmarActualizacionGlobal(nivel, 'APROBADA')
            });
        }
        if(estatus !== 'PENDIENTE') {
            items.push({
                label: 'Pendiente',
                icon: 'pi pi-clock',
                command: () => this.confirmarActualizacionGlobal(nivel, 'PENDIENTE')
            });
        }
        if(estatus !== 'CANCELADA') {
            items.push({
                label: 'Cancelar',
                icon: 'pi pi-times',
                command: () => this.confirmarActualizacionGlobal(nivel, 'CANCELADA')
            });
        }
        return items;
    }

    actualizarEstatusNivel(nivel: 1 | 2,
                           estatus: string) {
        const currentDetalles=this.detalles();
        if(currentDetalles) {
            this.loading.set(true);
            this.vacacionService.actualizarEstatusSolicitud({
                empleadoId: this.currentUserId,
                folioSolicitud: this.folio(),
                id: currentDetalles.id,
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

    confirmarActualizacionGlobal(nivel: 1 | 2,
                                 estatus: string) {
        const accion=estatus === 'CANCELADA' ? 'cancelar' : (estatus === 'APROBADA' ? 'aprobar' : 'revertir a pendiente');
        this.confirmationService.confirm({
            message: `¿Estás seguro de que deseas ${accion} esta solicitud globalmente? Esto aplicará de forma incondicional el estatus <b>${estatus}</b> a todos los días de la solicitud para el nivel que operas.`,
            header: 'Confirmar actualización global',
            acceptLabel: 'Sí, continuar',
            rejectLabel: 'Cerrar',
            rejectButtonStyleClass: 'p-button-text',
            acceptButtonStyleClass: estatus === 'CANCELADA' ? 'p-button-danger' : 'p-button-primary',
            accept: () => {
                this.actualizarEstatusNivel(nivel, estatus);
            }
        });
    }

    /** Nivel más alto disponible: 2 tiene prioridad sobre 1. */
    private resolverNivelActual(): 1 | 2 | null {
        const d=this.detalles();
        if(!d) return null;
        if(this.currentUserId === d.segundoJefe?.id || this.puedeActualizarNivel2) return 2;
        if(this.currentUserId === d.primerJefe?.id || this.puedeActualizarNivel1) return 1;
        return null;
    }

    diasRange(n: number): number[] {
        return Array.from({length: n}, (_, i) => i);
    }

    private recargarDetalles(): void {
        this.vacacionService.obtenerDetallesSolicitud(this.folio()).subscribe({
            next: (res) => {
                this.detalles.set(res.data);
                this.loading.set(false);
            }, error: () => this.loading.set(false),
        });
    }

}
