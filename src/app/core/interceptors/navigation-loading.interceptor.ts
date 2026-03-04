import {Injectable} from '@angular/core';
import {NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router} from '@angular/router';
import {SpinnerService} from '@/shared/service/spinner.service';

/**
 * Interceptor que muestra un spinner de carga durante la navegación entre rutas.
 * Se suscribe a los eventos del Router y controla el SpinnerService automáticamente.
 */
@Injectable({
    providedIn: 'root',
})
export class NavigationLoadingInterceptor {

    /** Tiempo mínimo (en ms) que el spinner debe mostrarse para ser perceptible */
    private readonly MIN_LOADING_TIME=300;

    /** Timestamp del inicio de la navegación actual */
    private navigationStartTime: number=0;

    constructor(private router: Router,
                private spinnerService: SpinnerService) {
        this.initNavigationListener();
    }

    /**
     * Inicializa el listener de eventos de navegación del router.
     * Muestra el spinner cuando inicia la navegación y lo oculta cuando termina,
     * garantizando un tiempo mínimo de visualización.
     */
    private initNavigationListener(): void {
        this.router.events.subscribe(event => {
            if(event instanceof NavigationStart) {
                // Registrar el tiempo de inicio y mostrar spinner
                this.navigationStartTime=Date.now();
                this.spinnerService.show();
            } else if(event instanceof NavigationEnd || event instanceof NavigationCancel || event instanceof NavigationError) {
                // Calcular tiempo transcurrido desde el inicio
                const elapsedTime=Date.now() - this.navigationStartTime;
                const remainingTime=Math.max(0, this.MIN_LOADING_TIME - elapsedTime);

                // Ocultar spinner después del tiempo mínimo
                setTimeout(() => {
                    this.spinnerService.hide();
                }, remainingTime);
            }
        });
    }
}

