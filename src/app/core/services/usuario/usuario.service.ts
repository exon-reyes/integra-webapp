import {Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';
import {AbstractService} from '@/core/services/abstract-service';
import {Observable} from 'rxjs';
import {CreateUserRequest} from '@/models/usuario/create-user-request';
import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";
import {PaginatedResponse} from './paginated-response.interface';

export interface UsuarioConRoles {
    id: number;
    username: string;
    empleadoId?: number; // Usamos null porque en el SQL usaste LEFT JOIN
    email?: string;
    nombreCompleto?: string;
    activo: boolean; // Recordando que es el resultado del GROUP_CONCAT
    departamento?: string;
    puesto?: string;
    roles?: string;
}

export interface PermisosResponse {
    readonly fromRoles: Set<string>;
    readonly special: Set<string>;
}

export interface Usuario {
    id?: number;
    nombre?: string;
    email?: string;
    password?: string;
    roles?: Rol[];
    empleado?: CatalogoEmpleado;
    permisos?: string[];
    permisosEspeciales?: string[];
    activo?: boolean;
    usuario?: string;
    authorities?: string[];
    esSupervisor?: boolean;
    tokenVersion?: number;
    empleadoId?: number | null;
    pin?: string;
}

export interface Rol {
    id?: number;
    nombre?: string;
}

@Injectable({
    providedIn: 'root',
})
export class UsuarioService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/usuarios`;

    obtenerUsuarios(page: number=0,
                    size: number=10,
                    empleadoId?: number | null): Observable<PaginatedResponse<UsuarioConRoles>> {
        const params: Record<string, string>={page: page.toString(), size: size.toString()};
        if(empleadoId != null) {
            params['empleadoId']=empleadoId.toString();
        }
        return this.http.get<PaginatedResponse<UsuarioConRoles>>(this.apiUrl, {params});
    }

    actualizarPermisosEspeciales(params): Observable<ResponseData<any>> {
        return this.http.patch<ResponseData<any>>(`${this.apiUrl}/permisos/actualizar`, params);
    }

    obtenerPrivilegios(idUsuario: number): Observable<ResponseData<PermisosResponse>> {
        return this.http.get<ResponseData<PermisosResponse>>(`${this.apiUrl}/${idUsuario}/permisos`);
    }

    actualizarEstatus(userId: number,
                      activo: boolean): Observable<ResponseData<string>> {
        return this.http.patch<ResponseData<string>>(`${this.apiUrl}/${userId}/estatus?activo=${activo}`, {});
    }

    eliminarUsuario(id: number): Observable<ResponseData<any>> {
        return this.http.delete<ResponseData<any>>(`${this.apiUrl}/${id}`);
    }

    crearUsuario(userData: CreateUserRequest): Observable<ResponseData<any>> {
        return this.http.post<ResponseData<any>>(this.apiUrl, userData);
    }

    actualizarUsuario(userData: any): Observable<ResponseData<any>> {
        return this.http.patch<ResponseData<any>>(`${this.apiUrl}/usuario`, userData);
    }
}
