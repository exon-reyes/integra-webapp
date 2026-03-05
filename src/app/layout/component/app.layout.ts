import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule, NgOptimizedImage } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AppMenu } from "@/layout/component/app.menu";
import { SpinnerService } from "@/shared/service/spinner.service";
import { ConfirmDialog } from "primeng/confirmdialog";
import { Toast } from "primeng/toast";
import { SpinnerComponent } from "@/components/spinner.component";
import { JWTService, UserSession } from "@/core/security/JWTService";
import { AvatarService } from "@/core/services/usuario/avatar.service";

@Component({
    selector: 'app-layout', standalone: true, imports: [
        CommonModule, RouterModule, AppMenu, ConfirmDialog, Toast, SpinnerComponent, NgOptimizedImage,
    ], template: `

        <p-confirm-dialog appendTo="body"
                          [breakpoints]="{'1200px': '40vw','992px': '55vw','768px': '75vw','576px': '90vw'}"
                          [style]="{width: '70vw','max-width': '600px'}"></p-confirm-dialog>
        <p-toast/>
        @if (spinnerService.isLoading()) {
            <app-spinner [modal]="true"></app-spinner>
        }
        <div class="flex h-screen overflow-hidden bg-gray-100 font-sans">
            @if (isMobileMenuOpen) {
                <div (click)="isMobileMenuOpen = false"
                     class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm transition-opacity lg:hidden"></div>
            }

            <aside
                [ngClass]="{'translate-x-0': isMobileMenuOpen,'-translate-x-full': !isMobileMenuOpen,'lg:translate-x-0': true,'lg:flex': isDesktopVisible,'lg:hidden': !isDesktopVisible}"
                class="fixed inset-y-0 left-0 z-50 w-72 flex-col bg-white text-slate-700 transition-all duration-300 ease-in-out lg:static lg:inset-auto border-r border-slate-200 shadow-[0_10px_30px_-15px_rgba(0,0,0,0.15)]">
                <div class="h-20 px-8 flex items-center shrink-0 bg-white/80 backdrop-blur-md relative overflow-hidden">
                    <div class="absolute top-0 left-0 right-0 h-[2px]"></div>
                    <div class="flex items-center gap-4 group cursor-pointer">
                        <div class="relative">
                            <div class="h-11 w-11 bg-gray-200 rounded-md flex items-center justify-center">
                                <img class="h-8 w-auto brightness-110" ngSrc="/assets/icon/sci.svg" height="50"
                                     width="50">
                            </div>
                            <div
                                class="absolute -bottom-2 left-1/2 -translate-x-1/2 w-6 h-1 bg-gray-200/20 blur-sm rounded-full opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        </div>

                        <div class="flex flex-col">
                            <div class="flex items-baseline"><span
                                class="text-xl font-bold tracking-[-0.03em] text-slate-800">INTEGRA<span
                                class="text-indigo-600 font-extrabold tracking-normal">SCI</span></span>
                            </div>
                            <div class="flex items-center gap-2"><span
                                class="text-[9px] font-bold text-slate-400 uppercase tracking-[0.3em]">Portal</span>
                                <div class="h-[1px] w-4 bg-slate-200"></div>
                                <span class="text-[9px] font-bold text-indigo-500/70 uppercase">2.0</span>
                            </div>
                        </div>
                    </div>

                    <div class="ml-auto hidden md:block h-8 w-[1px] bg-slate-100"></div>
                </div>

                <!-- Navegación -->
                <nav class="flex-1 overflow-y-auto px-4 py-5 space-y-6 custom-scrollbar">

                    <!-- Sección -->
                    <div>
                        <div class="flex items-center gap-2 px-3 mb-3">
                            <div class="flex-1 h-px bg-slate-200"></div>
                        </div>

                        <app-menu></app-menu>
                    </div>

                </nav>

                <!-- Footer -->
                <div class="p-4 border-t border-slate-200 bg-slate-50 shrink-0">
                    <a
                        class="group flex items-center gap-3 px-4 py-2.5
                   rounded-lg text-sm text-slate-600
                   hover:bg-slate-100 hover:text-indigo-700
                   transition-all"
                        href="#">

                        <i class="pi pi-cog text-base group-hover:rotate-90 transition-transform duration-500"></i>
                        <span class="font-medium">Configuración</span>
                    </a>
                </div>
            </aside>


            <div class="flex-1 flex flex-col min-w-0 overflow-hidden">

                <header class="flex items-center justify-between h-16 px-8 bg-white shadow-sm z-10 shrink-0">
                    <div class="flex items-center">
                        <button (click)="toggleSidebar()"
                                class="p-2 -ml-2 text-gray-600 focus:outline-none hover:bg-gray-100 rounded-lg transition-colors">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M4 6h16M4 12h16m-7 6h7" stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="2"></path>
                            </svg>
                        </button>
                        <div class="text-lg font-bold text-gray-800 ml-4 truncate">Panel de Control</div>
                    </div>

                    <div class="relative">
                        <button
                            (click)="toggleUserMenu($event)"
                            class="flex items-center gap-4 px-3 py-2
               rounded-lg border border-transparent
               transition-all focus:outline-none group">

                            <!-- Identidad -->
                            <div class="hidden sm:flex flex-col text-right leading-tight">
            <span
                class="text-sm font-semibold text-slate-800
                       group-hover:text-indigo-700 transition-colors">
                {{ usuarioSession.username }}
            </span>
                                <span
                                    class="text-[11px] font-medium text-slate-500">
               {{ usuarioSession?.employeeName?.nombreCompleto }}
            </span>
                            </div>

                            <!-- Indicador -->
                            <svg
                                class="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition"
                                fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path d="M19 9l-7 7-7-7" stroke-linecap="round" stroke-linejoin="round"
                                      stroke-width="2"/>
                            </svg>

                            <!-- Avatar unisex -->
                            <div
                                class="w-9 h-9 rounded-md
                   bg-gradient-to-br from-slate-200 to-slate-300
                   flex items-center justify-center
                   shadow-sm ring-1 ring-slate-300 overflow-hidden">
                                @if (avatarService.avatarActual()) {
                                  <img [src]="avatarService.obtenerRutaAvatar(avatarService.avatarActual(), usuarioSession.employeeName.id)" alt="Avatar" class="w-full h-full object-cover">
                                } @else {
                                  <i class="pi pi-user" style="color: #1d75b8"></i>
                                }
                            </div>
                        </button>

                        <!-- Dropdown -->
                        @if (isUserMenuOpen) {
                            <div
                                (click)="$event.stopPropagation()"
                                class="absolute right-0 mt-3 w-60
               bg-white rounded-xl
               border border-slate-100
               shadow-[0_18px_45px_-15px_rgba(0,0,0,0.18)]
               overflow-hidden
               z-50">

                                <button
                                    routerLink="cuenta/perfil"
                                    (click)="consultarCuenta()"
                                    class="w-full flex items-center gap-3 px-5 py-3
                   text-sm text-slate-700
                   hover:bg-slate-50 hover:text-indigo-700
                   transition-colors">

                                    <i class="pi pi-user"></i>
                                    Mi perfil
                                </button>

                                <button
                                    (click)="logout()"
                                    class="w-full flex items-center gap-3 px-5 py-3
                   text-sm text-rose-600
                   hover:bg-rose-50 transition-colors">

                                    <i class="pi pi-sign-out"></i>
                                    Cerrar sesión
                                </button>
                            </div>
                        }
                    </div>
                </header>

                <main class="flex-1 overflow-x-hidden overflow-y-auto p-4 md:p-8 bg-gray-50/50">
                    <router-outlet></router-outlet>
                </main>
            </div>
        </div>
    `,
})
export class AppLayout implements OnInit {
    isMobileMenuOpen = false;
    isDesktopVisible = true; // Estado para ocultar/mostrar en Desktop
    isUserMenuOpen = false;
    protected usuarioSession!: UserSession

