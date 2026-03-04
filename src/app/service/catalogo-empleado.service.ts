import { Injectable } from '@angular/core';
import { ResponseData } from '@/core/responseData';
import { environment } from '@env/environment';
import { HttpClient } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { Gestor } from '@/models/Gestor';

export interface FiltroEmpleado {
    id?: number;
    idSupervisor?: number;
    idPuesto?: number;
    idZona?: number;
    clave?: string;
    unidadId?: number;
    estatus?: string;
    idResponsable?: number;
    activos?: boolean;
}

export interface CatalogoEmpleado {
    id?: number;
    codigo?: string;
    nombre?: string;
    apellidoPaterno?: string;
    apellidoMaterno?: string;
    sexo?: string;
    nombreCompleto?: string;
    puesto?: {
        nombre?: string;
    };
    unidad?: {
        nombreCompleto?: string;
    };
    departamento?: {
        nombre?: string;
    };
    contacto?: {
        email?: string;
        telefono?: string;
    };
    gestores?: Gestor[];
    estatus?: string;
    nivel?: number;
    tipoProceso?: string;
    fechaAlta?: Date;
    fechaReingreso?: Date;
    primerResponsable?: CatalogoEmpleado;
    segundoResponsable?: CatalogoEmpleado;
    fechaBaja?: Date;
}

@Injectable({
    providedIn: 'root'
})
export class CatalogoEmpleadoService {
    private readonly apiUrl = `${environment.integraApi}/empleados`;
    private cache = new Map<string, Observable<ResponseData<CatalogoEmpleado[]>>>();

    constructor(private httpClient: HttpClient) {}

    obtenerEmpleados(filtros) {
        const key = JSON.stringify(filtros);
        if (!this.cache.has(key)) {
            this.cache.set(key, this.httpClient.get<ResponseData<CatalogoEmpleado[]>>(`${this.apiUrl}`, { params: filtros }).pipe(shareReplay(1)));
        }
        return this.cache.get(key)!;
    }
    obtenerDetalles(id: number): Observable<ResponseData<CatalogoEmpleado>> {
        return this.httpClient.get<ResponseData<CatalogoEmpleado>>(`${this.apiUrl}/${id}/detalles`);
    }
    obtenerSupervisores() {
        return this.httpClient.get<ResponseData<CatalogoEmpleado[]>>(`${this.apiUrl}/supervisores`, { params: { activos: true } });
    }

    removeCache() {
        this.cache.clear();
    }
}
