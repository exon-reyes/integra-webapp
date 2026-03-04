import {Component, computed, inject, input, output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {Checkbox} from 'primeng/checkbox';
import {Message} from 'primeng/message';
import {AreaService} from '@/core/services/empresa/area.service';
import {Area} from '@/models/area/area';
import {finalize} from 'rxjs/operators';

/**
 * Componente para agregar nuevas áreas
 *
 * Características:
 * - Formulario reactivo con validaciones
 * - Manejo de estados de carga y error
 * - Emisión de eventos para comunicación con componente padre
 * - Diseño responsive con PrimeNG
 *
 * @example
 * ```html
 * <app-agregar-area
 *   [visible]="mostrarModal"
 *   [departamentoId]="departamentoActual()"
 *   (onAreaAgregada)="onAreaAgregada($event)"
 *   (onCancelar)="onCancelarAgregarArea()" />
 * ```
 */
@Component({
    selector: 'app-agregar-area',
    imports: [
        CommonModule,
        ReactiveFormsModule,
        Dialog,
        Button,
        InputText,
        Checkbox,
        Message,
    ],
    templateUrl: './agregar-area.component.html',
    styleUrl: './agregar-area.component.scss',
})
export class AgregarAreaComponent {
    // Inputs del componente
    visible=input<boolean>(false);
    departamentoId=input<number>();
    // Outputs para comunicación con el padre
    onAreaAgregada=output<Area>();
    onCancelar=output<void>();
    // Inyección de dependencias
    private readonly fb=inject(FormBuilder);
    // Formulario reactivo
    readonly areaForm: FormGroup=this.fb.group({
        nombre: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
        externo: [false],
        generarFolio: [true],
    });
    readonly isFormDisabled=computed(() => this.areaForm.disabled);
    private readonly areaService=inject(AreaService);
    // Signals para manejo del estado
    private readonly _loading=signal<boolean>(false);
    // Computed signals
    readonly loading=computed(() => this._loading());
    private readonly _error=signal<string | null>(null);
    readonly error=computed(() => this._error());
    private readonly _formValid=signal<boolean>(false);

    constructor() {
        // Escuchar cambios en el formulario y actualizar el signal
        this.areaForm.statusChanges.subscribe(status => {
            console.log('Form status changed:', status);
            this._formValid.set(this.areaForm.valid);
        });

        this.areaForm.valueChanges.subscribe(value => {
            console.log('Form value changed:', value);
            this._formValid.set(this.areaForm.valid);
        });

        // Inicializar el estado del formulario
        this._formValid.set(this.areaForm.valid);
    }

    /**
     * Verifica si se puede enviar el formulario
     */
    canSubmit(): boolean {
        const formValid=this.areaForm.valid;
        const notLoading=!this.loading();
        const result=formValid && notLoading;

        console.log('canSubmit method:', {
            formValid,
            notLoading,
            result,
            formStatus: this.areaForm.status,
        });

        return result;
    }

    /**
     * Maneja el envío del formulario
     */
    onSubmit(): void {
        if(this.areaForm.invalid) {
            this.marcarCamposComoTocados();
            return;
        }

        const departamentoId=this.departamentoId();
        if(!departamentoId) {
            this._error.set('No se ha especificado el departamento');
            return;
        }

        this.guardarArea();
    }

    /**
     * Cancela la operación y cierra el modal
     */
    cancelar(): void {
        this.resetearFormulario();
        this.onCancelar.emit();
    }

    /**
     * Verifica si un campo tiene errores y ha sido tocado
     */
    tieneError(campo: string): boolean {
        const control=this.areaForm.get(campo);
        return !!(control?.invalid && control?.touched);
    }

    /**
     * Obtiene el mensaje de error para un campo específico
     */
    obtenerMensajeError(campo: string): string {
        const control=this.areaForm.get(campo);

        if(control?.errors?.['required']) {
            return `El campo ${campo} es requerido`;
        }

        if(control?.errors?.['minlength']) {
            const minLength=control.errors['minlength'].requiredLength;
            return `El campo ${campo} debe tener al menos ${minLength} caracteres`;
        }

        if(control?.errors?.['maxlength']) {
            const maxLength=control.errors['maxlength'].requiredLength;
            return `El campo ${campo} no puede exceder ${maxLength} caracteres`;
        }

        return '';
    }

    /**
     * Método de debug para verificar el estado del formulario
     * TODO: Remover en producción
     */
    debugFormState(): void {
        console.log('=== DEBUG FORM STATE ===');
        console.log('Form valid:', this.areaForm.valid);
        console.log('Form status:', this.areaForm.status);
        console.log('Form value:', this.areaForm.value);
        console.log('Form errors:', this.areaForm.errors);
        console.log('Loading:', this.loading());
        console.log('Can submit:', this.canSubmit());

        // Verificar cada control individualmente
        Object.keys(this.areaForm.controls).forEach(key => {
            const control=this.areaForm.get(key);
            console.log(`Control ${key}:`, {
                value: control?.value,
                valid: control?.valid,
                errors: control?.errors,
                touched: control?.touched,
                dirty: control?.dirty,
            });
        });
        console.log('========================');
    }

    /**
     * Guarda el área usando el servicio real de la API
     */
    private guardarArea(): void {
        this._loading.set(true);
        this._error.set(null);

        // Deshabilitar formulario durante la carga
        this.toggleFormState(false);

        const formValue=this.areaForm.value;
        const departamentoId=this.departamentoId();

        if(!departamentoId) {
            this._error.set('No se ha especificado el departamento');
            this._loading.set(false);
            this.toggleFormState(true);
            return;
        }

        const nuevaArea: Area={
            nombre: formValue.nombre,
            externo: formValue.externo,
            generarFolio: formValue.generarFolio,
            idDepartamento: departamentoId,
        };

        // Llamada real al servicio de la API
        this.areaService.crearArea(nuevaArea)
            .pipe(
                finalize(() => {
                    this._loading.set(false);
                    this.toggleFormState(true);
                }),
            )
            .subscribe({
                next: (response) => {
                    if(response.data) {
                        this.onAreaAgregada.emit(response.data);
                        this.resetearFormulario();
                        console.log('Área creada exitosamente:', response.data);
                    } else {
                        this._error.set('Error al crear el área. No se recibieron datos del servidor.');
                    }
                },
                error: (error) => {
                    console.error('Error al crear área:', error);

                    // Manejo de errores más específico
                    let errorMessage='Error al crear el área. Por favor, intente nuevamente.';

                    if(error.status === 400) {
                        errorMessage='Datos inválidos. Verifique la información ingresada.';
                    } else if(error.status === 409) {
                        errorMessage='Ya existe un área con ese nombre en este departamento.';
                    } else if(error.status === 500) {
                        errorMessage='Error interno del servidor. Contacte al administrador.';
                    }

                    this._error.set(errorMessage);
                },
            });
    }

    /**
     * Habilita o deshabilita el formulario
     */
    private toggleFormState(enabled: boolean): void {
        if(enabled) {
            this.areaForm.enable();
        } else {
            this.areaForm.disable();
        }
    }

    /**
     * Resetea el formulario y limpia errores
     */
    private resetearFormulario(): void {
        this.areaForm.reset({
            nombre: '',
            externo: false,
            generarFolio: true,
        });
        this._error.set(null);
    }

    /**
     * Marca todos los campos como tocados para mostrar validaciones
     */
    private marcarCamposComoTocados(): void {
        Object.keys(this.areaForm.controls).forEach(key => {
            this.areaForm.get(key)?.markAsTouched();
        });
    }
}
