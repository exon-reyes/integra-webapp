import {ChangeDetectionStrategy, Component, DestroyRef, inject, signal} from '@angular/core';
import {DatePipe} from '@angular/common';
import {CatalogoEmpleado, CatalogoEmpleadoService} from "@/service/catalogo-empleado.service";
import {JWTService} from "@/core/security/JWTService";
import {takeUntilDestroyed} from "@angular/core/rxjs-interop";
import {DialogModule} from 'primeng/dialog';
import {ButtonModule} from 'primeng/button';
import {ActualizarAvatarRequest, AvatarService} from '@/core/services/usuario/avatar.service';
import {SpinnerComponent} from "@/components/spinner.component";

// ── Configuración de estatus ───────────────────────────────
// const ESTATUS_CONFIG: Record<EstatusLaboral, { classes: string; label: string }>={
//     Activo: {classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200', label: 'Activo'},
//     Reingreso: {classes: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200', label: 'Reingreso'},
//     Baja: {classes: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', label: 'Baja'},
// };

// ── Componente ─────────────────────────────────────────────
@Component({
    selector: 'app-perfil-empleado',
    imports: [DatePipe, DialogModule, ButtonModule, SpinnerComponent],
    styleUrl: './perfil.scss',
    templateUrl: './perfil.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perfil {
    protected readonly perfil=signal<CatalogoEmpleado | null>(null);
    protected mostrarModalAvatar=false;
    // protected readonly nombreCompleto=computed(() => {
    //     const p=this.perfil();
    //     return `${p.} ${p.apellidoPaterno} ${p.apellidoMaterno}`;
    // });
    // protected readonly iniciales=computed(() => {
    //     const p=this.perfil();
    //     return `${p.nombre[0]}${p.apellidoPaterno[0]}`;
    // });
    // protected readonly estatusConfig=computed(() =>
    //     ESTATUS_CONFIG[this.perfil().estatus],
    // );
    // protected readonly managerIniciales=computed(() => {
    //     const parts=this.perfil().manager.nombre.split(' ');
    //     return parts.length>=2
    //         ? `${parts[parts.length - 2][0]}${parts[parts.length - 1][0]}`
    //         : parts[0][0];
    protected readonly avatars=[
        'avatar1.svg',
        'avatar2.svg',
        'avatar3.svg',
        'avatar4.svg',
        'avatar5.svg',
        'avatar6.svg',
        'avatar7.svg',
        'avatar8.svg',
    ];
    protected selectedAvatar=signal<string | null>(null);
    protected tempAvatar=signal<string | null>(null);
    protected guardandoAvatar=signal(false);
    protected archivoSeleccionado=signal<File | null>(null);
    protected previewUrl=signal<string | null>(null);
    protected eliminandoAvatar=signal(false);
    protected readonly avatarService=inject(AvatarService);
    private readonly destroyRef=inject(DestroyRef);
    // });
    private readonly empleadoService=inject(CatalogoEmpleadoService);
    private readonly jwtService=inject(JWTService);

    constructor() {
        this.empleadoService
            .obtenerDetalles(this.jwtService.getUser().employeeName.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(response => {
                this.perfil.set(response.data);
                const objData=response.data as any;
                if(objData.avatar) {
                    this.selectedAvatar.set(objData.avatar);
                }
            });
    }

    abrirModalAvatar() {
        const current=this.selectedAvatar();
        if(current?.startsWith('data:image/') || current?.startsWith('http')) {
            this.previewUrl.set(current);
            this.tempAvatar.set(null);
            this.archivoSeleccionado.set(null);
        } else if(current?.endsWith('.svg')) {
            this.tempAvatar.set(current);
            this.previewUrl.set(null);
            this.archivoSeleccionado.set(null);
        } else if(current) {
            // Has real set image from server
            this.tempAvatar.set(null);
            this.previewUrl.set(this.avatarService.obtenerRutaAvatar(current, this.jwtService.getUser().employeeName.id));
            this.archivoSeleccionado.set(null);
        } else {
            this.tempAvatar.set(null);
            this.previewUrl.set(null);
            this.archivoSeleccionado.set(null);
        }
        this.mostrarModalAvatar=true;
    }

    seleccionarAvatar(avatar: string) {
        this.tempAvatar.set(avatar);
        this.archivoSeleccionado.set(null);
        this.previewUrl.set(null);
    }

    removerSeleccion() {
        this.tempAvatar.set(null);
        this.previewUrl.set(null);
        this.archivoSeleccionado.set(null);
    }

    onFileSelected(event: Event) {
        const input=event.target as HTMLInputElement;
        if(input.files && input.files.length>0) {
            const file=input.files[0];
            this.archivoSeleccionado.set(file);
            this.tempAvatar.set(null); // Deseleccionar avatar predeterminado

            const reader=new FileReader();
            reader.onload=(e) => {
                this.previewUrl.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Limpiamos el input para permitir seleccionar otra vez el mismo archivo si es necesario
        if(input) input.value='';
    }

    guardarAvatar() {
        const avatar=this.tempAvatar();
        const file=this.archivoSeleccionado();
        const preview=this.previewUrl();
        const userId=this.jwtService.getUser().employeeName.id;

        if(avatar || file) {
            this.guardandoAvatar.set(true);
            const request: ActualizarAvatarRequest={
                avatarName: file ? undefined : (avatar as string),
                base64Image: file ? (preview as string) : undefined,
            };

            this.avatarService.actualizarAvatar(userId, request)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        const nuevoAvatar=file && preview ? preview : avatar;
                        this.selectedAvatar.set(nuevoAvatar);
                        this.avatarService.setAvatarSource(nuevoAvatar);

                        // Actualizar el employeeName en el JWTService para persistir el avatar
                        const perfilActual=this.perfil();
                        if(perfilActual) {
                            const employeeNameActualizado={...perfilActual, avatar: nuevoAvatar};
                            this.jwtService.updateEmployeeName(employeeNameActualizado);
                        }

                        this.mostrarModalAvatar=false;
                        this.guardandoAvatar.set(false);
                    },
                    error: () => {
                        this.guardandoAvatar.set(false);
                    },
                });
        }
    }

    eliminarFotoGuardada() {
        const userId=this.jwtService.getUser().employeeName.id;
        this.eliminandoAvatar.set(true);
        this.avatarService.eliminarAvatar(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.selectedAvatar.set(null);
                    this.avatarService.setAvatarSource(null);
                    this.tempAvatar.set(null);
                    this.previewUrl.set(null);
                    this.archivoSeleccionado.set(null);
                    this.mostrarModalAvatar=false;
                    this.eliminandoAvatar.set(false);

                    // Actualizar el employeeName en el JWTService para eliminar el avatar
                    const perfilActual=this.perfil();
                    if(perfilActual) {
                        const employeeNameActualizado={...perfilActual, avatar: null};
                        this.jwtService.updateEmployeeName(employeeNameActualizado);
                    }
                },
                error: () => {
                    this.eliminandoAvatar.set(false);
                },
            });
    }
}
