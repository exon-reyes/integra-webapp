import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {ResponseData} from '@/core/responseData';
import {environment} from '@env/environment';
import {AbstractService} from '@/core/services/abstract-service';

export interface HorarioOperativoDto {
    idOperatividad: number;
    apertura: string;
    cierre: string;
    activo: boolean;
}

export interface GuardarHorariosRequest {
    idUnidad: number;
    horarios: HorarioOperativoDto[];
}

@Injectable({
    providedIn: 'root'
})
export class HorarioOperativoService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/operatividades/horarios`;

    constructor() {
        super();
    }

    guardarHorarios(request: GuardarHorariosRequest): Observable<ResponseData<any>> {
        return this.http.post<ResponseData<any>>(this.apiUrl, request);
    }
}
