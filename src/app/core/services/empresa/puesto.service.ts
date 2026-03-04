import {Injectable} from '@angular/core';
import {AbstractService} from '@/core/services/abstract-service';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';
import {Observable} from 'rxjs';
import {Puesto} from '@/models/empresa/puesto';

@Injectable({
    providedIn: 'root',
})
export class PuestoService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/puestos`;

    constructor() {
        super();
    }

    obtenerPuestos(): Observable<ResponseData<Puesto[]>> {
        return this.http.get<ResponseData<Puesto[]>>(`${this.apiUrl}`);
    }
}
