import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { CatalogoEmpleado, CatalogoEmpleadoService } from "@/service/catalogo-empleado.service";
import { JWTService } from "@/core/security/JWTService";
import { takeUntilDestroyed } from "@angular/core/rxjs-interop";
import { DialogModule } from 'primeng/dialog';
import { ButtonModule } from 'primeng/button';
import { AvatarService } from '@/core/services/usuario/avatar.service';

// ── Tipos ──────────────────────────────────────────────────
export type EstatusLaboral = 'Activo' | 'Reingreso' | 'Baja';

// Una sola interfaz — fusión de ambas versiones
// export interface PerfilEmpleado {
//     codigo: string;
//     claveEmpleado: string;
//     nombre: string;
//     apellidoPaterno: string;
//     apellidoMaterno: string;
//     puesto: string;
//     email: string;
//     telefono: string;
//     departamento: string;
//     unidad: string;
//     unidadOperativa: string;
//     estatus: EstatusLaboral;
//     fechaAlta: string;
//     fechaReingreso: string | null;
//     fechaBaja: string | null;
//     sexo: string;
//     tipoContrato: string;
//     primerResponsable: string;
//     segundoResponsable: string;
//     manager: { nombre: string; puesto: string };
//     utilizacion: number;
//     diasVacaciones: number;
//     avatarUrl: string | null;
// }

// ── Configuración de estatus ───────────────────────────────
// const ESTATUS_CONFIG: Record<EstatusLaboral, { classes: string; label: string }>={
//     Activo: {classes: 'bg-emerald-100 text-emerald-700 ring-1 ring-emerald-200', label: 'Activo'},
//     Reingreso: {classes: 'bg-blue-100 text-blue-700 ring-1 ring-blue-200', label: 'Reingreso'},
//     Baja: {classes: 'bg-slate-100 text-slate-500 ring-1 ring-slate-200', label: 'Baja'},
// };

// ── Mock ───────────────────────────────────────────────────
// const MOCK: PerfilEmpleado={
//     codigo: 'MX-CDMX-004821',
//     claveEmpleado: 'EMP-004821',
//     nombre: 'Sofía',
//     apellidoPaterno: 'Ramírez',
//     apellidoMaterno: 'Gutiérrez',
//     puesto: 'VENDEDOR DE MOSTRADOR',
//     email: 'sofia.ramirez@empresa.com.mx',
//     telefono: '+52 (55) 4821-9034',
//     departamento: 'VENTAS',
//     unidad: '75844 SALINA CRUZ 8',
//     unidadOperativa: 'Unidad Corporativa Norte',
//     estatus: 'Activo',
//     fechaAlta: '2019-03-11',
//     fechaReingreso: null,
//     fechaBaja: null,
//     sexo: 'Femenino',
//     tipoContrato: 'Permanente Tiempo Completo',
//     primerResponsable: 'Ing. Carlos Mendoza Herrera',
//     segundoResponsable: 'Lic. Beatriz Soto Vega',
//     manager: {nombre: 'Ing. Carlos Mendoza Herrera', puesto: 'Director de TI'},
//     utilizacion: 91,
//     diasVacaciones: 9,
//     avatarUrl: null,
// };

// ── Componente ─────────────────────────────────────────────
@Component({
    selector: 'app-perfil-empleado',
    imports: [DatePipe, DialogModule, ButtonModule],
    styleUrl: './perfil.scss',
    templateUrl: './perfil.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Perfil {
    private readonly destroyRef = inject(DestroyRef);
    protected readonly perfil = signal<CatalogoEmpleado | null>(null);
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
    // });
    private readonly empleadoService = inject(CatalogoEmpleadoService);
    private readonly jwtService = inject(JWTService);
    private readonly avatarService = inject(AvatarService);

    protected mostrarModalAvatar = false;
    protected readonly avatars = ['avatar1.svg', 'avatar2.svg', 'avatar3.svg', 'avatar4.svg', 'avatar5.svg', 'avatar6.svg', 'avatar7.svg', 'avatar8.svg'];
    protected selectedAvatar = signal<string | null>(null);
    protected tempAvatar = signal<string | null>(null);
    protected guardandoAvatar = signal(false);
    protected archivoSeleccionado = signal<File | null>(null);
    protected previewUrl = signal<string | null>(null);
    protected eliminandoAvatar = signal(false);

    constructor() {
        this.empleadoService
            .obtenerDetalles(this.jwtService.getUser().employeeName.id)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(response => {
                this.perfil.set(response.data);
            });
    }

    abrirModalAvatar() {
        const current = this.selectedAvatar();
        if (current?.startsWith('data:image/')) {
            this.previewUrl.set(current);
            this.tempAvatar.set(null);
            this.archivoSeleccionado.set(null);
        } else if (current) {
            this.tempAvatar.set(current);
            this.previewUrl.set(null);
            this.archivoSeleccionado.set(null);
        } else {
            this.tempAvatar.set(null);
            this.previewUrl.set(null);
            this.archivoSeleccionado.set(null);
        }
        this.mostrarModalAvatar = true;
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
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            this.archivoSeleccionado.set(file);
            this.tempAvatar.set(null); // Deseleccionar avatar predeterminado

            const reader = new FileReader();
            reader.onload = (e) => {
                this.previewUrl.set(e.target?.result as string);
            };
            reader.readAsDataURL(file);
        }
        // Limpiamos el input para permitir seleccionar otra vez el mismo archivo si es necesario
        if (input) input.value = '';
    }

    guardarAvatar() {
        const avatar = this.tempAvatar();
        const file = this.archivoSeleccionado();
        const preview = this.previewUrl();
        const userId = this.jwtService.getUser().employeeName.id;

        if (avatar || file) {
            this.guardandoAvatar.set(true);
            const payload = file ? file : (avatar as string);

            this.avatarService.actualizarAvatar(userId, payload)
                .pipe(takeUntilDestroyed(this.destroyRef))
                .subscribe({
                    next: () => {
                        if (file && preview) {
                            this.selectedAvatar.set(preview);
                        } else {
                            this.selectedAvatar.set(avatar);
                        }
                        this.mostrarModalAvatar = false;
                        this.guardandoAvatar.set(false);
                    },
                    error: () => {
                        this.guardandoAvatar.set(false);
                    }
                });
        }
    }

    eliminarFotoGuardada() {
        const userId = this.jwtService.getUser().employeeName.id;
        this.eliminandoAvatar.set(true);
        this.avatarService.eliminarAvatar(userId)
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe({
                next: () => {
                    this.selectedAvatar.set(null);
                    this.tempAvatar.set(null);
                    this.previewUrl.set(null);
                    this.archivoSeleccionado.set(null);
                    this.mostrarModalAvatar = false;
                    this.eliminandoAvatar.set(false);
                },
                error: () => {
                    this.eliminandoAvatar.set(false);
                }
            });
    }
}
