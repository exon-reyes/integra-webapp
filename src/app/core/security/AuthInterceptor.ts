import {HttpErrorResponse, HttpHandlerFn, HttpInterceptorFn, HttpRequest} from '@angular/common/http';
import {inject} from '@angular/core';
import {catchError, switchMap, throwError} from 'rxjs';
import {JWTService} from '@/core/security/JWTService';

export const authInterceptor: HttpInterceptorFn=(req: HttpRequest<any>,
                                                 next: HttpHandlerFn) => {
    const jwtService=inject(JWTService);
    const token=jwtService.getToken();


    // No token o llamada al refresh-token → no interceptar
    if(!token || req.url.includes('/auth/refresh-token')) {
        return next(req);
    }
    const attachToken=(t: string) => req.clone({setHeaders: {Authorization: `Bearer ${t}`}});

    // 1 Intentar refresh previo si el token expira pronto
    return jwtService.refreshTokenIfNeeded().pipe(
        switchMap((newToken) => {
            const finalToken=newToken || token;
            return next(attachToken(finalToken)).pipe(
                catchError((error: HttpErrorResponse) => {
                    // 2 Si el backend devuelve 401 → intentamos un refresh forzado
                    if(error.status === 401) {
                        return jwtService.refreshToken().pipe(
                            switchMap((newToken) => {
                                if(newToken) {
                                    // Reintentar la petición original con el nuevo token
                                    return next(attachToken(newToken));
                                } else {
                                    jwtService.logout()
                                    jwtService.redirectToLogin();
                                    return throwError(() => error);
                                }
                            }),
                            catchError((refreshError) => {
                                jwtService.logout()
                                jwtService.redirectToLogin()
                                return throwError(() => refreshError);
                            }),
                        );
                    }

                    // 3 Cualquier otro error → no tocar el token
                    return throwError(() => error);
                }),
            );
        }),
    );
};
