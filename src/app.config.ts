import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {
    APP_INITIALIZER,
    ApplicationConfig,
    LOCALE_ID,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from '@angular/core';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {provideRouter, withEnabledBlockingInitialNavigation, withInMemoryScrolling} from '@angular/router';
import Aura from '@primeuix/themes/aura';
import {providePrimeNG} from 'primeng/config';
import {appRoutes} from './app.routes';
import {ConfirmationService, MessageService} from 'primeng/api';
import {authInterceptor} from '@/core/security/AuthInterceptor';
import {ErrorResponseInterceptor} from '@/core/error-response.interceptor';
import {NavigationLoadingInterceptor} from '@/core/interceptors/navigation-loading.interceptor';
import {registerLocaleData} from '@angular/common';
import localeEs from '@angular/common/locales/es';

registerLocaleData(localeEs);

export const appConfig: ApplicationConfig={
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({
            anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled',
        }), withEnabledBlockingInitialNavigation()),
        provideHttpClient(withFetch(), withInterceptors([authInterceptor, ErrorResponseInterceptor])),
        provideBrowserGlobalErrorListeners(),
        provideZoneChangeDetection({eventCoalescing: true}),
        provideNoopAnimations(),
        MessageService,
        ConfirmationService,
        // Inicializar el interceptor de navegación para mostrar spinner durante cambios de ruta
        {
            provide: APP_INITIALIZER, useFactory: (navigationInterceptor: NavigationLoadingInterceptor) => () => {
            }, deps: [NavigationLoadingInterceptor], multi: true,
        },
        {provide: LOCALE_ID, useValue: 'es-MX'},
        providePrimeNG({
            theme: {preset: Aura, options: {darkModeSelector: '.app-dark'}}, translation: {
                emptyMessage: 'Sin registros',
                emptyFilterMessage: 'Sin resultados',
                monthNames: [
                    'Enero',
                    'Febrero',
                    'Marzo',
                    'Abril',
                    'Mayo',
                    'Junio',
                    'Julio',
                    'Agosto',
                    'Septiembre',
                    'Octubre',
                    'Noviembre',
                    'Diciembre',
                ],
                monthNamesShort: ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'],
                dayNamesMin: ['D', 'L', 'M', 'X', 'J', 'V', 'S'],
                today: 'Hoy',
                cancel: 'Cancelar',
                apply: 'Aplicar',
                weekHeader: 'Sem.',
                clear: 'Borrar',
                reject: 'No',
                choose: 'Seleccionar',
                upload: 'Subir',
                fileSizeTypes: ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
            },
        }),
    ],
};
