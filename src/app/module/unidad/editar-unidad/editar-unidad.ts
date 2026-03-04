import {ChangeDetectionStrategy, Component, DestroyRef, effect, inject, input, output, signal} from '@angular/core';
import {takeUntilDestroyed} from '@angular/core/rxjs-interop';
import {FormBuilder, ReactiveFormsModule, Validators} from '@angular/forms';
import {Button} from 'primeng/button';
import {InputText} from 'primeng/inputtext';
import {Select} from 'primeng/select';
import {Textarea} from 'primeng/textarea';
import {Message} from 'primeng/message';
import {Checkbox} from 'primeng/checkbox';
import {MessageService} from 'primeng/api';

import {UnidadService} from '@/core/services/empresa/unidad.service';
import {ZonaService} from '@/core/services/ubicacion/zona.service';
import {EstadoService} from '@/core/services/ubicacion/estado.service';
import {normalizeProperties} from '@/shared/util/object.util';
import {isControlInvalid} from '@/shared/util/form-validator';
import {Zona} from '@/models/ubicacion/zona';
import {Estado} from '@/models/ubicacion/estado';
import {Unidad} from '@/models/empresa/unidad';
import {catchError, finalize, forkJoin, of} from 'rxjs';
import {CatalogoEmpleado, CatalogoEmpleadoService} from "@/service/catalogo-empleado.service";

@Component({
    selector: 'app-editar-unidad',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [
        ReactiveFormsModule,
        InputText,
        Select,
        Message,
        Textarea,
        Checkbox,
        Button,
    ],
    template: `
        <form [formGroup]="form" (ngSubmit)="onSave()" class="space-y-4">
            <h5>Generales</h5>
            <div class="grid gap-3 md:grid-cols-3">
                <div class="space-y-1.5">
                    <label for="clave" class="text-sm font-semibold required">Clave</label>
                    <input pInputText id="clave" formControlName="clave"
                           class="w-full"
                           placeholder="Ej: 5844"
                           [invalid]="isControlInvalid(form, 'clave', null)"/>
                    @if (isControlInvalid(form, 'clave', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            La clave es requerida
                        </p-message>
                    }
                </div>

                <div class="space-y-1.5">
                    <label for="nombre" class="text-sm font-semibold required">
                        Nombre de Unidad
                    </label>
                    <input pInputText id="nombre" formControlName="nombre"
                           class="w-full"
                           placeholder="Nombre descriptivo"
                           [invalid]="isControlInvalid(form, 'nombre', null)"/>
                    @if (isControlInvalid(form, 'nombre', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            El nombre es requerido
                        </p-message>
                    }
                </div>

                <div class="space-y-1.5">
                    <label for="sup" class="text-sm font-semibold required">
                        Supervisor
                    </label>
                    <p-select inputId="sup"
                              formControlName="idSupervisor"
                              [options]="supervisores()"
                              optionLabel="nombreCompleto"
                              optionValue="id"
                              appendTo="body"
                              placeholder="Seleccione un supervisor"
                              class="w-full"
                              [invalid]="isControlInvalid(form, 'idSupervisor', null)"/>
                    @if (isControlInvalid(form, 'idSupervisor', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            Seleccione un supervisor
                        </p-message>
                    }
                </div>
            </div>

            <h5>Contacto</h5>
            <div class="grid gap-3 md:grid-cols-2">
                <div class="space-y-1.5">
                    <label for="idZona" class="text-sm font-semibold required">Zona</label>
                    <p-select inputId="idZona"
                              formControlName="idZona"
                              [options]="zonas()"
                              optionLabel="nombre"
                              optionValue="id"
                              appendTo="body"
                              placeholder="Seleccione una zona"
                              class="w-full"
                              [invalid]="isControlInvalid(form, 'idZona', null)"/>
                    @if (isControlInvalid(form, 'idZona', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            Seleccione una zona
                        </p-message>
                    }
                </div>

                <div class="space-y-1.5">
                    <label for="idEstado" class="text-sm font-semibold required">Estado</label>
                    <p-select inputId="idEstado"
                              formControlName="idEstado"
                              [options]="estados()"
                              optionLabel="nombre"
                              optionValue="id"
                              appendTo="body"
                              placeholder="Seleccione un estado"
                              class="w-full"
                              [invalid]="isControlInvalid(form, 'idEstado', null)"/>
                    @if (isControlInvalid(form, 'idEstado', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            Seleccione un estado
                        </p-message>
                    }
                </div>

                <div class="space-y-1.5">
                    <label for="telefono" class="text-sm font-semibold">Teléfono</label>
                    <input pInputText id="telefono"
                           formControlName="telefono"
                           class="w-full"
                           placeholder="###-###-####"
                           [invalid]="isControlInvalid(form, 'telefono', null)"/>
                    @if (isControlInvalid(form, 'telefono', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            Teléfono inválido
                        </p-message>
                    }
                </div>

                <div class="space-y-1.5">
                    <label for="map" class="text-sm font-semibold">
                        Coordenadas (lat, lng)
                    </label>
                    <input pInputText id="map"
                           formControlName="localizacion"
                           class="w-full"
                           placeholder="Longitud, -Latitud"
                           [invalid]="isControlInvalid(form, 'localizacion', null)"/>
                    @if (isControlInvalid(form, 'localizacion', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            Formato inválido
                        </p-message>
                    }
                </div>

                <div class="space-y-1.5 md:col-span-2">
                    <label for="email" class="text-sm font-semibold">
                        Email Corporativo
                    </label>
                    <input pInputText id="email"
                           formControlName="email"
                           class="w-full"
                           placeholder="ejemplo@empresa.com"
                           [invalid]="isControlInvalid(form, 'email', null)"/>
                    @if (isControlInvalid(form, 'email', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            Formato de correo inválido
                        </p-message>
                    }
                </div>

                <div class="space-y-1.5 md:col-span-2">
                    <label for="direccion" class="text-sm font-semibold">Dirección</label>
                    <textarea pTextarea id="direccion"
                              formControlName="direccion"
                              rows="3"
                              class="w-full"
                              [autoResize]="false"
                              placeholder="Calle, número, colonia..."
                              [invalid]="isControlInvalid(form, 'direccion', null)">
                    </textarea>
                    @if (isControlInvalid(form, 'direccion', null)) {
                        <p-message severity="error" size="small" variant="simple">
                            La dirección excede el límite permitido
                        </p-message>
                    }
                </div>
            </div>

            <div class="flex items-center gap-2">
                <p-check-box formControlName="activo" [binary]="true" inputId="activo"/>
                <label for="activo" class="text-sm font-semibold">Unidad activa</label>
            </div>

            <div class="flex items-center justify-between pt-4 border-t border-slate-100">
                <span class="text-[11px] text-slate-600 font-medium">* Campos obligatorios</span>
                <div class="flex gap-3">
                    <p-button label="Actualizar Unidad"
                              icon="pi pi-save"
                              [loading]="saving()"
                              type="submit"/>
                </div>
            </div>
        </form>
    `,
})
export class EditarUnidad {
    unidad=input<Unidad | null>(null);
    unidadActualizada=output<void>();

