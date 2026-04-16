import {CommonModule} from "@angular/common";
import {Router, RouterModule} from "@angular/router";
import {Component} from "@angular/core";
import {RippleModule} from "primeng/ripple";
import {StyleClassModule} from "primeng/styleclass";
import {ButtonModule} from "primeng/button";
import {DividerModule} from "primeng/divider";
import {AnimateOnScrollModule} from "primeng/animateonscroll";

@Component({
    selector: 'app-landing',
    standalone: true,
    imports: [
        CommonModule,
        RouterModule,
        RippleModule,
        StyleClassModule,
        ButtonModule,
        DividerModule,
        AnimateOnScrollModule,
    ],
    template: `
        <div class="bg-white min-h-screen flex flex-col font-sans text-slate-900 overflow-hidden">

            <nav class="relative z-[100] px-6 lg:px-20 py-5 bg-slate-800 border-b border-white/10">
                <div class="max-w-7xl mx-auto flex items-center justify-between">
                    <div class="flex items-center gap-8">
                        <div class="flex items-center gap-2">
                            <img src="/assets/icon/sci.svg" class="h-8 w-auto" alt="Logo">
                            <span class="text-2xl font-bold text-white ">integra</span>
                        </div>
                    </div>

                    <div class="flex items-center gap-4">
                        <p-button [routerLink]="['auth/login']" label="Ingresar" severity="secondary"></p-button>
                        <p-button [routerLink]="['auth/register-request']" label="Sin cuenta? Registrate"
                                  severity="info"></p-button>
                    </div>
                </div>
            </nav>

            <main class="flex-grow relative flex flex-col">

                <div class="absolute inset-0 z-0">
                    <div class="absolute top-0 w-full h-[60%] bg-[#004481]"></div>
                    <div
                        class="absolute top-[40%] left-0 w-full h-[30%] bg-[#004481] -skew-y-3 origin-left shadow-2xl"></div>
                    <div class="absolute top-[65%] left-[-10%] w-[120%] h-[5%] bg-[#02a5a5] -skew-y-2 opacity-80"></div>
                </div>

                <div class="relative z-10 max-w-7xl mx-auto px-6 lg:px-20 w-full flex-grow flex items-center pt-10">
                    <div class="grid lg:grid-cols-2 gap-16 items-center w-full">

                        <div class="space-y-2 animate-fade-in">
                            <div class="space-y-6">
                                <div class="text-4xl lg:text-5xl font-bold text-white leading-[1.05] tracking-tight">
                                    INTEGRA SCI<br>
                                    <span class="text-[#02a5a5]">Estrategia en evolución</span>
                                </div>
                                <div class="text-white max-w-4xl mx-auto mb-12">Plataforma unificada para la gestión de
                                    <b>Recursos Humanos, Infraestructura TI y Operaciones Generales de negocio</b></div>
                            </div>
                        </div>

                        <div class="relative animate-slide-up">
                            <div
                                class="bg-white rounded-sm p-4 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] border border-slate-100">
                                <div class="bg-slate-50 border border-slate-100 overflow-hidden relative group">
                                    <img src="/assets/bg/banner.svg"
                                         class="w-full h-auto grayscale-[0.5] group-hover:grayscale-0 transition-all duration-700">

                                    <div class="absolute top-6 left-6 bg-[#004481] text-white p-6 shadow-2xl">
                                        <p class="text-[10px] font-bold uppercase tracking-[0.2em] opacity-60">
                                            e-core</p>
                                        <p class="text-3xl font-light tracking-tighter">V<span
                                            class="font-bold">1.2</span></p>
                                    </div>
                                </div>
                            </div>

                            <div class="absolute -bottom-6 -right-6 w-32 h-32 bg-[#02a5a5] -z-10 animate-pulse"></div>
                        </div>

                    </div>
                </div>
            </main>

            <footer class="bg-white py-10 px-6 lg:px-20 border-t border-slate-100 relative z-10">
                <div class="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
                    <div class="flex items-center gap-10">
                        <span class="text-[#004481] font-bold text-sm tracking-tighter italic uppercase">v1.2.0</span>
                    </div>
                    <p class="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Exon © 2026 | Plataforma
                        de acceso web</p>
                </div>
            </footer>
        </div>
    `,
    styles: [
        `
                 @keyframes fade-in {
                     from { opacity: 0; transform: translateY(20px); }
                     to { opacity: 1; transform: translateY(0); }
                 }
                 @keyframes slide-up {
                     from { opacity: 0; transform: translateY(100px); }
                     to { opacity: 1; transform: translateY(0); }
                 }
                 .animate-fade-in { animation: fade-in 1s ease-out forwards; }
                 .animate-slide-up { animation: slide-up 1.2s cubic-bezier(0.2, 1, 0.2, 1) forwards; }
             `,
    ],
})
export class Landing {
    constructor(protected router: Router) {
    }
}
