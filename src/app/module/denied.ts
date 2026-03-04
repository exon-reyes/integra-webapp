import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-access',
    standalone: true,
    imports: [RouterModule],
    template: `
        <div class="bg-surface-50 dark:bg-surface-950 flex items-center justify-center min-h-screen p-6">
            <div class="p-8 rounded-xl text-center bg-surface-0 dark:bg-surface-900 max-w-md w-full shadow-2xl">
                <div class="flex flex-col items-center gap-4">
                    <div class="text-orange-500 rounded-full bg-gray-200 p-4">
                        <i class="pi pi-lock"></i>
                    </div>

                    <div class="text-3xl font-bold text-surface-900 dark:text-surface-0">Acceso restringido</div>

                    <p class="text-surface-600 dark:text-surface-400 mb-4">Tu cuenta no tiene los permisos requeridos
                        para continuar</p>

                    <a routerLink="/"
                       class="w-full inline-flex justify-center items-center px-6 py-3 text-white text-base font-semibold rounded-lg bg-orange-500 hover:bg-orange-600 transition-colors">
                        <i class="pi pi-home mr-2"></i>
                        Volver al Inicio
                    </a>
                </div>
            </div>
        </div>`,
})
export class Denied {
}
