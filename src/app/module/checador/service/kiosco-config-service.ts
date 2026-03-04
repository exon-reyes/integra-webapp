import {Injectable} from '@angular/core';
import {AbstractService} from '@/core/services/abstract-service';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';
import {HttpParams} from '@angular/common/http';
import {Unidad} from '@/models/empresa/unidad';

@Injectable({
    providedIn: 'root',
})
export class KioscoConfigService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/kioscos`;

    constructor() {
        super();
    }

    obtenerUnidadesKiosco() {
        return this.http.get<ResponseData<Unidad[]>>(this.apiUrl);
    }

    actualizarUsoCamara(id: number,
                        estatus: boolean) {
        const params=new HttpParams().set('estatus', estatus.toString());
        return this.http.patch<ResponseData<void>>(`${this.apiUrl}/${id}/camara`, {}, {params});
    }

    obtenerUnidadKiosco(id: number) {
        return this.http.get<ResponseData<Unidad>>(`${this.apiUrl}/${id}`);
    }

    solicitarCodigo(id: number) {
        return this.http.patch<ResponseData<void>>(`${this.apiUrl}/${id}/requiere-codigo`, {});
    }

    generarCodigoConfigUnSoloUso(id: number) {
        return this.http.patch<ResponseData<string>>(`${this.apiUrl}/${id}/codigo`, {});
    }

    cancelarCodigo(id: number) {
        return this.http.delete<ResponseData<void>>(`${this.apiUrl}/${id}/requiere-codigo`, {});
    }

    usarCodigoConfiguracion(id: number,
                            codigo: string) {
        return this.http.post<ResponseData<void>>(`${this.apiUrl}/${id}/codigos/${codigo}/usar`, {});
    }

    actualizarCompensacion(id: number,
                           compensacion: string) {
        const params=new HttpParams().set('compensacion', compensacion);
        return this.http.patch<ResponseData<void>>(`${this.apiUrl}/${id}/compensacion`, {}, {params});
    }

    actualizarTiempoCapturaFoto(tiempo: number) {
        const params=new HttpParams().set('tiempoEspera', tiempo);
        return this.http.patch<ResponseData<void>>(`${this.apiUrl}/tiempo-captura`, {}, {params});
    }

    obtenerTiempoCapturaFoto() {
        return this.http.get<ResponseData<number>>(`${this.apiUrl}/tiempo-captura`);
    }
}
