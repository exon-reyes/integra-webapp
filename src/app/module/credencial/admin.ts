import {Component, inject, OnInit, signal, ViewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators} from '@angular/forms';
import {Table, TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {IconFieldModule} from 'primeng/iconfield';
import {InputIconModule} from 'primeng/inputicon';
import {MultiSelectModule} from 'primeng/multiselect';
import {PanelModule} from 'primeng/panel';
import {DialogModule} from 'primeng/dialog';
import {PasswordModule} from 'primeng/password';
import {ConfirmationService, MenuItem, MessageService} from 'primeng/api';
import {ToastModule} from 'primeng/toast';
import {MenuModule} from 'primeng/menu';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {CredencialDto, CredencialService, TipoCuenta} from './credencial.service';
import {Select} from 'primeng/select';
import {Textarea} from 'primeng/textarea';
import {Tooltip} from 'primeng/tooltip';
import {Router} from '@angular/router';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {DepartamentoService} from '@/core/services/empresa/departamento.service';
import {Unidad} from '@/models/empresa/unidad';
import {Departamento} from '@/models/empresa/departamento';
import {TiposCuenta} from './tipos-cuenta';
import {Title} from '@/components/title';
import {ExcelGeneratorService} from "@/shared/service/excel-generator.service";

// Interfaces importadas del servicio

@Component({
    selector: 'app-admin',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        IconFieldModule,
        InputIconModule,
        MultiSelectModule,
        PanelModule,
        DialogModule,
        PasswordModule,
        ToastModule,
        MenuModule,
        Select,
        Textarea,
        Tooltip,
        ConfirmDialogModule,
        TiposCuenta,
        Title,
    ],
    templateUrl: './admin.html',
    styleUrl: './admin.scss',
    providers: [MessageService, ConfirmationService],
})
export class Admin implements OnInit {
    @ViewChild('dt') dt!: Table;
    credenciales=signal<CredencialDto[]>([]);
    searchValue='';
    tiposCuenta=signal<TipoCuenta[]>([]);
    // Filtros
    selectedUnidad: number[]=[];
    selectedDepartamento: number[]=[];
    selectedTipo: string[]=[];

    // Opciones para p-select
    unidades=signal<Unidad[]>([]);
    departamentos=signal<Departamento[]>([]);

    // Diálogo
    credencialDialog=false;
    tiposDialog=false;
    dialogHeader='';
    loading=false;
    credencialForm: FormGroup;
    editingCredencial: CredencialDto | null=null;

    // Menú contextual
    menuItems: MenuItem[]=[];
    selectedCredencial: CredencialDto | null=null;
    @ViewChild('menuRef') menu: any;
    unidadService=inject(UnidadService);
    departamentoService=inject(DepartamentoService);

    constructor(
        private fb: FormBuilder,
        private messageService: MessageService,
        private credencialService: CredencialService,
        private excelGeneratorService: ExcelGeneratorService,
        private router: Router,
        private confirmationService: ConfirmationService,
    ) {
        this.credencialForm=this.fb.group({
            usuario: ['', Validators.required],
            clave: [''],
            idTipoCuenta: [null, Validators.required],
            unidadId: [null, Validators.required],
            departamentoId: [null, Validators.required],
            nota: [''],
        });
    }

    ngOnInit() {
        this.cargarTiposCuenta();
        this.cargarUnidades();
        this.cargarDepartamentos();
        this.loadCredenciales();
        this.initializeMenu();
    }

    initializeMenu() {
        if(!this.selectedCredencial) return;

        this.menuItems=[
            {
                label: 'Editar',
                icon: 'pi pi-pencil',
                command: () => this.editarCredencial(),
            },
            {
                label: 'Copiar contraseña',
                icon: 'pi pi-copy',
                command: () => this.copiarClave(),
            },
            {
                separator: true,
            },
            {
                label: 'Eliminar',
                icon: 'pi pi-trash',
                styleClass: 'text-red-600',
                command: () => this.eliminarCredencial(),
            },
        ];
    }

