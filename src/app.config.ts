import {provideHttpClient, withFetch, withInterceptors} from '@angular/common/http';
import {
    APP_INITIALIZER,
    ApplicationConfig,
    LOCALE_ID,
    provideBrowserGlobalErrorListeners,
    provideZoneChangeDetection,
} from '@angular/core';
import {provideNoopAnimations} from '@angular/platform-browser/animations';
import {
    provideRouter,
    withComponentInputBinding,
    withEnabledBlockingInitialNavigation,
    withInMemoryScrolling
} from '@angular/router';
import Aura from '@primeuix/themes/aura';
import {providePrimeNG} from 'primeng/config';
import {appRoutes} from './app.routes';
import {ConfirmationService, MessageService} from 'primeng/api';
import {authInterceptor} from '@/core/security/AuthInterceptor';
import {ErrorResponseInterceptor} from '@/core/error-response.interceptor';
import {NavigationLoadingInterceptor} from '@/core/interceptors/navigation-loading.interceptor';
import {registerLocaleData} from '@angular/common';
import localeEs from '@angular/common/locales/es';
import {definePreset} from "@primeuix/themes";

registerLocaleData(localeEs);
const MyPreset=definePreset(Aura, {
    semantic: {
        primary: {
            50: '{blue.50}',
            100: '{blue.100}',
            200: '{blue.200}',
            300: '{blue.300}',
            400: '{blue.400}',
            500: '{blue.500}',
            600: '{blue.600}',
            700: '{blue.700}',
            800: '{blue.800}',
            900: '{blue.900}',
            950: '{blue.950}'
        }
    }
});
export const appConfig: ApplicationConfig={
    providers: [
        provideRouter(appRoutes, withInMemoryScrolling({
            anchorScrolling: 'enabled', scrollPositionRestoration: 'enabled',
        }), withEnabledBlockingInitialNavigation(), withComponentInputBinding()),
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
            theme: {preset: MyPreset, options: {darkModeSelector: '.app-dark'}}, translation: {
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
