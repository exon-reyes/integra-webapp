import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {Router} from '@angular/router';
import {MessageService} from 'primeng/api';
import {catchError, throwError} from 'rxjs';
import {JWTService} from '@/core/security/JWTService';

const DEFAULT_LIFE=6000;

/**
 * Extrae el mensaje más descriptivo posible del error del backend.
 * Cubre estructuras comunes: { message }, { detail }, { error }, { errors: [] }
 */
function extractMessage(error: HttpErrorResponse,
                        fallback: string): string {
    const body=error.error;
    if(!body || typeof body === 'string') return body || fallback;
    return (
        body.message ??
        body.detail ??
        body.error ??
        (Array.isArray(body.errors) ? body.errors.map((e: any) => e.message ?? e).join(', ') : null) ??
        fallback
    );
}

export const ErrorResponseInterceptor: HttpInterceptorFn=(
    req: HttpRequest<unknown>,
    next: HttpHandlerFn,
) => {
    const messageService=inject(MessageService);
    const router=inject(Router);
    const jwtService=inject(JWTService);

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            console.error('[ErrorResponseInterceptor] HTTP Error:', error);

            // ── CASO 1: Sin conexión / servidor apagado / CORS ──────────────
            if(error.status === 0) {
                messageService.add({
                    severity: 'error',
                    summary: 'Servidor no disponible',
                    detail: 'No se pudo conectar con el servidor. Verifica tu conexión o inténtalo más tarde.',
                    life: DEFAULT_LIFE,
                });
                return throwError(() => error);
            }

            // ── CASO 2: Error del lado del cliente (JS) ──────────────────────
            if(error.error instanceof ErrorEvent) {
                messageService.add({
                    severity: 'error',
                    summary: 'Error del cliente',
                    detail: error.error.message || 'Ocurrió un problema al procesar la solicitud.',
                    life: DEFAULT_LIFE,
                });
                return throwError(() => error);
            }

            // ── CASO 3: Errores HTTP del backend ─────────────────────────────
            const message=extractMessage(error, 'Ocurrió un error no identificado.');

            switch(error.status) {
                case 400:
                    messageService.add({
                        severity: 'warn',
                        summary: 'Solicitud incorrecta',
                        detail: extractMessage(error, 'Los datos enviados no son válidos.'),
                        life: DEFAULT_LIFE,
                    });
                    break;

                case 401:
                    jwtService.logout() // limpia tokens expirados/inválidos
                    router.navigate(['/auth/login'], {
                        queryParams: {sessionExpired: true},
                    });
                    messageService.add({
                        severity: 'warn',
                        summary: 'Sesión expirada',
                        detail: 'Tu sesión ha caducado. Por favor, inicia sesión de nuevo.',
                        life: DEFAULT_LIFE,
                    });
                    break;

                case 403:
                    router.navigate(['/forbidden']); // opcional pero recomendable
                    messageService.add({
                        severity: 'error',
                        summary: 'Acceso denegado',
                        detail: 'No tienes permisos para realizar esta acción.',
                        life: DEFAULT_LIFE,
                    });
                    break;

                case 404:
                    messageService.add({
                        severity: 'info',
                        summary: 'No encontrado',
                        detail: extractMessage(error, 'El recurso solicitado no existe o fue eliminado.'),
                        life: DEFAULT_LIFE,
                    });
                    break;

                case 409:
                    messageService.add({
                        severity: 'warn',
                        summary: error.error?.title || 'Conflicto de datos',
                        detail: extractMessage(error, 'No se puede completar la operación debido a un conflicto en los datos.'),
                        life: 10000,
                    });
                    break;

                case 422:
                    messageService.add({
                        severity: 'warn',
                        summary: 'Datos no procesables',
                        detail: extractMessage(error, 'Los datos no cumplen las reglas de validación.'),
                        life: DEFAULT_LIFE,
                    });
                    break;

                case 429:
                    messageService.add({
                        severity: 'warn',
                        summary: 'Demasiadas solicitudes',
                        detail: 'Has excedido el límite de solicitudes. Espera unos momentos e inténtalo de nuevo.',
                        life: 10000,
                    });
                    break;

                case 500:
                    messageService.add({
                        severity: 'error',
                        summary: 'Error interno del servidor',
                        detail: 'Ocurrió un error inesperado. Inténtalo más tarde.',
                        life: DEFAULT_LIFE,
                    });
                    break;

                case 502:
                case 503:
                case 504:
                    messageService.add({
                        severity: 'error',
                        summary: 'Servicio no disponible',
                        detail: 'El servidor no está disponible temporalmente. Inténtalo en unos minutos.',
                        life: DEFAULT_LIFE,
                    });
                    break;

                default:
                    messageService.add({
                        severity: 'error',
                        summary: `Error ${error.status || 'desconocido'}`,
                        detail: message,
                        life: DEFAULT_LIFE,
                    });
                    break;
            }

            return throwError(() => error);
        }),
    );
};
