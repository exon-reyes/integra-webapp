import {Component, computed, inject, input, OnDestroy, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TableModule} from 'primeng/table';
import {Area} from '@/models/area/area';
import {takeUntil} from 'rxjs/operators';
import {ActivatedRoute} from '@angular/router';
import {UsuarioService} from '@/core/services/usuario/usuario.service';
import {Subject} from 'rxjs';
import {Areas} from '@/modules/colabora/workspace/areas/areas';

@Component({
    selector: 'app-workspace',
    imports: [CommonModule, TableModule, Areas],
    templateUrl: './workspace.html',
    styleUrl: './workspace.scss',
})
export class Workspace implements OnInit,
                                  OnDestroy {
    // Input para recibir el ID del departamento desde el componente padre (opcional)
    departamentoId=input<number>();
    private readonly route=inject(ActivatedRoute);
    private readonly usuarioService=inject(UsuarioService);
    // Subject para manejar la destrucción del componente
    private readonly destroy$=new Subject<void>();
    // Signal para el departamento obtenido desde query params o input
    private readonly _departamentoActual=signal<number>(0);
    readonly departamentoActual=computed(() => this._departamentoActual());
    // Signals para manejo reactivo del estado
    private readonly _areas=signal<Area[]>([]);
    // Computed signals para datos derivados
    private readonly _loading=signal<boolean>(false);
    readonly loading=computed(() => this._loading());
    private readonly _error=signal<string | null>(null);
    readonly error=computed(() => this._error());
    private readonly _mostrarModalAgregar=signal<boolean>(false);
    readonly mostrarModalAgregar=computed(() => this._mostrarModalAgregar());

    ngOnInit() {
        // Prioridad: 1. Query params, 2. Input, 3. Valor por defecto
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe((params) => {
            const departamentoId=params['departamentoId'] ? parseInt(params['departamentoId']) : this.departamentoId() || this.obtenerDepartamentoPorDefecto();
            this._departamentoActual.set(departamentoId);
        });
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    abrirModalAgregar(): void {
        this._mostrarModalAgregar.set(true);
    }

    /**
     * Cierra el modal de agregar área
     */
    cerrarModalAgregar(): void {
        this._mostrarModalAgregar.set(false);
    }

    /**
     * Maneja el evento cuando se agrega una nueva área
     */
    onAreaAgregada(nuevaArea: Area): void {
        // Agregar la nueva área a la lista actual
        const areasActuales=this._areas();
        this._areas.set([...areasActuales, nuevaArea]);

        // Cerrar el modal
        this.cerrarModalAgregar();

        console.log('Área agregada exitosamente:', nuevaArea);
    }

    /**
     * Obtiene el departamento por defecto cuando no se proporciona ninguno
     * Utiliza el servicio de usuario para obtener el departamento del usuario actual
     */
    private obtenerDepartamentoPorDefecto(): number {
        // Valor por defecto
        return 12; // ID del departamento de TI/Mantenimiento
    }
}
