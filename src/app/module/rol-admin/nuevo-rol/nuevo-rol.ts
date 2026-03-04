import {Component, EventEmitter, inject, Output} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {ResponseData} from '@/core/responseData';
import {Rol, RolService} from '@/module/rol-admin/service/rol.service';
import {NgClass} from '@angular/common';
import {InputText} from 'primeng/inputtext';
import {Button} from 'primeng/button';
import {InfoList, InfoItem} from '@/components/info-list';

@Component({
    selector: 'app-nuevo-rol',
    imports: [ReactiveFormsModule, NgClass, InputText, Button, InfoList],
    templateUrl: './nuevo-rol.html',
    styleUrl: './nuevo-rol.scss',
})
export class NuevoRol {
    // Evento para notificar al componente padre que se ha agregado un rol
    @Output() rolAgregado=new EventEmitter<Rol>();
    // Evento para notificar al componente padre que se debe cerrar el modal/panel
    @Output() cancelar=new EventEmitter<void>();
    loading=false;
    errorMessage: string | null=null;
    infoItems: InfoItem[]=[
        {
            subtitle: '1. Identidad',
            description: 'Defina el Nombre y la Descripción del rol.',
        },
        {
            subtitle: '2. Privilegios',
            description: 'La asignación de permisos debe realizarlo una vez registrado el rol.',
        },
    ];
    private fb=inject(FormBuilder);
    rolForm=this.fb.group({
        nombre: ['', [Validators.required, Validators.maxLength(50)]],
        descripcion: ['', [Validators.maxLength(255)]],
    });
    private rolService=inject(RolService);

    /**
     * Getter para fácil acceso a los controles del formulario
     */
    get f() {
        return this.rolForm.controls;
    }

    /**
     * Envía la solicitud para agregar el nuevo rol.
     */
    onSubmit(): void {
        this.errorMessage=null;

        if(this.rolForm.invalid) {
            this.rolForm.markAllAsTouched();
            return;
        }

        this.loading=true;

        const data={
            nombre: this.f.nombre.value as string,
            descripcion: this.f.descripcion.value || undefined, // Envía undefined si está vacío
        };

        this.rolService.agregarRol(data).subscribe({
            next: (response: ResponseData<Rol>) => {
                this.loading=false;
                if(response.data) {
                    this.rolAgregado.emit(response.data);
                    // Opcional: Reiniciar formulario después del éxito
                    this.rolForm.reset();
                } else {
                    this.errorMessage=response.message || 'El servidor devolvió una respuesta inesperada.';
                }
            },
            error: (err) => {
                this.loading=false;
                this.errorMessage='No se pudo conectar con el servicio o ocurrió un error interno.';
            },
        });
    }

    /**
     * Emite el evento para que el padre cierre el formulario.
     */
    onCancel(): void {
        this.cancelar.emit();
    }
}
