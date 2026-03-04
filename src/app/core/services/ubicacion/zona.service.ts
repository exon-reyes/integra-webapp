import {Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {of, tap} from 'rxjs';
import {ResponseData} from '@/core/responseData';
import {Zona} from '@/models/ubicacion/zona';

@Injectable({
    providedIn: 'root',
})
export class ZonaService {
    private readonly apiUrl=`${environment.integraApi}/zonas`;
    private readonly header: HttpHeaders;
    private data!: ResponseData<Zona[]>;

    constructor(private httpClient: HttpClient) {
        this.header=new HttpHeaders({'Content-Type': 'application/json'});
    }

    obtenerZonas() {
        if(this.data) {
            return of(this.data);
        } else {
            return this.httpClient.get<ResponseData<Zona[]>>(`${this.apiUrl}`, {headers: this.header}).pipe(tap((data) => (this.data=data)));
        }
    }

    actualizarZona(param: { id: number; nombre: string; activo: boolean }) {
        return this.httpClient.put<ResponseData<void>>(`${this.apiUrl}`, param, {headers: this.header}).pipe(tap(() => (this.data=undefined as any)));
    }

    registrarZona(param: { nombre: string }) {
        return this.httpClient.post<ResponseData<void>>(`${this.apiUrl}`, param, {headers: this.header}).pipe(tap(() => (this.data=undefined as any)));
    }

    eliminarZona(id: number) {
        return this.httpClient.delete<ResponseData<void>>(`${this.apiUrl}/${id}`).pipe(tap(() => (this.data=undefined as any)));
    }
}
