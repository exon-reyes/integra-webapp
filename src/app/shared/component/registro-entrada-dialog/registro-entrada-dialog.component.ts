/**
 * Componente standalone para el diálogo de registro de entrada/salida.
 * Optimizado para Angular v21 con signals, OnPush change detection y modern outputs.
 *
 * @author Sistema de Checador
 * @version 2.0.0
 */

import {Component, computed, effect, input, model, output, signal, untracked} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Dialog} from 'primeng/dialog';
import {Select} from 'primeng/select';
import {InputText} from 'primeng/inputtext';
import {Textarea} from 'primeng/textarea';
import {Button} from 'primeng/button';
import {TipoPausa} from '@/core/services/checador/TipoPausa';
import {Empleado} from '@/core/services/checador/Empleado';
import {Accion} from "@/module/checador/registro-manual/util/util";

/**
 * Interfaz para las opciones de acción disponibles
 */
interface OpcionAccion {
    value: Accion;
    label: string;
    svgIconName?: string;
}

/**
 * Interfaz para los datos del formulario de registro
 */
export interface RegistroFormData {
    tipoAccion: Accion;
    tipoPausa?: TipoPausa;
    hora?: string;
    horaInicio?: string;
    horaFin?: string;
    observaciones?: string;
    unidadId: number;
}

@Component({
    selector: 'registro-entrada-dialog',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        Dialog,
        Select,
        InputText,
        Textarea,
        Button,
    ],
    templateUrl: './registro-entrada-dialog.component.html',
})
export class RegistroEntradaDialogComponent {
    // ========================================================================
    // INPUTS (usando signal inputs de Angular v21)
    // ========================================================================

    /** Control de visibilidad del diálogo (two-way binding) */
    visible=model<boolean>(false);

    /** Empleado seleccionado */
    empleado=input<Empleado | null>(null);

    /** Lista de unidades disponibles */
    unidades=input<any[]>([]);

    /** Fecha seleccionada */
    date=input<Date | undefined>(new Date());

    /** Tipos de acción disponibles según el estado del empleado */
    tiposAccion=input<OpcionAccion[]>([]);

    /** Texto de la pausa activa */
    pausaActivaTexto=input<string | null>(null);

    /** Estado de carga */
    isLoading=input<boolean>(false);

    // ========================================================================
    // OUTPUTS (usando modern output API de Angular v21)
    // ========================================================================

    /** Evento cuando se envía el formulario */
    registroSubmit=output<RegistroFormData>();

    /** Evento cuando cambia la acción seleccionada */
    accionChange=output<Accion>();

    // ========================================================================
    // SIGNALS INTERNOS
    // ========================================================================

    /** Tipos de pausa disponibles */
    readonly tiposPausa=signal<Array<{ value: TipoPausa; label: string }>>([
        {value: 'COMIDA' as TipoPausa, label: 'Comida'},
        {value: 'OTRA' as TipoPausa, label: 'Otra'},
    ]);

    // ========================================================================
    // COMPUTED SIGNALS
    // ========================================================================

    /** Verifica si la fecha seleccionada es hoy */
    readonly esHoy=computed(() => {
        const fecha=this.date();
        if(!fecha) return false;
        const today=new Date();
        return fecha.getDate() === today.getDate() &&
            fecha.getMonth() === today.getMonth() &&
            fecha.getFullYear() === today.getFullYear();
    });

    /** Acción seleccionada actualmente */
    readonly accionSeleccionada=signal<Accion>('iniciarJornada');

    /** Verifica si debe mostrar el campo de tipo de pausa */
    readonly mostrarTipoPausa=computed(() =>
        this.accionSeleccionada() === 'iniciarPausa' ||
        this.accionSeleccionada() === 'registrarPausaCompleta',
    );

    /** Verifica si debe mostrar la pausa activa */
    readonly mostrarPausaActiva=computed(() =>
        this.accionSeleccionada() === 'finalizarPausa' && !!this.pausaActivaTexto(),
    );

    /** Verifica si debe mostrar campos de registro completo (inicio y fin) */
    readonly mostrarRegistroCompleto=computed(() =>
        this.accionSeleccionada() === 'registrarJornadaCompleta' ||
        this.accionSeleccionada() === 'registrarPausaCompleta',
    );

    /** Verifica si el registro implica cambio de día (Fin < Inicio) */
    readonly esDiaSiguiente=computed(() => {
        if(!this.mostrarRegistroCompleto()) return false;

        // Obtenemos los valores del form (necesitamos suscribirnos a cambios o usar un signal intermedio si el form es reactivo puro)
        // Como estamos usando signals para todo, podemos depender de un signal que se actualice con el form
        return this.checkEsDiaSiguiente();
    });

