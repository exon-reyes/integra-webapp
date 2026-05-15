import {ChangeDetectionStrategy, Component, DestroyRef, inject, input, OnInit, output, signal,} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {Button} from 'primeng/button';
import {Select} from 'primeng/select';
import {ToggleSwitch} from 'primeng/toggleswitch';
import {MessageService} from 'primeng/api';
import {Operatividad} from '@/models/empresa/operatividad';
import {OperatividadService} from '@/service/OperatividadService';
import {GuardarHorariosRequest, HorarioOperativoService,} from '@/core/services/empresa/horario-operativo.service';
import {FormsModule} from "@angular/forms";
import {StateComponent} from "@/components/state.component";

export interface HorarioPendiente {
    operatividad: Operatividad;
    apertura: string;
    cierre: string;
    activo: boolean;
}

@Component({
    selector: 'app-agregar-operatividad',
    imports: [Button, Select, ToggleSwitch, FormsModule, StateComponent],
    standalone: true,
    templateUrl: './agregar-operatividad.html',
    styleUrl: './agregar-operatividad.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AgregarOperatividad implements OnInit {
    readonly idUnidad=input.required<number>();
    readonly configuracionTerminada=output<void>();

    protected readonly operatividades=signal<Operatividad[]>([]);
    protected readonly horariosPendientes=signal<HorarioPendiente[]>([]);
    protected readonly selectedOperatividad=signal<Operatividad | null>(null);
    protected readonly apertura=signal<string>('07:00');
    protected readonly cierre=signal<string>('22:00');
    protected readonly activo=signal<boolean>(true);
    protected readonly saving=signal(false);

    private readonly operatividadService=inject(OperatividadService);
    private readonly messageService=inject(MessageService);
    private readonly horarioOperativoService=inject(HorarioOperativoService);
    private readonly destroyRef=inject(DestroyRef);

    ngOnInit(): void {
        this.operatividadService
            .obtenerOperatividades()
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe((response) => this.operatividades.set(response.data));
    }

    protected agregarHorario(): void {
        const op=this.selectedOperatividad();
        if(!op) {
            this.warn('Seleccione una operatividad');
            return;
        }
        if(this.horariosPendientes().some((h) => h.operatividad.id === op.id)) {
            this.warn('Esta operatividad ya fue agregada');
            return;
        }
        this.horariosPendientes.update((list) => [
            ...list,
            {
                operatividad: op,
                apertura: this.apertura(),
                cierre: this.cierre(),
                activo: this.activo(),
            },
        ]);
        this.selectedOperatividad.set(null);
    }

    protected eliminarHorario(idOperatividad: number): void {
        this.horariosPendientes.update((list) =>
            list.filter((h) => h.operatividad.id !== idOperatividad)
        );
    }

    protected guardarConfiguracion(): void {
        if(this.horariosPendientes().length === 0) {
            this.configuracionTerminada.emit();
            return;
        }

        const request: GuardarHorariosRequest={
            idUnidad: this.idUnidad(),
            horarios: this.horariosPendientes().map((h) => ({
                idOperatividad: h.operatividad.id,
                apertura: h.apertura,
                cierre: h.cierre,
                activo: h.activo,
            })),
        };

        this.saving.set(true);
        this.horarioOperativoService
            .guardarHorarios(request)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.messageService.add({
                        severity: 'success',
                        summary: 'Proceso completado',
                        detail: 'Horarios guardados correctamente',
                    });
                    this.saving.set(false);
                    this.configuracionTerminada.emit();
                },
                error: () => {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudieron guardar los horarios',
                    });
                    this.saving.set(false);
                },
            });
    }

    private warn(detail: string): void {
        this.messageService.add({severity: 'warn', summary: 'Atención', detail});
    }
}
