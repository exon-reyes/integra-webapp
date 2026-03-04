import {inject, Injectable} from '@angular/core';
import {tap} from 'rxjs';
import {JWTService} from '@/core/security/JWTService';
import {AbstractService} from '@/core/services/abstract-service';
import {environment} from '@env/environment';
import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";

export interface LoginResponse {
    token: string;
    message: string;
    uiPermissions: string[];
    employeeName: CatalogoEmpleado;
}

@Injectable({
    providedIn: 'root',
})
export class LoginService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/auth`;
    private readonly jwtService=inject(JWTService);

    constructor() {
        super();
    }

    login(credentials: any) {
        return this.http.post<LoginResponse>(`${this.apiUrl}/login`, credentials).pipe(
            tap((t) => {
                this.jwtService.setLoginData(t)
            }),
        );
    }
}
