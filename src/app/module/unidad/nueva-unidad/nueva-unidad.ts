import {Component, DestroyRef, inject, OnInit, signal} from '@angular/core';
import {FormBuilder, ReactiveFormsModule, Validators} from "@angular/forms";
import {Zona} from "@/models/ubicacion/zona";
import {Estado} from "@/models/ubicacion/estado";
import {CatalogoEmpleado, CatalogoEmpleadoService} from "@/service/catalogo-empleado.service";
import {UnidadService} from "@/core/services/empresa/unidad.service";
import {ZonaService} from "@/core/services/ubicacion/zona.service";
import {MessageService} from "primeng/api";
import {EstadoService} from "@/core/services/ubicacion/estado.service";
import {getControlErrorMessage, isControlInvalid} from "@/shared/util/form-validator";
import {InputText} from "primeng/inputtext";
import {Message} from "primeng/message";
import {Select} from "primeng/select";
import {Textarea} from "primeng/textarea";
import {Title} from "@/components/title";
import {normalizeProperties} from "@/shared/util/object.util";
import {catchError, finalize, forkJoin, of} from "rxjs";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {StepItem, StepperWidgetComponent} from "@/components/stepper-widget";
import {Button} from "primeng/button";
import {StateComponent} from "@/components/state.component";
import {AgregarOperatividad} from "@/module/operatividad/agregar-operatividad/agregar-operatividad";

@Component({
    standalone: true,
    selector: 'app-nueva-unidad',
    imports: [
        ReactiveFormsModule,
        InputText,
        Message,
        Select,
        Textarea,
        Title,
        InputText,
        Message,
        ReactiveFormsModule,
        Select,
        Textarea,
        StepperWidgetComponent,
        Button,
        StateComponent,
        AgregarOperatividad,
    ],
    templateUrl: './nueva-unidad.html',
    styleUrl: './nueva-unidad.scss',
})
export class NuevaUnidad implements OnInit {
    readonly idNuevaUnidad=signal<number | null>(null);
    readonly registrado=signal(false);
    readonly configurarHorario=signal(false)
    readonly saving=signal(false);
    readonly zonas=signal<Zona[]>([]);
    readonly estados=signal<Estado[]>([]);
    steps: StepItem[]=[
        {label: 'Registro', subtitle: 'Generales'},
        {label: 'Operatividad', subtitle: 'Horarios de atención'},
    ];
    currentStep=signal(0);
    protected readonly supervisores=signal<CatalogoEmpleado[]>([]);
    protected readonly isControlInvalid=isControlInvalid;
    protected readonly getControlErrorMessage=getControlErrorMessage;
    private readonly catalogoEmpleadoService=inject(CatalogoEmpleadoService)
    private readonly fb=inject(FormBuilder);
    readonly form=this.fb.nonNullable.group({
        clave: ['', [Validators.required, Validators.maxLength(10)]],
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        telefono: ['', Validators.maxLength(15)],
        email: ['', [Validators.email, Validators.maxLength(100)]],
        direccion: ['', Validators.maxLength(255)],
        idZona: [null as number | null, Validators.required],
        idSupervisor: [null as number | null, Validators.required],
        localizacion: [''],
        idEstado: [null as number | null, Validators.required],
    });
    private readonly unidadService=inject(UnidadService);
    private readonly zonaService=inject(ZonaService);
    private readonly estadoService=inject(EstadoService);
    private readonly messageService=inject(MessageService);
    private readonly destroyRef=inject(DestroyRef); // Gestión de memoria

    next() {
        this.configurarHorario.set(true)
    }

    onConfiguracionTerminada() {
        this.configurarHorario.set(false);
        this.registrado.set(false);
        this.form.reset();
        this.currentStep.set(0);
    }

    prev() {
        if(this.currentStep()>0) {
            this.registrado.set(false)
            this.form.reset();
            this.currentStep.set(0)
        }
    }

    ngOnInit(): void {
        this.loadCatalogos();
    }

    onSave(): void {
        if(this.form.invalid) {
            this.form.markAllAsTouched();
            this.showError('Complete los campos requeridos marcados en rojo');
            return;
        }

        this.saving.set(true);
        const rawData=this.form.getRawValue();
        const unidadData=normalizeProperties(rawData, {removeEmptyString: true});

        this.unidadService.registrarUnidad(unidadData)
            .pipe(
                finalize(() => this.saving.set(false)),
                catchError(() => {
                    return of(null);
                }),
                takeUntilDestroyed(this.destroyRef), // Prevención de Memory Leaks
            )
            .subscribe((response) => {
                if(response) {
                    this.idNuevaUnidad.set(response.data.id)
                    this.showSuccess(response.message);
                    this.form.reset();
                    this.currentStep.set(1);
                    this.registrado.set(true);
                }
            });
    }

    private loadCatalogos(): void {
        forkJoin({
            supervisores: this.catalogoEmpleadoService.obtenerSupervisores(),
            zonas: this.zonaService.obtenerZonas(),
            estados: this.estadoService.obtenerEstados(),
        })
            .pipe(catchError(() => {
                    this.showError('Error al cargar catálogos de zona o estado');
                    return of({supervisores: {data: []}, zonas: {data: []}, estados: {data: []}});
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(({supervisores, zonas, estados}) => {
                this.supervisores.set(supervisores.data)
                this.zonas.set(zonas.data);
                this.estados.set(estados.data);
            });
    }

    private showSuccess(detail: string): void {
        this.messageService.add({severity: 'success', summary: 'Proceso completado', detail});
    }

    private showError(detail: string): void {
        this.messageService.add({severity: 'error', summary: 'Error', detail});
    }
}
