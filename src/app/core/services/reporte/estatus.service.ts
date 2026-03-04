import {Injectable} from '@angular/core';
import {HttpClient, HttpHeaders} from '@angular/common/http';
import {environment} from '@env/environment';
import {Observable, of, tap} from 'rxjs';
import {ResponseData} from '@/core/responseData';
import {Estatus} from '@/models/reporte/estatus';

@Injectable({
    providedIn: 'root',
})
export class EstatusService {
    private header: HttpHeaders;
    private readonly apiUrl: string=`${environment.integraApi}/estatus`;
    private estatusCache?: ResponseData<Estatus[]>;
    private cacheTimestamp?: number;
    private readonly cacheDurationMs=5 * 60 * 1000; // 5 minutos

    constructor(private httpClient: HttpClient) {
        this.loadStatusLocalStorage();
    }

    obtenerEstatus(): Observable<ResponseData<Estatus[]>> {
        const now=Date.now();
        if(this.estatusCache && this.cacheTimestamp && now - this.cacheTimestamp<this.cacheDurationMs) {
            return of(this.estatusCache);
        } else {
            return this.httpClient.get<ResponseData<Estatus[]>>(this.apiUrl).pipe(
                tap((data) => {
                    this.estatusCache=data;
                    this.cacheTimestamp=now;
                    localStorage.setItem('estatus', JSON.stringify(data));
                    localStorage.setItem('estatus_timestamp', now.toString());
                }),
            );
        }
    }

    private loadStatusLocalStorage() {
        const data=localStorage.getItem('estatus');
        const timestamp=localStorage.getItem('estatus_timestamp');
        if(data && timestamp) {
            this.estatusCache=JSON.parse(data);
            this.cacheTimestamp=parseInt(timestamp, 10);
        }
    }
}
