import {Component, EventEmitter, inject, Input, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {Checkbox} from 'primeng/checkbox';
import {InputText} from 'primeng/inputtext';
import {MessageService} from 'primeng/api';
import {ChecklistService, TIPOCHECKLIST} from '@/core/services/checklist/checklist.service';

interface Actividad {
    id?: number | null;
    descripcion: string;
    completada: boolean;
    fechaCreacion?: string;
    fechaCompletado?: string | null;
    orden?: number;
}

@Component({
    selector: 'agregar-checklist',
    standalone: true,
    imports: [CommonModule, FormsModule, Dialog, Button, Checkbox, InputText],
    template: `
        <p-dialog [(visible)]="dialogVisible" modal="true" [style]="{ width: '50vw' }" [breakpoints]="{ '1199px': '75vw', '575px': '98vw' }" header="Agregar Checklist de Actividades" (onHide)="cerrarDialog()">
            <div class="space-y-4">
                <div class="flex items-center justify-between mb-4">
                    <label class="text-sm font-medium text-gray-900">Actividades a realizar</label>
                    @if (actividades.length > 0) {
                        <div class="flex items-center gap-2 text-sm text-gray-600">
                            <span>{{ actividadesCompletadas() }} de {{ actividades.length }} completadas</span>
                            <span class="text-blue-600 font-medium">{{ porcentajeCompletado() }}%</span>
                        </div>
                    }
                </div>

                @if (actividades.length > 0) {
                    <div class="mb-3">
                        <div class="w-full bg-gray-200 rounded-full h-2">
                            <div class="bg-blue-600 h-2 rounded-full transition-all duration-300" [style.width.%]="porcentajeCompletado()"></div>
                        </div>
                    </div>
                }

                <div class="space-y-2 max-h-60 overflow-y-auto">
                    @for (actividad of actividades; track $index) {
                        <div class="flex items-center gap-2 p-2 border border-gray-200 rounded-lg">
                            <p-checkbox [(ngModel)]="actividad.completada"></p-checkbox>
                            <input type="text" [(ngModel)]="actividad.descripcion" placeholder="Descripción de la actividad" class="flex-1 border-0 outline-none bg-transparent" pInputText />
                            <button type="button" class="text-red-500 hover:bg-red-50 p-1 rounded" (click)="eliminarActividad($index)" title="Eliminar actividad">
                                <i class="pi pi-trash text-sm"></i>
                            </button>
                        </div>
                    }
                </div>

                <button type="button" class="flex items-center gap-2 text-blue-600 hover:bg-blue-50 p-2 rounded-lg transition-colors w-full justify-center" (click)="agregarActividad()">
                    <i class="pi pi-plus"></i>
                    <span>Agregar actividad</span>
                </button>
            </div>

            <ng-template #footer>
                <div class="flex gap-2 justify-end">
                    <p-button label="Cancelar" severity="secondary" (onClick)="cerrarDialog()"></p-button>
                    <p-button label="Guardar" [disabled]="actividades.length === 0 || !todasActividadesTienenDescripcion()" [loading]="guardando()" (onClick)="guardarChecklist()"></p-button>
                </div>
            </ng-template>
        </p-dialog>
    `,
})
export class AgregarChecklistComponent {
    @Input() ticketId!: number;
    @Input() dialogVisible: boolean=false;
    @Output() closed=new EventEmitter<void>();
    @Output() saved=new EventEmitter<void>();

    actividades: Actividad[]=[];
    guardando=signal(false);

    private checklistService=inject(ChecklistService);
    private messageService=inject(MessageService);

    agregarActividad(): void {
        this.actividades.push({
            id: null,
            descripcion: '',
            completada: false,
            fechaCreacion: new Date().toISOString(),
            fechaCompletado: null,
            orden: this.actividades.length + 1,
        });
    }

    eliminarActividad(index: number): void {
        this.actividades.splice(index, 1);
    }

    actividadesCompletadas(): number {
        return this.actividades.filter((actividad) => actividad.completada).length;
    }

    porcentajeCompletado(): number {
        if(this.actividades.length === 0) return 0;
        return Math.round((this.actividadesCompletadas() / this.actividades.length) * 100);
    }

    todasActividadesTienenDescripcion(): boolean {
        return this.actividades.every((actividad) => actividad.descripcion.trim().length>0);
    }

    guardarChecklist(): void {
        if(!this.todasActividadesTienenDescripcion()) return;

        this.guardando.set(true);
        const request={
            actividades: this.actividades.map((actividad,
                                               index) => ({
                descripcion: actividad.descripcion,
                completada: actividad.completada,
                orden: index + 1,
            })),
            totalActividades: this.actividades.length,
            actividadesCompletadas: this.actividadesCompletadas(),
            porcentajeCompletado: this.porcentajeCompletado(),
        };

        this.checklistService.crearChecklist(TIPOCHECKLIST.GENERAL, this.ticketId, request).subscribe({
            next: () => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Checklist creado',
                    detail: 'El checklist se ha agregado exitosamente',
                });
                this.saved.emit();
                this.cerrarDialog();
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudo crear el checklist',
                });
            },
            complete: () => this.guardando.set(false),
        });
    }

    cerrarDialog(): void {
        this.dialogVisible=false;
        this.actividades=[];
        this.closed.emit();
    }
}
