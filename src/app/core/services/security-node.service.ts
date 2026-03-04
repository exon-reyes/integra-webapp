import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {ResponseData} from "@/core/responseData";
import {environment} from "@env/environment";

export interface SecurityNodeDto {
    id: string;
    name: string;
    type: string;
    parentId?: string;
    orden: number;
    children: SecurityNodeDto[];
}

@Injectable({
    providedIn: 'root',
})
export class SecurityNodeService {
    private readonly apiUrl=`${environment.integraApi}/ui-node`;
    private readonly http=inject(HttpClient);

    obtenerEstructuraPermisos(): Observable<ResponseData<SecurityNodeDto[]>> {
        return this.http.get<ResponseData<SecurityNodeDto[]>>(`${this.apiUrl}/tree`);
    }
}
