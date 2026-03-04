import {Component, EventEmitter, inject, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';
import {forkJoin, Subject, takeUntil} from 'rxjs';
import {HttpErrorResponse} from '@angular/common/http';
import {MessageService} from 'primeng/api';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {SpinnerComponent} from '@/components/spinner.component';
import {Textarea} from 'primeng/textarea';
import {ErrorComponent} from '@/shared/component/error/error.component';
import {ErrorResponseService} from '@/shared/service/error.response.service';
import {Unidad} from '@/models/empresa/unidad';
import {Departamento} from '@/models/empresa/departamento';
import {CuentaService} from '@/core/services/cuenta/cuenta.service';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {DepartamentoService} from '@/core/services/empresa/departamento.service';
import {normalizeProperties} from '@/shared/util/object.util';

@Component({
    selector: 'app-guardar-credencial',
    imports: [Button, InputText, ReactiveFormsModule, Select, SpinnerComponent, Textarea, ErrorComponent],
    providers: [ErrorResponseService],
    templateUrl: './registrar-credencial.component.html',
    styleUrls: ['./registrar-credencial.component.scss'],
})
export class RegistrarCredencialComponent implements OnInit,
                                                     OnDestroy {
    @Input('id-proveedor') idProveedor!: number;
    @Input('id-unidad') idUnidad!: number;
    @Output('cuenta-registrada') success=new EventEmitter<void>();
    @Input('id-departamento') idDepartamento!: number;
    myForm: FormGroup;
    unidades: Unidad[]=[];
    departamentos: Departamento[]=[];
    obteniendoDatos=false;
    protected readonly errorService=inject(ErrorResponseService);
    private destroy$=new Subject<void>();
    private readonly cuentaService=inject(CuentaService);
    private readonly unidadService=inject(UnidadService);
    private readonly departamentoService=inject(DepartamentoService);
    private readonly formBuilder=inject(FormBuilder);
    private readonly messageService=inject(MessageService);

    constructor() {
        this.myForm=this.createForm();
    }

    ngOnInit(): void {
        this.loadData();
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    isValidField(field: string): boolean {
        const control=this.myForm.get(field);
        return !!(control && control.invalid && control.touched);
    }

    guardar(): void {
        this.errorService.clear();

        if(this.myForm.invalid) {
            this.markAllFieldsAsTouched();
            return;
        }

        const credencial=normalizeProperties(this.getCredencial());

        this.cuentaService.registrar(credencial)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: () => this.onRegisterSuccess(),
                error: (error: HttpErrorResponse) => this.onRegisterError(error),
                complete: () => this.success.emit(),
            });
    }

    // Método reservado si quieres implementar validación de existencia
    protected existeCredencial(): void {
        // TODO: Implementar lógica de verificación si fuera necesario
    }

    private onRegisterSuccess(): void {
        this.messageService.add({
            life: 6000, detail: 'La cuenta se ha registrado exitosamente', summary: 'Completado', severity: 'success',
        });
    }

    private onRegisterError(error: HttpErrorResponse): void {
        this.errorService.setError({
            title: 'No se pudo guardar la cuenta', data: error.error?.data ?? {},
        });

        this.messageService.add({
            life: 5000, detail: 'Error al guardar la cuenta', summary: 'Error', severity: 'warn',
        });
    }

    private getCredencial() {
        const {unidad, departamento, usuario, clave, comentario}=this.myForm.value;
        return {
            proveedorId: this.idProveedor,
            unidadId: unidad?.id,
            departamentoId: departamento?.id,
            usuario,
            clave,
            comentario,
        };
    }

    private createForm(): FormGroup {
        return this.formBuilder.group({
            unidad: [null, Validators.required],
            departamento: [null, Validators.required],
            usuario: [null, Validators.required],
            clave: [null, Validators.required],
            comentario: [''],
        });
    }

    private loadData(): void {
        this.obteniendoDatos=true;

        forkJoin({
            unidades: this.unidadService.obtenerUnidades(),
            departamentos: this.departamentoService.obtenerDepartamentos(),
        }).pipe(takeUntil(this.destroy$))
            .subscribe({
                next: ({unidades, departamentos}) => {
                    this.unidades=unidades.data;
                    if(this.idUnidad) {
                        this.myForm.patchValue({unidad: this.unidades.find(u => u.id === this.idUnidad)})
                    }
                    this.departamentos=departamentos.data;
                    if(this.idDepartamento) {
                        this.myForm.patchValue({departamento: this.departamentos.find(u => u.id === this.idDepartamento)});
                    }
                }, error: (error) => this.handleDataError(error), complete: () => this.obteniendoDatos=false,
            });
    }

    private handleDataError(error: any): void {
        console.error('Error loading data:', error);
        this.obteniendoDatos=false;
    }

    private markAllFieldsAsTouched(): void {
        this.myForm.markAllAsTouched();
    }
}