    loadCredenciales() {
        this.credencialService.obtenerCredenciales().subscribe({
            next: (response) => {
                if(response.success) {
                    // Agregar propiedad mostrarClave a cada credencial
                    const credencialesConVisibilidad=response.data.map((cred) => ({
                        ...cred,
                        mostrarClave: false,
                    }));
                    this.credenciales.set(credencialesConVisibilidad);
                } else {
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al cargar credenciales',
                    });
                }
            },
            error: (error) => {
                console.error('Error loading credentials:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'Error al conectar con el servidor',
                });
            },
        });
    }

    onUnidadChange(value: number[]) {
        this.selectedUnidad=value;
        this.dt.filter(value, 'unidadId', 'in');
    }

    onDepartamentoChange(value: number[]) {
        this.selectedDepartamento=value;
        this.dt.filter(value, 'departamentoId', 'in');
    }

    onTipoChange(value: string[]) {
        this.selectedTipo=value;
        this.dt.filter(value, 'tipoNombre', 'in');
    }

    copiarClave() {
        if(this.selectedCredencial) {
            navigator.clipboard.writeText(this.selectedCredencial.clave).then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Copiado',
                    detail: 'Contraseña copiada al portapapeles',
                });
            });
        }
    }

    toggleVerClaveDirecto(credencial: CredencialDto) {
        // Actualizar el estado de mostrarClave para la credencial específica desde el botón directo
        const credencialesActualizadas=this.credenciales().map((cred) =>
            cred.id === credencial.id
                ? {
                    ...cred,
                    mostrarClave: !cred.mostrarClave,
                }
                : cred,
        );
        this.credenciales.set(credencialesActualizadas);
    }

    toggleMenu(event: Event,
               credencial: CredencialDto) {
        this.selectedCredencial=credencial;
        this.initializeMenu();
        this.menu.toggle(event);
    }

    eliminarCredencial() {
        if(this.selectedCredencial) {
            this.confirmationService.confirm({
                message: `¿Está seguro de eliminar la credencial del usuario "${this.selectedCredencial.usuario}"?`,
                header: 'Confirmar eliminación',
                icon: 'pi pi-exclamation-triangle',
                acceptLabel: 'Sí, eliminar',
                rejectLabel: 'Cancelar',
                accept: () => {
                    this.credencialService.eliminarCredencial(this.selectedCredencial!.id).subscribe({
                        next: (response) => {
                            if(response.success) {
                                this.messageService.add({
                                    severity: 'success',
                                    summary: 'Éxito',
                                    detail: 'Credencial eliminada correctamente',
                                });
                                this.loadCredenciales();
                            }
                        },
                        error: (error) => {
                            this.messageService.add({
                                severity: 'error',
                                summary: 'Error',
                                detail: 'Error al eliminar la credencial',
                            });
                        },
                    });
                },
            });
        }
    }

    nuevaCredencial() {
        this.editingCredencial=null;
        this.dialogHeader='Nueva Credencial';
        this.credencialForm.reset();
        this.credencialDialog=true;
    }

    editarCredencial() {
        if(this.selectedCredencial) {
            this.editingCredencial=this.selectedCredencial;
            this.dialogHeader='Editar Credencial';
            this.credencialForm.patchValue({
                usuario: this.selectedCredencial.usuario,
                clave: this.selectedCredencial.clave,
                idTipoCuenta: this.selectedCredencial.tipoId,
                unidadId: this.selectedCredencial.unidadId,
                departamentoId: this.selectedCredencial.departamentoId,
                nota: this.selectedCredencial.nota,
            });
            this.credencialDialog=true;
        }
    }

    guardarCredencial() {
        if(this.credencialForm.valid) {
            this.loading=true;
            const formValue=this.credencialForm.value;

            const credencialData={
                usuario: formValue.usuario,
                clave: formValue.clave || '',
                idTipoCuenta: formValue.idTipoCuenta,
                idUnidad: formValue.unidadId,
                idDepartamento: formValue.departamentoId,
                nota: formValue.nota || '',
            };

            const operation=this.editingCredencial ? this.credencialService.actualizarCredencial(this.editingCredencial.id, credencialData) : this.credencialService.crearCredencial(credencialData);

            operation.subscribe({
                next: (response) => {
                    this.loading=false;
                    if(response.success) {
                        this.credencialDialog=false;
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Éxito',
                            detail: this.editingCredencial ? 'Credencial actualizada' : 'Credencial creada',
                        });
                        this.loadCredenciales();
                    } else {
                        this.messageService.add({
                            severity: 'error',
                            summary: 'Error',
                            detail: response.message || 'Error al guardar la credencial',
                        });
                    }
                },
                error: (error) => {
                    this.loading=false;
                    console.error('Error saving credential:', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'Error al conectar con el servidor',
                    });
                },
            });
        } else {
            this.markFormGroupTouched();
            this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'Por favor complete todos los campos requeridos',
            });
        }
    }

    exportarExcel() {
        const datosAExportar=this.dt.filteredValue || this.credenciales();
        this.excelGeneratorService
            .generarExcelCredenciales(datosAExportar)
            .then(() => {
                this.messageService.add({
                    severity: 'success',
                    summary: 'Exportación exitosa',
                    detail: `Se exportaron ${datosAExportar.length} credenciales a Excel`,
                });
            })
            .catch((error) => {
                console.error('Error exportando a Excel:', error);
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error en exportación',
                    detail: 'Ocurrió un error al exportar los datos a Excel',
                });
            });
    }

    gestionarTipos() {
        this.tiposDialog=true;
    }

    onTiposDialogClose() {
        this.cargarTiposCuenta();
    }

    private cargarTiposCuenta() {
        this.credencialService.obtenerTipoCuentas().subscribe({
            next: (response) => {
                this.tiposCuenta.set(response.data);
            },
        });
    }

    private cargarUnidades() {
        this.unidadService.filtrar({}).subscribe({
            next: (response) => {
                const unidadesActivas=response.data.filter((unidad) => unidad.activo === true);
                this.unidades.set(unidadesActivas);
            },
        });
    }

    private cargarDepartamentos() {
        this.departamentoService.obtenerDepartamentos().subscribe({
            next: (response) => {
                this.departamentos.set(response.data);
            },
        });
    }

    private markFormGroupTouched() {
        Object.keys(this.credencialForm.controls).forEach((key) => {
            const control=this.credencialForm.get(key);
            control?.markAsTouched();
        });
    }
}
