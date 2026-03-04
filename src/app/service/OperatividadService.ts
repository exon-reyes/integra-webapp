import {Injectable} from '@angular/core';
import {environment} from "@env/environment";
import {HttpClient} from "@angular/common/http";
import {ResponseData} from "@/core/responseData";
import {Operatividad} from "@/models/empresa/operatividad";

@Injectable({
    providedIn: 'root',
})
export class OperatividadService {
    private readonly apiUrl=`${environment.integraApi}/operatividades`;

    constructor(private readonly http: HttpClient) {
    }

    obtenerOperatividades() {
        return this.http.get<ResponseData<Operatividad[]>>(`${this.apiUrl}`);
    }
}
