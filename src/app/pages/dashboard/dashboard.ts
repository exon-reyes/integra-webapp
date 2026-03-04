import {Component} from '@angular/core';
import {CommonModule} from '@angular/common';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="min-h-[85vh] flex flex-col items-center justify-center px-6">

            <div class="w-full max-w-3xl">

                <div class="flex flex-col items-center">

                    <div class="group">
                        <div
                            class="w-auto h-100 flex items-center justify-center transition-all duration-700 ease-in-out group-hover:scale-110">
                            <img alt="Integrasci" class="w-100 opacity-80 group-hover:opacity-100 transition-opacity"
                                 src="/assets/bg/banner.svg"/>
                        </div>
                    </div>

                    <div class="text-center relative">
                        <div class="absolute -top-3 left-1/2 -translate-x-1/2 w-[1px] h-6 bg-slate-200"></div>

                        <h1 class="text-slate-900 text-5xl font-light tracking-tight mb-8">
                            Área en <span class="font-serif italic text-indigo-600">construcción</span>
                        </h1>

                        <div class="max-w-xl mx-auto space-y-6">
                            <p class="leading-relaxed tracking-wide">
                                Nos encontramos implementando mejoras progresivas.
                                Puedes usar las funcionalidades disponibles según tu perfil.
                            </p>

                            <div class="flex items-center justify-center gap-4 text-slate-300">
                                <span class="h-[1px] w-6 bg-current"></span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,
    styles: [
        `
            :host {
                display: block;
            }
        `,
    ],
})
export class Dashboard {
}
