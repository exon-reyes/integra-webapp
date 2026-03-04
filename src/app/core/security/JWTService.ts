import {Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {CatalogoEmpleado} from '@/service/catalogo-empleado.service';
import {LoginResponse} from "@/core/services/seguridad/LoginService";

export interface UserSession {
    employeeName?: CatalogoEmpleado;
    username: string;
    id: number;
    sup?: boolean;
    authorities: string[];
    uiPermissions: string[];
    enabled: boolean;
}

@Injectable({providedIn: 'root'})
export class JWTService {

    private readonly TOKEN_KEY='jwt_token';
    private readonly UI_PERMS_KEY='ui_permissions';
    private readonly EMPLOYEE_KEY='employee_name';

    // ===== Cache en memoria =====
    private _cachedToken: string | null=null;
    private _cachedPayload: any | null=null;
    private _cachedUiPermissions: string[]=[];
    private _cachedEmployeeName?: CatalogoEmpleado;
    private _cachedUser: UserSession | null=null;

    constructor(private http: HttpClient) {
        this.bootstrapFromStorage();
    }

    setLoginData(data: LoginResponse): void {
        this.setToken(data.token);

        this._cachedUiPermissions=data.uiPermissions;
        this._cachedEmployeeName=data.employeeName;
        localStorage.setItem(this.UI_PERMS_KEY, JSON.stringify(data.uiPermissions));
        localStorage.setItem(this.EMPLOYEE_KEY, JSON.stringify(data.employeeName));
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.UI_PERMS_KEY);
        localStorage.removeItem(this.EMPLOYEE_KEY);

        this._cachedToken=null;
        this._cachedPayload=null;
        this._cachedUser=null;
        this._cachedUiPermissions=[];
        this._cachedEmployeeName=undefined;
    }

    getToken(): string | null {
        return this._cachedToken;
    }

    isTokenExpired(token?: string): boolean {
        const t=token || this._cachedToken;
        if(!t) return true;

        try {
            const payload=this.decodePayloadCached(t);
            return !payload.exp || Date.now()>=payload.exp * 1000;
        } catch {
            return true;
        }
    }

    isTokenExpiringSoon(secondsThreshold=300): boolean {
        if(!this._cachedToken) return false;

        try {
            const payload=this.decodePayloadCached(this._cachedToken);
            return payload.exp * 1000 - Date.now()<=secondsThreshold * 1000;
        } catch {
            return false;
        }
    }

    // ============================
    getUser(): UserSession | null {
        if(this._cachedUser) {
            return this._cachedUser;
        }

        if(!this._cachedToken || this.isTokenExpired()) {
            return null;
        }

        try {
            const payload=this.decodePayloadCached(this._cachedToken);

            this._cachedUser={
                username: payload.sub,
                id: payload.id,
                employeeName: this._cachedEmployeeName,
                sup: false,
                authorities: payload.authorities || [],
                uiPermissions: this._cachedUiPermissions,
                enabled: true,
            };

            return this._cachedUser;
        } catch {
            return null;
        }
    }

    getAuthorities(): string[] {
        return this.getUser()?.authorities || [];
    }

    hasAuthority(permission: string): boolean {
        return this._cachedUiPermissions.includes(permission);
    }

    refreshTokenIfNeeded(): Observable<string | null> {
        if(!this._cachedToken || !this.isTokenExpiringSoon()) {
            return of(this._cachedToken);
        }

        return this.refreshToken();
    }

    refreshToken(): Observable<string | null> {
        return this.http
            .post<{ token: string }>('/auth/refresh-token', {})
            .pipe(
                map(res => {
                    if(res?.token) {
                        this.setToken(res.token);
                        return res.token;
                    }
                    return null;
                }),
                catchError(() => {
                    this.logout();
                    return of(null);
                }),
            );
    }


    redirectToLogin(): void {
        window.location.href='auth/login';
    }


    private bootstrapFromStorage(): void {
        this._cachedToken=localStorage.getItem(this.TOKEN_KEY);

        const perms=localStorage.getItem(this.UI_PERMS_KEY);
        this._cachedUiPermissions=perms ? JSON.parse(perms) : [];

        const emp=localStorage.getItem(this.EMPLOYEE_KEY);
        this._cachedEmployeeName=emp ? JSON.parse(emp) : undefined;
    }


    private setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);

        this._cachedToken=token;
        this._cachedPayload=null; // fuerza nueva decodificación
        this._cachedUser=null;
    }

    // ============================
    private decodePayloadCached(token: string): any {
        if(this._cachedPayload) {
            return this._cachedPayload;
        }

        const parts=token.split('.');
        if(parts.length !== 3) {
            throw new Error('JWT inválido');
        }

        this._cachedPayload=JSON.parse(atob(parts[1]));
        return this._cachedPayload;
    }
}
