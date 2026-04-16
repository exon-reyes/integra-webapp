import {Component} from '@angular/core';
import {RouterModule} from '@angular/router';

@Component({
    selector: 'app-notfound',
    standalone: true,
    // Eliminamos 'ButtonModule' de los imports
    imports: [RouterModule],
    template: `
        <section class="flex flex-col items-center justify-center min-h-screen p-6 bg-surface-0 dark:bg-surface-900">
            <div class="p-20 shadow-2xl rounded-xl text-center bg-surface-50 dark:bg-surface-800 max-w-lg w-full">
                <div class="text-7xl font-bold text-blue-500">404</div>
                <h5 class="text-xl font-semibold text-surface-900 dark:text-surface-0 mb-2">Página no encontrada</h5>

                <p class="text-surface-600 dark:text-surface-300 mb-8 ">El recurso al que intentas acceder no existe o
                    la URL es incorrecta.</p>

                <div class="flex flex-col gap-3">
                    <a routerLink="/"
                       class="inline-flex items-center justify-center w-full px-4 py-3 text-sm font-medium text-white bg-blue-500 rounded-lg shadow-md hover:bg-blue-700 transition duration-150 ease-in-out">
                        <i class="pi pi-arrow-left mr-2"></i>
                        Volver al Dashboard
                    </a>
                </div>
            </div>
        </section>
    `,
})
export class Notfound {
}
