import {Injectable} from '@angular/core';
import {HttpClient, HttpParams} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseData} from '@/core/responseData';
import {environment} from '@env/environment';

export interface TipoCuenta {
    id: number;
    nombre: string;
}

export interface CredencialDto {
    id: number;
    tipoId: number;
    tipoNombre: string;
    departamentoId: number;
    departamentoNombre: string;
    unidadId: number;
    unidadClave: string;
    unidadNombreCompleto: string;
    usuario: string;
    clave: string;
    nota: string;
    creado: string;
    actualizado: string;
    mostrarClave?: boolean; // Propiedad opcional para controlar visibilidad en la UI
}

export interface FiltroCuenta {
    idUnidad?: number;
    idDepartamento?: number;
    idTipo?: number;
}

@Injectable({
    providedIn: 'root',
})
export class CredencialService {
    private apiUrl=`${environment.integraApi}/credenciales`;

    constructor(private http: HttpClient) {
    }

    obtenerCredenciales(filtro?: FiltroCuenta): Observable<ResponseData<CredencialDto[]>> {
        let params=new HttpParams();

        if(filtro?.idUnidad) {
            params=params.set('idUnidad', filtro.idUnidad.toString());
        }
        if(filtro?.idDepartamento) {
            params=params.set('idDepartamento', filtro.idDepartamento.toString());
        }
        if(filtro?.idTipo) {
            params=params.set('idTipo', filtro.idTipo.toString());
        }

        return this.http.get<ResponseData<CredencialDto[]>>(this.apiUrl, {params});
    }

    crearCredencial(credencial: any): Observable<ResponseData<void>> {
        return this.http.post<ResponseData<void>>(this.apiUrl, credencial);
    }

    actualizarCredencial(id: number,
                         credencial: any): Observable<ResponseData<void>> {
        return this.http.put<ResponseData<void>>(`${this.apiUrl}/${id}`, credencial);
    }

    eliminarCredencial(id: number): Observable<ResponseData<void>> {
        return this.http.delete<ResponseData<void>>(`${this.apiUrl}/${id}`);
    }

    obtenerTipoCuentas() {
        return this.http.get<ResponseData<TipoCuenta[]>>(`${this.apiUrl}/tipos`);
    }

    crearTipoCuenta(tipo: { nombre: string }): Observable<ResponseData<void>> {
        return this.http.post<ResponseData<void>>(`${this.apiUrl}/tipo`, tipo);
    }

    actualizarTipoCuenta(id: number,
                         tipo: { nombre: string }): Observable<ResponseData<void>> {
        return this.http.put<ResponseData<void>>(`${this.apiUrl}/tipo/${id}`, tipo);
    }

    eliminarTipoCuenta(id: number): Observable<ResponseData<void>> {
        return this.http.delete<ResponseData<void>>(`${this.apiUrl}/tipo/${id}`);
    }
}
