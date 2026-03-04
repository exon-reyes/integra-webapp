import {Injectable} from '@angular/core';
import {CanActivate, Router} from '@angular/router';
import {JWTService} from '@/core/security/JWTService';

@Injectable({providedIn: 'root'})
export class LoginGuard implements CanActivate {
    constructor(
        private jwtService: JWTService,
        private router: Router,
    ) {
    }

    canActivate(): boolean {
        const token=this.jwtService.getToken();

        // Si el token existe y no está expirado, redirige al dashboard
        if(token && !this.jwtService.isTokenExpired(token)) {
            this.router.navigate(['/integra/']);
            return false;
        }

        return true;
    }
}
