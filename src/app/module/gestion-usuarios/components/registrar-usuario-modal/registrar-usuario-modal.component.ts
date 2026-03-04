import {ChangeDetectionStrategy, Component, EventEmitter, inject, Input, OnInit, Output, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormBuilder, FormGroup, ReactiveFormsModule, Validators} from '@angular/forms';

// PrimeNG
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {PasswordModule} from 'primeng/password';
import {MultiSelect} from 'primeng/multiselect';
import {MessageService} from 'primeng/api';

// Services/Models
import {Rol, RolService} from '@/module/rol-admin/service/rol.service';
import {UsuarioService} from '@/core/services/usuario/usuario.service';
import {CreateUserRequest} from '@/models/usuario/create-user-request';
import {JWTService} from "@/core/security/JWTService";
import {CatalogoEmpleado, CatalogoEmpleadoService} from "@/service/catalogo-empleado.service";
import {Select} from "primeng/select";

@Component({
    selector: 'app-registrar-usuario-modal',
    standalone: true,
    imports: [
        CommonModule, ReactiveFormsModule, DialogModule, ButtonModule, InputTextModule, PasswordModule, MultiSelect,
        Select,
    ],
    templateUrl: './registrar-usuario-modal.component.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class RegistrarUsuarioModalComponent implements OnInit {
    @Input() visible: boolean=false;
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
    private empleadoService=inject(CatalogoEmpleadoService);
    private jwtService=inject(JWTService);

    constructor() {
        this.usuarioForm=this.fb.group({
            username: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(50)]],
            password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(100)]],
            rol: [[], [Validators.required]],
            idEmpleado: [''],
        });
    }

    ngOnInit() {
        this.cargarRoles();
        this.cargarColaboradores();
    }

    cargarRoles() {
        this.loadingRoles.set(true);
        this.rolService.obtenerRoles().subscribe({
            next: (response) => {
                this.roles.set(response.data);
                this.loadingRoles.set(false);
            },
            error: (error) => {
                console.error('Error al cargar roles:', error);
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudieron cargar los roles',
                });
                this.loadingRoles.set(false);
            },
        });
    }

    cargarColaboradores() {
        this.empleadoService.obtenerEmpleados({activos: true}).subscribe({
            next: (response) => {
                this.empleados.set(response.data);
            },
            error: (error) => {
                console.error('Error al cargar colaboradores:', error);
                this.messageService.add({
                    severity: 'error', summary: 'Error', detail: 'No se pudieron cargar colaboradores',
                });
            },
        });
    }

    onSubmit() {
        if(this.usuarioForm.valid) {
            this.loading.set(true);
            const formData=this.usuarioForm.value;

            // CREATE
            const createUserRequest: CreateUserRequest={
                username: formData.username,
                password: formData.password,
                email: '', // TODO: Agregar campo email si el negocio lo requiere en este form, por ahora vacío
                enabled: true,
                roles: formData.rol,
                permissions: [],
            };

            // Asignar empleadoId si existe
            if(formData.idEmpleado) {
                (createUserRequest as any).idEmpleado=formData.idEmpleado;
            }

            this.usuarioService.crearUsuario(createUserRequest).subscribe({
                next: () => {
                    this.messageService.add({severity: 'success', summary: 'Éxito', detail: 'Usuario Creado'});
                    this.loading.set(false);
                    this.onCancel();
                    this.usuarioGuardado.emit();
                },
                error: (error) => {
                    console.error('Error al crear usuario', error);
                    this.messageService.add({
                        severity: 'error',
                        summary: 'Error',
                        detail: 'No se pudo crear el usuario',
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
