import {ChangeDetectionStrategy, Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {TableModule} from 'primeng/table';
import {ToastModule} from 'primeng/toast';
import {ConfirmDialogModule} from 'primeng/confirmdialog';
import {ConfirmationService, MessageService} from 'primeng/api';
import {Title} from '@/components/title';
import {Rol, RolService} from '@/module/rol-admin/service/rol.service';
import {FormsModule} from '@angular/forms';
import {Button} from 'primeng/button';
import {Dialog} from 'primeng/dialog';
import {NuevoRol} from '@/module/rol-admin/nuevo-rol/nuevo-rol';
import {Modulo, Permiso, Submodulo, Universo} from '@/module/modulos';
import {SecurityNodeDto, SecurityNodeService} from '@/core/services/security-node.service';
import {SpinnerComponent} from '@/components/spinner.component';
import {Checkbox} from 'primeng/checkbox';
import {Autoridades} from "@/core/Autoridades";
import {HasPermissionDirective} from "@/core/security/HasPermissionDirective";

@Component({
    selector: 'app-rol-admin',
    standalone: true,
    imports: [
        CommonModule,
        Title,
        ToastModule,
        ConfirmDialogModule,
        TableModule,
        FormsModule,
        Button,
        Dialog,
        NuevoRol,
        SpinnerComponent,
        Checkbox,
        HasPermissionDirective,
    ],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './rol-admin.html',
    styleUrls: ['./rol-admin.scss'],
})
export class RolAdmin implements OnInit {
    roles=signal<Rol[]>([]);
    loadingRoles=signal(true);
    loadingPermisos=signal(false);
    selectedRol=signal<Rol | null>(null);
    universos=signal<Universo[]>([]);
    securityNodes=signal<SecurityNodeDto[]>([]);

    selectedUniverso=signal<Universo | null>(null);
    selectedModulo=signal<Modulo | null>(null);

    modoEdicion=signal(false);
    modoEdicionNombre=signal(false);
    mostrarDialogoNuevoRol=false;
    mostrarModalPermisos=false;
    protected readonly Autoridades=Autoridades;
    private nombreOriginal='';
    private descripcionOriginal='';
    private readonly rolService=inject(RolService);
    private readonly securityNodeService=inject(SecurityNodeService);
    private readonly messageService=inject(MessageService);
    private readonly confirmationService=inject(ConfirmationService);
    // Cache para evitar recálculos
    private permisosCache=new Map<string, boolean>();

    ngOnInit() {
        this.cargarRoles();
        this.cargarEstructuraPermisos();
    }

    selectRol(rol: Rol) {
        this.mostrarModalPermisos=true;
        this.selectedRol.set(rol);
        this.modoEdicion.set(false);
        this.cargarPermisosPorRol(rol.id);
    }

    selectUniverso(universo: Universo) {
        this.selectedUniverso.set(universo);
        if(universo.modulos.length>0) {
            this.selectedModulo.set(universo.modulos[0]);
        } else {
            this.selectedModulo.set(null);
        }
    }

    selectModulo(modulo: Modulo) {
        this.selectedModulo.set(modulo);
    }

    togglePermiso(permiso: Permiso,
                  submodulo: Submodulo,
                  modulo: Modulo,
                  universo: Universo) {
        if(!this.modoEdicion()) return;
        const nuevoEstado=!permiso.asignado;
        this.updateUniversos(universo.id, (u) => {
            const modulosActualizados=u.modulos.map(m => m.id === modulo.id ? this.actualizarEstadoCascada(m, submodulo.id, permiso.id, nuevoEstado) : m);
            return {...u, modulos: modulosActualizados};
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
                                ...sm, asignado: nuevoEstado,
                                permisos: sm.permisos.map((p) => ({...p, asignado: nuevoEstado})),
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
    }

    toggleTodosPermisosModulo(modulo: Modulo,
                              universo: Universo) {
        if(!this.modoEdicion()) return;
        const nuevoEstado=!this.todosPermisosModuloSeleccionados(modulo);
        this.updateUniversos(universo.id, (u) => {
            const modulosActualizados=u.modulos.map(m => {
                if(m.id === modulo.id) {
                    return {
                        ...m, asignado: nuevoEstado, submodulos: m.submodulos.map((sm) => ({
                            ...sm,
                            asignado: nuevoEstado,
                            permisos: sm.permisos.map((p) => ({...p, asignado: nuevoEstado})),
                        })),
                    };
                }
                return m;
            });
            return {...u, modulos: modulosActualizados};
        });
    }

    guardarPermisos() {
        const rol=this.selectedRol();
        if(!rol) return;
        const permisosAsignados=this.obtenerPermisosAsignados();
        this.rolService.actualizarPermisosRol(rol.id, permisosAsignados).subscribe({
            next: () => {
                this.modoEdicion.set(false);
                this.showSuccess('Permisos Guardados', `Los permisos del rol "${rol.nombre}" se han actualizado correctamente`);
            },
        });
    }

    todosPermisosSeleccionados(submodulo: Submodulo): boolean {
        const cacheKey=`todos_${submodulo.id}`;
        if(this.permisosCache.has(cacheKey)) {
            return this.permisosCache.get(cacheKey)!;
        }
        const result=submodulo.permisos.length>0 && submodulo.permisos.every((p) => p.asignado);
        this.permisosCache.set(cacheKey, result);
        return result;
    }

    todosPermisosModuloSeleccionados(modulo: Modulo): boolean {
        return modulo.submodulos.every((sm) => this.todosPermisosSeleccionados(sm));
    }

    getUniverso(modulo: Modulo): Universo {
        return this.universos().find(u => u.modulos.some(m => m.id === modulo.id))!;
    }

    contarPermisosActivos(): number {
        return this.universos().reduce((acc,
                                        u) => acc + u.modulos.reduce((accM,
                                                                      m) => accM + this.contarPermisosEnModulo(m), 0), 0);
    }

    cargarRoles() {
        this.loadingRoles.set(true);
        this.rolService.obtenerRoles().subscribe({
            next: (res) => {
                this.roles.set(res.data);
                this.loadingRoles.set(false);
            }, error: () => this.loadingRoles.set(false),
        });
    }

    eliminarRol(rol: Rol) {
        if(rol.rolDefault) {
            this.showWarning('Acción No Permitida', 'No se puede eliminar un rol protegido');
            return;
        }
        this.confirmationService.confirm({
            message: '¿Eliminar rol y revocar permisos permanentemente?',
            header: 'Confirmar eliminación',
            icon: 'pi pi-exclamation-triangle',
            acceptLabel: 'Sí, eliminar',
            acceptButtonStyleClass: 'p-button-danger',
            accept: () => this.confirmarEliminacionRol(rol),
        });
    }

    editarNombreDescripcion() {
        const rol=this.selectedRol();
        if(!rol) return;
        this.nombreOriginal=rol.nombre;
        this.descripcionOriginal=rol.descripcion || '';
        this.modoEdicionNombre.set(true);
    }

    guardarNombreDescripcion() {
        const rol=this.selectedRol();
        if(!rol) return;
        this.rolService.actualizarNombreRol(rol.id, {nombre: rol.nombre, descripcion: rol.descripcion}).subscribe({
            next: () => {
                this.showSuccess('Guardado', 'Información actualizada');
                this.modoEdicionNombre.set(false);
            },
        });
    }

    cancelarEdicionNombre() {
        const rol=this.selectedRol();
        if(!rol) return;
        rol.nombre=this.nombreOriginal;
        rol.descripcion=this.descripcionOriginal;
        this.modoEdicionNombre.set(false);
    }

    cancelarEdicionPermisos() {
        const rol=this.selectedRol();
        if(!rol) return;
        this.modoEdicion.set(false);
        this.cargarPermisosPorRol(rol.id);
        this.showInfo('Cancelado', 'Cambios revertidos');
    }

    cancelarCreacionRol() {
        this.mostrarDialogoNuevoRol=false;
    }

    manejarRolAgregado(nuevoRol: Rol) {
        this.mostrarDialogoNuevoRol=false;
        this.roles.update((prev) => [...prev, nuevoRol]);
    }

    private clearPermisosCache() {
        this.permisosCache.clear();
    }

    private cargarPermisosPorRol(id: number) {
        this.loadingPermisos.set(true);
        this.rolService.obtenerPermisosPorRol(id).subscribe({
            next: (response) => {
                const permisosAsignados=new Set(response.data.permisos.map((p: any) => p.id));
                const universosConEstado=this.mapearPermisosAUniversos(permisosAsignados);
                this.universos.set(universosConEstado);
                if(universosConEstado.length>0) {
                    this.selectUniverso(universosConEstado[0]);
                }
                this.loadingPermisos.set(false);
            }, error: () => {
                this.showWarning('Error', 'No se pudo cargar permisos del rol');
                this.universos.set([]);
                this.loadingPermisos.set(false);
            },
        });
    }

    private actualizarEstadoCascada(modulo: Modulo,
                                    submoduloId: string,
                                    permisoId: string,
                                    nuevoEstado: boolean): Modulo {
        const submodulosActualizados=modulo.submodulos.map((sm) => {
            if(sm.id === submoduloId) {
                const permisosActualizados=sm.permisos.map((p) => (p.id === permisoId ? {
                    ...p,
                    asignado: nuevoEstado,
                } : p));
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
        this.clearPermisosCache();
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

    private obtenerPermisosAsignados(): string[] {
        const permisos: string[]=[];
        this.universos().forEach((universo) => {
            universo.modulos.forEach((modulo) => {
                if(modulo.asignado) {
                    modulo.submodulos.forEach((submodulo) => {
                        if(submodulo.asignado) {
                            submodulo.permisos.forEach((permiso) => {
                                if(permiso.asignado) {
                                    permisos.push(permiso.id);
                                }
                            });
                        }
                    });
                }
            });
        });
        return permisos;
    }

    private mapearPermisosAUniversos(permisosAsignados: Set<string>): Universo[] {
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
                asignado: modulo.children?.some(permiso => permisosAsignados.has(permiso.id)) || false,
                submodulos: [
                    {
                        id: modulo.id + '_permisos',
                        nombre: 'Permisos',
                        asignado: modulo.children?.some(permiso => permisosAsignados.has(permiso.id)) || false,
                        permisos: modulo.children?.map(permiso => ({
                            id: permiso.id,
                            nombre: permiso.name,
                            asignado: permisosAsignados.has(permiso.id),
                        })) || [],
                    },
                ],
            })) || [],
        }));
    }

    private contarPermisosEnModulo(modulo: Modulo): number {
        return modulo.submodulos.reduce((acc,
                                         sm) => acc + sm.permisos.filter((p) => p.asignado).length, 0);
    }

    private confirmarEliminacionRol(rol: Rol) {
        this.rolService.eliminarRol(rol.id).subscribe({
            next: () => {
                this.roles.update((r) => r.filter((x) => x.id !== rol.id));
                if(this.selectedRol()?.id === rol.id) this.resetSelection();
                this.showSuccess('Rol Eliminado', 'Operación exitosa');
            },
        });
    }

    private resetSelection() {
        this.selectedRol.set(null);
        this.universos.set([]);
        this.modoEdicion.set(false);
    }

    private showSuccess(summary: string,
                        detail: string) {
        this.messageService.add({severity: 'success', summary, detail, life: 3000});
    }

    private showInfo(summary: string,
                     detail: string) {
        this.messageService.add({severity: 'info', summary, detail, life: 3000});
    }

    private showWarning(summary: string,
                        detail: string) {
        this.messageService.add({severity: 'warn', summary, detail, life: 4000});
    }

    private cargarEstructuraPermisos() {
        this.securityNodeService.obtenerEstructuraPermisos().subscribe({
            next: (nodes) => {
                this.securityNodes.set(nodes.data);
            }, error: (error) => {
                this.showWarning('Error', 'No se pudo cargar la estructura de permisos');
                this.securityNodes.set([]);
            },
        });
    }
}
