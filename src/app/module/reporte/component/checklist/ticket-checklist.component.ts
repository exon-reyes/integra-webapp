import {Component, inject, Input, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Checkbox, CheckboxChangeEvent} from 'primeng/checkbox';
import {MessageService} from 'primeng/api';
import {ChecklistService, TIPOCHECKLIST} from '@/core/services/checklist/checklist.service';
import {Checklist} from '@/models/checklist/checklist';
import {Actividad} from '@/models/checklist/actividad';

@Component({
    selector: 'ticket-checklist',
    standalone: true,
    imports: [CommonModule, FormsModule, Checkbox],
    template: `
        <div class="bg-white border border-gray-200 rounded-lg shadow-sm">
            <div class="bg-gray-50 px-4 py-3 border-b border-gray-200 rounded-t-lg">
                <div class="flex items-center justify-between">
                    <h5 class="text-sm font-semibold text-gray-900 flex items-center">
                        <i class="pi pi-list text-blue-600 mr-2 text-sm"></i>
                        Checklist de Actividades
                    </h5>
                    @if (checklist?.totalActividades > 0) {
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <span>{{ checklist?.actividadesCompletadas }} de {{ checklist?.totalActividades }} completadas</span>
                            <span class="text-blue-600 font-medium">{{ checklist?.porcentajeCompletado }}%</span>
                        </div>
                    }
                </div>
                @if (checklist?.totalActividades > 0) {
                    <div class="mt-2">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" [style.width.%]="checklist?.porcentajeCompletado"></div>
                        </div>
                    </div>
                }
            </div>

            <div class="p-4">
                @if (checklist?.actividades?.length > 0) {
                    <div class="space-y-3">
                        @for (actividad of checklist?.actividades; track actividad.id || $index) {
                            <div class="flex items-start gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                                <p-checkbox [(ngModel)]="actividad.completada" (onChange)="onActividadChange(actividad, $event)" [disabled]="actualizando()" [binary]="true"></p-checkbox>
                                <div class="flex-1">
                                    <p class="text-sm font-medium text-gray-900" [class.line-through]="actividad.completada" [class.text-gray-500]="actividad.completada">
                                        {{ actividad.descripcion }}
                                    </p>
                                    @if (actividad.fechaCompletado) {
                                        <p class="text-xs text-green-600 mt-1">
                                            <i class="pi pi-check-circle mr-1"></i>
                                            Completada el {{ formatDate(actividad.fechaCompletado) }}
                                        </p>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                } @else {
                    <div class="text-center py-8 text-gray-500">
                        <i class="pi pi-list text-3xl mb-2"></i>
                        <p>No hay actividades registradas para este ticket</p>
                    </div>
                }
            </div>
        </div>
    `,
})
export class TicketChecklistComponent implements OnInit {
    @Input() esObservacionActividad: boolean=false;
    @Input() dataId!: number;
    @Input() checklist: Checklist | null=null;
    @Input() readonly: boolean=false;
    actualizando=signal(false);
    private checklistService=inject(ChecklistService);
    private messageService=inject(MessageService);

    ngOnInit() {
        // No need to load checklist as it comes from input
    }

    onActividadChange(actividad: Actividad,
                      event: CheckboxChangeEvent) {
        if(this.readonly) return;

        this.actualizando.set(true);
        const completada=event.checked;
        if(this.esObservacionActividad) {
        } else {
            this.checklistService.actualizarActividad(TIPOCHECKLIST.GENERAL, actividad.id!, {completada: completada}).subscribe({
                next: () => {
                    // Actualizar el modelo local
                    actividad.completada=completada;
                    actividad.fechaCompletado=completada ? new Date().toISOString() : null;

                    // Recalcular estadísticas localmente
                    this.recalcularEstadisticas();

                    this.messageService.add({
                        severity: 'success',
                        summary: 'Actividad actualizada',
                        detail: `Actividad ${completada ? 'completada' : 'marcada como pendiente'}`,
                    });
                },
                error: () => {
                    actividad.completada= !completada;
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo actualizar la actividad',
                    });
                },
                complete: () => this.actualizando.set(false),
            });
        }
    }

    formatDate(dateString: string): string {
        return new Date(dateString).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    }

    private recalcularEstadisticas() {
        if(!this.checklist?.actividades) return;

        const completadas=this.checklist.actividades.filter((a) => a.completada).length;
        const total=this.checklist.actividades.length;
        const porcentaje=total>0 ? Math.round((completadas / total) * 100) : 0;

        this.checklist.actividadesCompletadas=completadas;
        this.checklist.totalActividades=total;
        this.checklist.porcentajeCompletado=porcentaje;
    }
}
