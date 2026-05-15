import {
    ChangeDetectionStrategy,
    Component,
    EventEmitter,
    inject,
    Input,
    OnChanges,
    OnInit,
    Output,
    signal,
    SimpleChanges,
} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

// PrimeNG
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {MultiSelect} from 'primeng/multiselect';
import {MessageService} from 'primeng/api';

// Services/Models
import {Rol, RolService} from '@/module/rol-admin/service/rol.service';
import {UsuarioService} from '@/core/services/usuario/usuario.service';
import {CatalogoEmpleado, CatalogoEmpleadoService} from "@/service/catalogo-empleado.service";
import {SpinnerService} from "@/shared/service/spinner.service";
import {Password} from "primeng/password";
import {Select} from "primeng/select";

@Component({
    selector: 'app-editar-usuario-modal',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, MultiSelect, Password,
        Select,
    ],
    templateUrl: './editar-usuario-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditarUsuarioModalComponent implements OnInit,
                                                    OnChanges {
    @Input() visible: boolean=false;
    @Input() usuarioEditar: any=null;
    @Output() visibleChange=new EventEmitter<boolean>();
    @Output() usuarioGuardado=new EventEmitter<void>();

    usuarioForm: FormGroup;

    // Signals
    roles=signal<Rol[]>([]);
    empleados=signal<CatalogoEmpleado[]>([]);
    loading=signal<boolean>(false);
    loadingRoles=signal<boolean>(false);

    private fb=inject(FormBuilder);
    private rolService=inject(RolService);
    private usuarioService=inject(UsuarioService);
    private messageService=inject(MessageService);
    private catalogoEmpleadoService=inject(CatalogoEmpleadoService);
    private spinnerService=inject(SpinnerService)

    constructor() {
        this.usuarioForm=this.fb.group({
            password: [''],
            username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            roles: [[], [Validators.required]],
            idEmpleado: [''],
        });
    }

    ngOnInit() {
        this.spinnerService.show()
        this.cargarRoles();
        this.cargarColaboradores();
    }

    ngOnChanges(changes: SimpleChanges) {
        if(changes['usuarioEditar'] || changes['visible']) {
            if(this.visible && this.usuarioEditar) {
                this.configurarFormulario();
            }
        }
    }

    cargarRoles() {
        this.loadingRoles.set(true);
        this.rolService.obtenerRoles().subscribe({
            next: (response) => {
                this.roles.set(response.data);
                this.loadingRoles.set(false);
                // Configure form after roles are loaded
                this.configurarFormulario();
            }, error: (error) => {
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles',
                });
                this.loadingRoles.set(false);
            },
        });
    }

    cargarColaboradores() {
        this.catalogoEmpleadoService.obtenerEmpleados({activos: true}).subscribe({
            next: (response) => {
                this.empleados.set(response.data);
                this.spinnerService.hide()
            }, error: (error) => {
                this.spinnerService.hide()
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudieron cargar colaboradores',
                });
            },
        });
    }

    configurarFormulario() {
        if(this.usuarioEditar && this.roles().length>0) {
            // Extract role IDs from user roles array
            let roleIds: number[]=[];
            if(this.usuarioEditar.roles && Array.isArray(this.usuarioEditar.roles)) {
                roleIds=this.usuarioEditar.roles.map((rol: any) => {
                    const foundRole=this.roles().find(r => r.nombre === rol.nombre);
                    return foundRole ? foundRole.id : null;
                }).filter(id => id !== null);
            } else if(typeof this.usuarioEditar.roles === 'string') {
                const roleNames=this.usuarioEditar.roles.split(',').map(name => name.trim());
                roleIds=roleNames.map(nombre => {
                    const foundRole=this.roles().find(r => r.nombre === nombre);
                    return foundRole ? foundRole.id : null;
                }).filter(id => id !== null);
            }

            this.usuarioForm.patchValue({
                username: this.usuarioEditar.username || this.usuarioEditar.nombre,
                roles: roleIds,
                idEmpleado: this.usuarioEditar.empleadoId,
            });
        }
    }

    onSubmit() {
        if(this.usuarioForm.valid) {
            this.loading.set(true);
            const formData=this.usuarioForm.value;

            const updateRequest={
                id: this.usuarioEditar.id,
                username: formData.username,
                password: formData.password || null,
                empleadoId: formData.idEmpleado,
                idRoles: formData.roles,
            };

            this.usuarioService.actualizarUsuario(updateRequest).subscribe({
                next: () => {
                    this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Usuario Actualizado'});
                    this.loading.set(false);
                    this.onCancel();
                    this.usuarioGuardado.emit();
                }, error: (error) => {
                    this.messageService.add({
                        severity: 'error', summary: 'Error', detail: 'No se pudo actualizar el usuario',
                    });
                    this.loading.set(false);
                },
            });
        } else {
            this.usuarioForm.markAllAsTouched();
        }
    }

    onCancel() {
        this.visibleChange.emit(false);
        this.usuarioForm.reset();
    }
}
