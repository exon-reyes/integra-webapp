import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ResponseData} from '@/core/responseData';
import {environment} from '@env/environment';
import {Unidad} from '@/models/empresa/unidad';
import {HorarioOperativo} from '@/models/empresa/horario-operativo';
import {AbstractService} from '@/core/services/abstract-service';

@Injectable({
    providedIn: 'root',
})
export class UnidadService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}`;
    private data?: ResponseData<Unidad[]>;

    constructor() {
        super();
    }

    obtenerContacto(idUnidad): Observable<ResponseData<Unidad>> {
        return this.http.get<ResponseData<Unidad>>(`${this.apiUrl}/unidades/contacto/${idUnidad}`, {
            params: {idUnidad},
        });
    }

    obtenerHorarios(idUnidad): Observable<ResponseData<HorarioOperativo[]>> {
        return this.http.get<ResponseData<HorarioOperativo[]>>(`${this.apiUrl}/unidades/horario/${idUnidad}`);
    }

    registrarUnidad(unidad: any): Observable<ResponseData<Unidad>> {
        return this.http.post<ResponseData<Unidad>>(`${this.apiUrl}/unidades/registrar`, unidad);
    }

    actualizarUnidad(unidad: any): Observable<ResponseData<void>> {
        return this.http.put<ResponseData<void>>(`${this.apiUrl}/unidades/actualizar`, unidad);
    }

    deshabilitarUnidad(id: number,
                       estatus: boolean): Observable<ResponseData<void>> {
        return this.http.put<ResponseData<void>>(`${this.apiUrl}/unidades/estatus/${id}/${estatus}`, {});
    }

    eliminarUnidad(id: number): Observable<ResponseData<void>> {
        return this.http.delete<ResponseData<void>>(`${this.apiUrl}/unidades/${id}`);
    }

    filtrar(params) {
        return this.http.get<ResponseData<Unidad[]>>(`${this.apiUrl}/unidades/filtro`, {params});
    }


}

export interface FiltroUnidad {
    supervisorId?: number;
    zonaId?: number;
    activo?: boolean;
}
