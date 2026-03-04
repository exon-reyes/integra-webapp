import {Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';
import {AbstractService} from '@/core/services/abstract-service';
import {Observable} from 'rxjs';


export interface ParamsDTO {
    idPuestoNocturno?: number;
    horaInicioNocturno?: string; // formato HH:mm:ss o HH:mm
    defaultRolUsuarioNuevo?: string;
    idPuestoSupervisor?: number;
    idUsuarioAdmin?: number;
}

@Injectable({
    providedIn: 'root',
})
export class SystemValueService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/system-values`;

    obtenerVariablesSistema(): Observable<ResponseData<ParamsDTO>> {
        return this.http.get<ResponseData<ParamsDTO>>(this.apiUrl);
    }
}