    constructor(protected spinnerService: SpinnerService,
        private jwtService: JWTService,
        protected avatarService: AvatarService,
        private router: Router) {
    }

    ngOnInit(): void {
        this.usuarioSession = this.jwtService.getUser()
        // Inicializamos la señal global con el avatar de la sesión actual (del employeeName en localStorage)
        // El employeeName se actualiza cuando se cambia el avatar en el perfil
        const avatarFromSession = (this.usuarioSession?.employeeName as any)?.avatar;
        this.avatarService.setAvatarSource(avatarFromSession);
    }

    @HostListener('document:click') closeMenus() {
        this.isUserMenuOpen = false;
    }

    toggleSidebar() {
        // Si la pantalla es grande, colapsamos el sidebar estático
        // Si es pequeña, abrimos el modo overlay (móvil)
        if (window.innerWidth >= 1024) {
            this.isDesktopVisible = !this.isDesktopVisible;
        } else {
            this.isMobileMenuOpen = !this.isMobileMenuOpen;
        }
    }

    toggleUserMenu(event: Event) {
        event.stopPropagation();
        this.isUserMenuOpen = !this.isUserMenuOpen;
    }

    consultarCuenta() {
        this.isUserMenuOpen = false;
    }

    logout() {
        this.jwtService.logout()
        this.avatarService.setAvatarSource(null);
        this.router.navigate(['/']); // Ajustar a ruta de login
        this.isUserMenuOpen = false;
    }
}
