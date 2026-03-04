import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';

export interface Rol {
    id: number;
    nombre: string;
    descripcion?: string;
    rolDefault?: boolean;
    activo?: boolean;
    permisos?: PermisoApi[];
}

export interface PermisoApi {
    id: string;
    nombre: string;
    descripcion: string;
}

@Injectable({
    providedIn: 'root',
})
export class RolService {
    private http=inject(HttpClient);
    private apiUrl=`${environment.integraApi}/roles`;

    obtenerRoles(): Observable<ResponseData<Rol[]>> {
        return this.http.get<ResponseData<Rol[]>>(this.apiUrl);
    }

    obtenerPermisosPorRol(id: number): Observable<ResponseData<Rol>> {
        return this.http.get<ResponseData<Rol>>(`${this.apiUrl}/${id}/permisos`);
    }

    actualizarNombreRol(rolId: number,
                        data: { nombre: string; descripcion?: string }) {
        return this.http.patch<ResponseData<any>>(`${this.apiUrl}/actualizar`, {rolId, ...data});
    }

    actualizarPermisosRol(id: number,
                          permisosIds: string[]): Observable<ResponseData<string>> {
        return this.http.put<ResponseData<string>>(`${this.apiUrl}/permisos`, {rolId: id, permisosIds: permisosIds});
    }

    eliminarRol(id: number): Observable<ResponseData<string>> {
        return this.http.delete<ResponseData<string>>(`${this.apiUrl}/${id}`);
    }

    agregarRol(data: { nombre: string; descripcion?: string }): Observable<ResponseData<Rol>> {
        return this.http.post<ResponseData<Rol>>(`${this.apiUrl}`, data);
    }
}
