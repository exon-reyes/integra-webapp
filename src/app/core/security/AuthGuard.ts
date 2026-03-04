import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {JWTService} from '@/core/security/JWTService';

@Injectable({providedIn: 'root'})
export class AuthGuard implements CanActivate {
    constructor(
        private jwtService: JWTService,
        private router: Router,
    ) {
    }

    canActivate(): boolean {
        const token=this.jwtService.getToken();

        // Si no hay token o está expirado, redirige a landing page
        if(!token || this.jwtService.isTokenExpired(token)) {
            this.router.navigate(['/']);
            return false;
        }
        // Token válido: permite acceso
        return true;
    }
}
