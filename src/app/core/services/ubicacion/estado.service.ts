import {Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {HttpClient} from '@angular/common/http';
import {ResponseData} from '@/core/responseData';
import {Estado} from '@/models/ubicacion/estado';
import {of, tap} from 'rxjs';

@Injectable({
    providedIn: 'root',
})
export class EstadoService {
    private readonly apiUrl=`${environment.integraApi}/estados`;
    private data!: ResponseData<Estado[]>;

    constructor(private httpClient: HttpClient) {
    }

    obtenerEstados() {
        if(this.data) {
            return of(this.data);
        } else {
            return this.httpClient.get<ResponseData<Estado[]>>(`${this.apiUrl}`).pipe(tap((data) => (this.data=data)));
        }
    }
}