    /** Verifica si debe mostrar el campo de hora simple */
    readonly mostrarHoraSimple=computed(() =>
        !this.mostrarRegistroCompleto(),
    );

    // ========================================================================
    // FORMULARIO REACTIVO
    // ========================================================================

    readonly registroForm: FormGroup;

    // ========================================================================
    // CONSTRUCTOR E INICIALIZACIÓN
    // ========================================================================
    private readonly _triggerSignal=signal(0);

    constructor(private fb: FormBuilder) {
        this.registroForm=this.fb.group({
            tipoAccion: ['iniciarJornada' as Accion, Validators.required],
            tipoPausa: ['COMIDA' as TipoPausa],
            hora: [''],
            horaInicio: [''],
            horaFin: [''],
            observaciones: [''], // Comentario es opcional
            unidadId: [null as number | null, Validators.required],
        });
        // Inicializar hora actual
        this.registroForm.patchValue({hora: this.getHoraActual()});

        // Suscribirse a cambios para detectar día siguiente
        this.registroForm.valueChanges.subscribe(() => {
            this._triggerSignal.update(v => v + 1);
        });

        // Efecto para resetear el formulario cuando se abre el diálogo
        effect(() => {
            if(this.visible()) {
                untracked(() => {
                    this.resetForm();
                });
            }
        });
    }

    /**
     * Selecciona una acción y actualiza el formulario
     */
    seleccionarAccion(accion: Accion): void {
        this.accionSeleccionada.set(accion); // Actualizar signal para UI
        this.registroForm.patchValue({tipoAccion: accion});
        this.actualizarValidadores(accion);
        this.accionChange.emit(accion);
    }

    // ========================================================================
    // MÉTODOS PÚBLICOS
    // ========================================================================

    /**
     * Envía el formulario
     */
    onSubmit(): void {
        if(this.registroForm.invalid) {
            this.registroForm.markAllAsTouched();
            return;
        }

        const formValue=this.registroForm.value;
        this.registroSubmit.emit({
            tipoAccion: formValue.tipoAccion!,
            tipoPausa: formValue.tipoPausa,
            hora: formValue.hora,
            horaInicio: formValue.horaInicio,
            horaFin: formValue.horaFin,
            observaciones: formValue.observaciones!,
            unidadId: formValue.unidadId!,
        });
    }

    /**
     * Resetea el formulario a valores iniciales
     */
    resetForm(): void {
        const empleado=this.empleado();
        const unidades=this.unidades();

        // Preservar unidadId si el empleado tiene una unidad asignada
        const unidadIdInicial=empleado?.unidadAsignadaId ||
            (unidades.length === 1 ? unidades[0].id : null);

        const accionesDisponibles=this.tiposAccion();
        const accionInicial=accionesDisponibles.length>0 ? accionesDisponibles[0].value : 'iniciarJornada';

        this.registroForm.reset({
            tipoAccion: accionInicial,
            tipoPausa: 'COMIDA',
            hora: this.getHoraActual(),
            horaInicio: '',
            horaFin: '',
            observaciones: '',
            unidadId: unidadIdInicial,
        });

        // Resetear signal de acción seleccionada
        this.accionSeleccionada.set(accionInicial);

        // Actualizar validadores después del reset
        this.actualizarValidadores(accionInicial);
    }

    private checkEsDiaSiguiente(): boolean {
        this._triggerSignal(); // Dependencia para recalcular
        const inicio=this.registroForm.get('horaInicio')?.value;
        const fin=this.registroForm.get('horaFin')?.value;

        if(!inicio || !fin) return false;
        return fin<inicio;
    }

    /**
     * Actualiza los validadores según la acción y la fecha
     */
    private actualizarValidadores(accion: Accion): void {
        const horaControl=this.registroForm.get('hora');
        const horaInicioControl=this.registroForm.get('horaInicio');
        const horaFinControl=this.registroForm.get('horaFin');

        if(accion === 'registrarJornadaCompleta' || accion === 'registrarPausaCompleta') {
            // Registro completo: horaInicio/Fin requeridos, hora no
            horaControl?.clearValidators();
            horaInicioControl?.setValidators([Validators.required]);
            horaFinControl?.setValidators([Validators.required]);
        } else {
            // Otras acciones: hora requerida si NO es hoy
            horaInicioControl?.clearValidators();
            horaFinControl?.clearValidators();

            if(!this.esHoy()) {
                horaControl?.setValidators([Validators.required]);
            } else {
                horaControl?.clearValidators();
            }
        }

        horaControl?.updateValueAndValidity();
        horaInicioControl?.updateValueAndValidity();
        horaFinControl?.updateValueAndValidity();
    }

    /**
     * Obtiene la hora actual en formato HH:MM
     */
    private getHoraActual(): string {
        return new Date().toTimeString().split(' ')[0].substring(0, 5);
    }
}
