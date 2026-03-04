import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {Select} from 'primeng/select';
import {Textarea} from 'primeng/textarea';

import {forkJoin, Subject, takeUntil} from 'rxjs';
import {CuentaService} from '@/core/services/cuenta/cuenta.service';
import {SpinnerComponent} from '@/components/spinner.component';
import {Unidad} from '@/models/empresa/unidad';
import {Proveedor} from '@/models/cuenta/proveedor';
import {Departamento} from '@/models/empresa/departamento';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {DepartamentoService} from '@/core/services/empresa/departamento.service';
import {MessageService} from 'primeng/api';
import {normalizeProperties} from '@/shared/util/object.util';

@Component({
    selector: 'app-actualizar',
    imports: [Button, InputText, ReactiveFormsModule, Select, SpinnerComponent, Textarea],
    templateUrl: './actualizar-credencial.component.html',
    styleUrl: './actualizar-credencial.component.scss',
})
export class ActualizarCredencialComponent implements OnInit,
                                                      OnDestroy {
    @Input('id-credencial') id: number;
    form: FormGroup;
    unidades: Unidad[]=[];
    proveedores: Proveedor[]=[];
    departamentos: Departamento[]=[];
    obteniendoDatos=false;
    @Output('cuenta-actualizada') success=new EventEmitter<void>();
    private destroy$=new Subject<void>();
    private cuentaService=inject(CuentaService);
    private unidadService=inject(UnidadService);
    private departamentoService=inject(DepartamentoService);
    private formBuilder=inject(FormBuilder);
    private messageService=inject(MessageService);

    constructor() {
        this.form=this.createForm();
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    guardar(): void {
        if(this.form.invalid) {
            this.form.markAllAsTouched(); // Marca todos los campos para mostrar errores
            return;
        }
        const credencial=normalizeProperties(this.getCredencial());
        this.cuentaService.actualizar(credencial).subscribe({
            next: (value) => {
                this.success.next();
                this.messageService.add({
                    severity: 'info',
                    summary: 'Cuenta actualizada',
                    life: 5000,
                });
            },
        });
    }

    getCredencial() {
        const formValue=this.form.value;
        return {
            id: this.id,
            proveedorId: formValue.proveedor?.id,
            departamentoId: formValue.departamento?.id,
            unidadId: formValue.unidad?.id,
            usuario: formValue.usuario,
            clave: formValue.clave,
            comentario: formValue.comentario,
        };
    }

    private createForm(): FormGroup {
        return this.formBuilder.group({
            unidad: [null, Validators.required],
            departamento: [null, Validators.required],
            proveedor: [null, Validators.required],
            usuario: [null, Validators.required],
            clave: [null, Validators.required],
            comentario: null,
        });
    }

    private loadData(): void {
        this.obteniendoDatos=true;

        forkJoin({
            proveedores: this.cuentaService.obtenerProveedores(),
            detalles: this.cuentaService.obtenerDetalles(this.id),
            units: this.unidadService.obtenerUnidades(),
            departamentos: this.departamentoService.obtenerDepartamentos(),
        })
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (data) => this.handleDataResponse(data),
                error: (err) => this.handleError(err),
                complete: () => (this.obteniendoDatos=false),
            });
    }

    private handleDataResponse(data: any): void {
        const cuenta=data.detalles.data;
        this.unidades=data.units.data;
        this.proveedores=data.proveedores.data;
        this.departamentos=data.departamentos.data;
        this.form.patchValue({
            departamento: cuenta.departamento,
            unidad: this.unidades.find((u) => u.id === cuenta.unidad.id),
            proveedor: this.proveedores.find((p) => p.id === cuenta.proveedor.id),
            usuario: cuenta.usuario,
            comentario: cuenta.comentario,
            clave: cuenta.clave,
        });
    }

    private handleError(err: any): void {
        console.error(err);
    }
}
