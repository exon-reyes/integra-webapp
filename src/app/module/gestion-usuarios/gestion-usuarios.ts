import {Component, computed, inject, OnInit, signal, viewChild} from '@angular/core';
import {CommonModule} from '@angular/common';
import {FormsModule} from '@angular/forms';
import {Table, TableModule} from 'primeng/table';
import {ButtonModule} from 'primeng/button';
import {InputTextModule} from 'primeng/inputtext';
import {DialogModule} from 'primeng/dialog';
import {DrawerModule} from 'primeng/drawer';
import {IconField} from 'primeng/iconfield';
import {InputIcon} from 'primeng/inputicon';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Checkbox} from 'primeng/checkbox';
import {Select} from 'primeng/select';
import {CatalogoEmpleado, CatalogoEmpleadoService} from '@/service/catalogo-empleado.service';

import {Usuario, UsuarioConRoles, UsuarioService} from '@/core/services/usuario/usuario.service';
import {PaginatedResponse} from '@/core/services/usuario/paginated-response.interface';
import {SecurityNodeDto, SecurityNodeService} from '@/core/services/security-node.service';
import {ParamsDTO, SystemValueService} from '@/core/services/system-value-service';
import {HasPermissionDirective} from '@/core/security/HasPermissionDirective';
import {Autoridades} from '@/core/Autoridades';
import {Modulo, Permiso, Submodulo, Universo} from '@/module/modulos';
import {Title} from '@/components/title';
import {SpinnerComponent} from '@/components/spinner.component';
import {
    RegistrarUsuarioModalComponent,
} from '@/module/gestion-usuarios/components/registrar-usuario-modal/registrar-usuario-modal.component';
import {
    EditarUsuarioModalComponent,
} from '@/module/gestion-usuarios/components/editar-usuario-modal/editar-usuario-modal.component';

@Component({
    selector: 'app-gestion-usuarios', standalone: true, imports: [
        CommonModule,
        FormsModule,
        TableModule,
        ButtonModule,
        InputTextModule,
        DialogModule,
        DrawerModule,
        IconField,
        InputIcon,
        ConfirmDialogModule,
        Title,
        SpinnerComponent,
        RegistrarUsuarioModalComponent,
        EditarUsuarioModalComponent,
        HasPermissionDirective,
        Checkbox,
        Select,
    ], templateUrl: './gestion-usuarios.html', styleUrls: ['./gestion-usuarios.scss'],
})
class GestionUsuarios implements OnInit {
    readonly table=viewChild.required<Table>('dt');
    readonly Autoridades=Autoridades;
    // State
    usuarios=signal<UsuarioConRoles[]>([]);
    filtroTexto=signal('');

    usuariosFiltrados=computed(() => {
        const texto=this.filtroTexto().toLowerCase().trim();
        const usuarios=this.usuarios();

        if(!texto) return usuarios;

        return usuarios.filter(usuario =>
            usuario.username?.toLowerCase().includes(texto) ||
            usuario.nombreCompleto?.toLowerCase().includes(texto) ||
            usuario.email?.toLowerCase().includes(texto),
        );
    });
    loading=signal(true);
    // Pagination
    currentPage=signal(0);
    pageSize=signal(10);
    totalRecords=signal(0);
    mostrarModalRegistro=false;
    mostrarModalEdicion=false;
    usuarioParaEditar: Usuario | null=null;
    // Permisos especiales
    universos=signal<Universo[]>([]);
    securityNodes=signal<SecurityNodeDto[]>([]);
    selectedModulo=signal<Modulo | null>(null);
    loadingPermisos=signal(false);
    mostrarModalPermisos=false;
    modoEdicion=signal(false);
    usuarioSeleccionadoPermisos: UsuarioConRoles | null=null;
    permisosFromRoles=signal<Set<string>>(new Set());
    permisosEspeciales=signal<Set<string>>(new Set());
    SystemVar!: ParamsDTO;
    // Filtro por colaborador
    mostrarDialogoFiltro=false;
    colaboradoresActivos=signal<CatalogoEmpleado[]>([]);
    loadingColaboradores=signal(false);
    colaboradorSeleccionado=signal<CatalogoEmpleado | null>(null);
    filtroColaboradorActivo=signal<CatalogoEmpleado | null>(null);
    private readonly usuarioService=inject(UsuarioService);
    private readonly confirmService=inject(ConfirmationService);
    private readonly messageService=inject(MessageService);
    private readonly systemValueService=inject(SystemValueService);
    private readonly securityNodeService=inject(SecurityNodeService);
    private readonly catalogoEmpleadoService=inject(CatalogoEmpleadoService);