    readonly saving=signal(false);
    readonly zonas=signal<Zona[]>([]);
    readonly estados=signal<Estado[]>([]);
    readonly supervisores=signal<CatalogoEmpleado[]>([]);
    protected readonly isControlInvalid=isControlInvalid;

    private readonly fb=inject(FormBuilder);
    readonly form=this.fb.nonNullable.group({
        id: [null as number | null],
        clave: ['', [Validators.required, Validators.maxLength(10)]],
        nombre: ['', [Validators.required, Validators.maxLength(100)]],
        telefono: ['', Validators.maxLength(15)],
        email: ['', [Validators.email, Validators.maxLength(100)]],
        activo: [true],
        direccion: ['', Validators.maxLength(255)],
        idZona: [null as number | null, Validators.required],
        idSupervisor: [null as number | null, Validators.required],
        localizacion: [''],
        idEstado: [null as number | null, Validators.required],
    });

    private readonly unidadService=inject(UnidadService);
    private readonly supervisorService=inject(CatalogoEmpleadoService);
    private readonly zonaService=inject(ZonaService);
    private readonly estadoService=inject(EstadoService);
    private readonly messageService=inject(MessageService);
    private readonly destroyRef=inject(DestroyRef);

    constructor() {
        this.loadCatalogos();

        effect(() => {
            const u=this.unidad();
            if(u?.id) this.loadUnidadData(u.id);
        });
    }

    onSave(): void {
        if(this.form.invalid) {
            this.form.markAllAsTouched();
            this.showError('Verifique los campos marcados en rojo');
            return;
        }

        this.saving.set(true);
        const rawData=this.form.getRawValue();
        const unidadData=normalizeProperties(rawData, {removeEmptyString: true});

        this.unidadService.actualizarUnidad(unidadData)
            .pipe(
                finalize(() => this.saving.set(false)),
                catchError(() => {
                    this.showError('No se pudo establecer conexión con el servidor');
                    return of(null);
                }),
                takeUntilDestroyed(this.destroyRef),
            )
            .subscribe(res => {
                if(res) {
                    this.showSuccess('Los cambios se guardaron correctamente');
                    this.unidadActualizada.emit();
                }
            });
    }

    private loadUnidadData(id: number): void {
        this.unidadService.obtenerContacto(id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: ({data}) => {
                    const supervisorId=this.supervisores().find(
                        s => s.nombreCompleto === data.supervisor?.nombreCompleto,
                    )?.id || null;

                    this.form.patchValue({
                        id: data.id,
                        clave: data.clave,
                        nombre: data.nombre,
                        telefono: data.contacto?.telefono || '',
                        email: data.contacto?.email || '',
                        direccion: data.contacto?.direccion || '',
                        idZona: data.contacto?.zona?.id || null,
                        activo: data.activo,
                        idSupervisor: supervisorId,
                        localizacion: data.contacto?.localizacion || '',
                        idEstado: data.contacto?.estado?.id || null,
                    });
                },
            });
    }

    private loadCatalogos(): void {
        forkJoin({
            supervisores: this.supervisorService.obtenerSupervisores(),
            zonas: this.zonaService.obtenerZonas(),
            estados: this.estadoService.obtenerEstados(),
        }).pipe(
            catchError(() => of({supervisores: {data: []}, zonas: {data: []}, estados: {data: []}})),
            takeUntilDestroyed(this.destroyRef),
        ).subscribe(res => {
            this.supervisores.set(res.supervisores.data);
            this.zonas.set(res.zonas.data);
            this.estados.set(res.estados.data);
        });
    }

    private showSuccess(detail: string) {
        this.messageService.add({severity: 'success', summary: 'Éxito', detail, life: 3000});
    }

    private showError(detail: string) {
        this.messageService.add({severity: 'error', summary: 'Error', detail});
    }
}
