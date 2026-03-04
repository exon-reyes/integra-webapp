import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router} from '@angular/router';
import {JWTService} from '@/core/security/JWTService';

@Injectable({providedIn: 'root'})
export class PermissionGuard implements CanActivate {
    constructor(
        private jwtService: JWTService,
        private router: Router,
    ) {
    }

    canActivate(route: ActivatedRouteSnapshot): boolean {
        const token=this.jwtService.getToken();

        // No hay token o está expirado -> redirige a login
        if(!token || this.jwtService.isTokenExpired(token)) {
            this.router.navigate(['/auth/login']);
            return false;
        }
        const requiredPermission=route.data['permission'];
        // Si no hay permiso requerido, permite acceso
        if(!requiredPermission) return true;
        // Validar permiso único o múltiples permisos
        if(Array.isArray(requiredPermission)) {
            const hasAnyPermission=requiredPermission.some((p) => this.jwtService.hasAuthority(p));
            if(hasAnyPermission) return true;
        } else if(typeof requiredPermission === 'string') {
            if(this.jwtService.hasAuthority(requiredPermission)) return true;
        }
        // No tiene acceso
        this.router.navigate(['/auth/denied']);
        return false;
    }
}