    ngOnInit() {
        this.cargarVariablesSistema();
        this.cargarEstructuraPermisos();
    }

    isAdmin=(user: Usuario) => this.SystemVar && user.id === this.SystemVar.idUsuarioAdmin;

    abrirModalEdicion(usuario: Usuario) {
        this.usuarioParaEditar=usuario;
        this.mostrarModalEdicion=true;
    }

    onUsuarioGuardado() {
        this.cargarUsuarios();
        this.mostrarModalRegistro=false;
        this.mostrarModalEdicion=false;
        this.usuarioParaEditar=null;
    }

    toggleUserStatus(usuario: UsuarioConRoles,
                     event: Event) {
        event.stopPropagation();
        const newStatus=!usuario.activo;

        this.usuarioService.actualizarEstatus(usuario.id!, newStatus).subscribe({
            next: () => {
                this.usuarios.update(users => users.map(u => u.id === usuario.id ? {
                    ...u, activo: newStatus,
                } : u));
                this.messageService.add({
                    severity: 'success',
                    summary: 'Estado Actualizado',
                    detail: `Usuario ${newStatus ? 'activado' : 'desactivado'} correctamente`,
                    life: 3000,
                });
            }, error: () => this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudo actualizar el estado del usuario',
                life: 3000,
            }),
        });
    }

    confirmarEliminacion(usuario: UsuarioConRoles) {
        this.confirmService.confirm({
            target: event.target as EventTarget,
            message: `¿Está seguro de eliminar al usuario ${usuario.username}?`,
            header: 'Confirmar Eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, Eliminar',
            rejectLabel: 'Cancelar',
            rejectButtonStyleClass: 'p-button-text',
            accept: () => {
                this.usuarioService.eliminarUsuario(usuario.id!).subscribe({
                    next: () => {
                        this.messageService.add({
                            severity: 'success',
                            summary: 'Usuario Eliminado',
                            detail: 'El usuario ha sido eliminado correctamente',
                            life: 3000,
                        });
                        this.cargarUsuarios();
                    },
                });
            },
        });
    }

    // ===== Permissions Management =====

    abrirModalPermisos(usuario: UsuarioConRoles) {
        this.usuarioSeleccionadoPermisos=usuario;
        this.mostrarModalPermisos=true;
        this.modoEdicion.set(false);
        this.cargarPermisosUsuario(usuario.id);
    }

    selectModulo(modulo: Modulo) {
        this.selectedModulo.set(modulo);
    }

    getUniverso(modulo: Modulo): Universo {
        return this.universos().find(u => u.modulos.some(m => m.id === modulo.id))!;
    }

    esPermisoHeredado(permisoId: string): boolean {
        return this.permisosFromRoles().has(permisoId);
    }

    togglePermisoEspecial(permiso: Permiso,
                          submodulo: Submodulo,
                          modulo: Modulo,
                          universo: Universo) {
        if(!this.modoEdicion() || permiso.desdeRol) return;

        const nuevoEstado=!permiso.asignado;
        this.updateUniversos(universo.id, (u) => {
            const modulosActualizados=u.modulos.map(m =>
                m.id === modulo.id ? this.actualizarEstadoCascada(m, submodulo.id, permiso.id, nuevoEstado) : m,
            );
            return {...u, modulos: modulosActualizados};
        });

        // Update special permissions set
        this.permisosEspeciales.update(permisos => {
            const newSet=new Set(permisos);
            if(nuevoEstado) {
                newSet.add(permiso.id);
            } else {
                newSet.delete(permiso.id);
            }
            return newSet;
        });
    }

    toggleTodosPermisos(submodulo: Submodulo,
                        modulo: Modulo,
                        universo: Universo) {
        if(!this.modoEdicion()) return;

        const nuevoEstado=!this.todosPermisosSeleccionados(submodulo);
        this.updateUniversos(universo.id, (u) => {
            const modulosActualizados=u.modulos.map(m => {
                if(m.id === modulo.id) {
                    const submodulosActualizados=m.submodulos.map((sm) => {
                        if(sm.id === submodulo.id) {
                            return {
                                ...sm,
                                asignado: nuevoEstado,
                                permisos: sm.permisos.map((p) => ({
                                    ...p,
                                    asignado: p.desdeRol ? p.asignado : nuevoEstado,
                                })),
                            };
                        }
                        return sm;
                    });
                    const moduloAsignado=submodulosActualizados.some((sm) => sm.asignado);
                    return {...m, asignado: moduloAsignado, submodulos: submodulosActualizados};
                }
                return m;
            });
            return {...u, modulos: modulosActualizados};
        });

        // Update special permissions
        submodulo.permisos.forEach(p => {
            if(!p.desdeRol) {
                this.permisosEspeciales.update(permisos => {
                    const newSet=new Set(permisos);
                    if(nuevoEstado) {
                        newSet.add(p.id);
                    } else {
                        newSet.delete(p.id);
                    }
                    return newSet;
                });
            }
        });
    }

    toggleTodosPermisosModulo(modulo: Modulo,
                              universo: Universo) {
        if(!this.modoEdicion()) return;

        const nuevoEstado=!this.todosPermisosModuloSeleccionados(modulo);
        this.updateUniversos(universo.id, (u) => {
            const modulosActualizados=u.modulos.map(m => {
                if(m.id === modulo.id) {
                    return {
                        ...m,
                        asignado: nuevoEstado,
                        submodulos: m.submodulos.map((sm) => ({
                            ...sm,
                            asignado: nuevoEstado,
                            permisos: sm.permisos.map((p) => ({
                                ...p,
                                asignado: p.desdeRol ? p.asignado : nuevoEstado,
                            })),
                        })),
                    };
                }
                return m;
            });
            return {...u, modulos: modulosActualizados};
        });

        // Update special permissions
        modulo.submodulos.forEach(sm => {
            sm.permisos.forEach(p => {
                if(!p.desdeRol) {
                    this.permisosEspeciales.update(permisos => {
                        const newSet=new Set(permisos);
                        if(nuevoEstado) {
                            newSet.add(p.id);
                        } else {
                            newSet.delete(p.id);
                        }
                        return newSet;
                    });
                }
            });
        });
    }

    todosPermisosSeleccionados(submodulo: Submodulo): boolean {
        return submodulo.permisos.length>0 && submodulo.permisos.every((p) => p.asignado);
    }

    todosPermisosModuloSeleccionados(modulo: Modulo): boolean {
        return modulo.submodulos.every((sm) => this.todosPermisosSeleccionados(sm));
    }

    contarPermisosActivos(): number {
        return this.universos().reduce((acc,
                                        u) =>
                acc + u.modulos.reduce((accM,
                                        m) =>
                        accM + m.submodulos.reduce((accS,
                                                    s) =>
                            accS + s.permisos.filter(p => p.asignado).length, 0,
                        ), 0,
                ), 0,
        );
    }

    guardarPermisosEspeciales() {
        if(!this.usuarioSeleccionadoPermisos) return;
        this.usuarioService.actualizarPermisosEspeciales({
            id: this.usuarioSeleccionadoPermisos.id,
            permisos: Array.from(this.permisosEspeciales()),
        }).subscribe({
            next: () => {
                this.modoEdicion.set(false);
                this.messageService.add({
                    severity: 'success',
                    summary: 'Permisos Guardados',
                    detail: `Los permisos especiales de ${this.usuarioSeleccionadoPermisos?.username} se han actualizado correctamente`,
                    life: 3000,
                });
            },
            error: () => this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron guardar los permisos especiales',
                life: 3000,
            }),
        });
    }

    cancelarEdicionPermisos() {
        if(!this.usuarioSeleccionadoPermisos) return;
        this.modoEdicion.set(false);
        this.cargarPermisosUsuario(this.usuarioSeleccionadoPermisos.id);
        this.messageService.add({
            severity: 'info',
            summary: 'Cancelado',
            detail: 'Cambios revertidos',
            life: 3000,
        });
    }

    // ===== Private Methods =====

    onPageChange(event: any) {
        // PrimeNG's onLazyLoad event provides 'first' (index of first record) and 'rows' (page size)
        // We need to calculate the page number: page = first / rows
        const page=event.first / event.rows;
        this.currentPage.set(page);
        this.pageSize.set(event.rows);
        this.filtroTexto.set(''); // Clear filter when changing pages
        this.cargarUsuarios();
    }

    cargarUsuarios() {
        this.loading.set(true);
        const empleadoId=this.filtroColaboradorActivo()?.id ?? null;
        this.usuarioService.obtenerUsuarios(this.currentPage(), this.pageSize(), empleadoId).subscribe({
            next: (response: PaginatedResponse<UsuarioConRoles>) => {
                this.usuarios.set(response.data);
                this.totalRecords.set(response.totalElements);
                this.loading.set(false);
            }, error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los usuarios',
                    life: 3000,
                })
                this.loading.set(false);
            },
        });
    }

    filtrarUsuarios(texto: string) {
        this.filtroTexto.set(texto);
    }

    abrirDialogoFiltro() {
        this.colaboradorSeleccionado.set(this.filtroColaboradorActivo());
        this.mostrarDialogoFiltro=true;
        if(this.colaboradoresActivos().length === 0) {
            this.cargarColaboradoresActivos();
        }
    }

    aplicarFiltroColaborador() {
        this.filtroColaboradorActivo.set(this.colaboradorSeleccionado());
        this.mostrarDialogoFiltro=false;
        this.cargarUsuarios();
    }

    limpiarFiltroColaborador() {
        this.colaboradorSeleccionado.set(null);
        this.filtroColaboradorActivo.set(null);
        this.mostrarDialogoFiltro=false;
        this.cargarUsuarios();
    }

    private cargarColaboradoresActivos() {
        this.loadingColaboradores.set(true);
        this.catalogoEmpleadoService.obtenerEmpleados({activos: true}).subscribe({
            next: (response) => {
                this.colaboradoresActivos.set(response.data ?? []);
                this.loadingColaboradores.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'error',
                    summary: 'Error',
                    detail: 'No se pudieron cargar los colaboradores',
                    life: 3000,
                });
                this.loadingColaboradores.set(false);
            },
        });
    }

    private cargarVariablesSistema() {
        this.systemValueService.obtenerVariablesSistema().subscribe({
            next: response => this.SystemVar=response.data,
            error: () => this.messageService.add({
                severity: 'error',
                summary: 'Error',
                detail: 'No se pudieron cargar las variables del sistema',
                life: 3000,
            }),
        });
    }

    private cargarEstructuraPermisos() {
        this.securityNodeService.obtenerEstructuraPermisos().subscribe({
            next: (nodes) => {
                this.securityNodes.set(nodes.data);
            },
            error: () => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Error',
                    detail: 'No se pudo cargar la estructura de permisos',
                    life: 4000,
                });
                this.securityNodes.set([]);
            },
        });
    }

    private cargarPermisosUsuario(userId: number) {
        this.loadingPermisos.set(true);
        this.usuarioService.obtenerPrivilegios(userId).subscribe({
            next: (response) => {
                const fromRoles=new Set(response.data.fromRoles);
                const special=new Set(response.data.special);

                this.permisosFromRoles.set(fromRoles);
                this.permisosEspeciales.set(special);

                const universosConEstado=this.mapearPermisosAUniversos(fromRoles, special);
                this.universos.set(universosConEstado);

                if(universosConEstado.length>0 && universosConEstado[0].modulos.length>0) {
                    this.selectedModulo.set(universosConEstado[0].modulos[0]);
                }

                this.loadingPermisos.set(false);
            },
            error: () => {
                this.messageService.add({
                    severity: 'warn',
                    summary: 'Error',
                    detail: 'No se pudo cargar permisos del usuario',
                    life: 4000,
                });
                this.universos.set([]);
                this.loadingPermisos.set(false);
            },
        });
    }

    private mapearPermisosAUniversos(fromRoles: Set<string>,
                                     special: Set<string>): Universo[] {
        const securityNodes=this.securityNodes();
        if(securityNodes.length === 0) {
            return [];
        }

        return securityNodes.map(universo => ({
            id: universo.id,
            nombre: universo.name,
            modulos: universo.children?.map(modulo => ({
                id: modulo.id,
                nombre: modulo.name,
                permisoAcceso: modulo.id,
                asignado: modulo.children?.some(permiso =>
                    fromRoles.has(permiso.id) || special.has(permiso.id),
                ) || false,
                submodulos: [
                    {
                        id: modulo.id + '_permisos',
                        nombre: 'Permisos',
                        asignado: modulo.children?.some(permiso =>
                            fromRoles.has(permiso.id) || special.has(permiso.id),
                        ) || false,
                        permisos: modulo.children?.map(permiso => ({
                            id: permiso.id,
                            nombre: permiso.name,
                            asignado: fromRoles.has(permiso.id) || special.has(permiso.id),
                            desdeRol: fromRoles.has(permiso.id),
                        })) || [],
                    },
                ],
            })) || [],
        }));
    }

    private actualizarEstadoCascada(modulo: Modulo,
                                    submoduloId: string,
                                    permisoId: string,
                                    nuevoEstado: boolean): Modulo {
        const submodulosActualizados=modulo.submodulos.map((sm) => {
            if(sm.id === submoduloId) {
                const permisosActualizados=sm.permisos.map((p) =>
                    (p.id === permisoId && !p.desdeRol) ? {...p, asignado: nuevoEstado} : p,
                );
                const tienePermisosActivos=permisosActualizados.some((p) => p.asignado);
                return {...sm, asignado: tienePermisosActivos, permisos: permisosActualizados};
            }
            return sm;
        });
        const moduloAsignado=submodulosActualizados.some((sm) => sm.asignado);
        return {...modulo, asignado: moduloAsignado, submodulos: submodulosActualizados};
    }

    private updateUniversos(universoId: string,
                            updateFn: (universo: Universo) => Universo) {
        this.universos.update((universos) => {
            const newUniversos=universos.map((u) => (u.id === universoId ? updateFn(u) : u));
            const currentSelected=this.selectedModulo();
            if(currentSelected) {
                const updatedUniverso=newUniversos.find(u => u.id === universoId);
                if(updatedUniverso) {
                    const updatedModule=updatedUniverso.modulos.find(m => m.id === currentSelected.id);
                    if(updatedModule) {
                        this.selectedModulo.set(updatedModule);
                    }
                }
            }
            return newUniversos;
        });
    }
}

export default GestionUsuarios
