import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';
import {Observacion} from '@/models/observacion/observacion';
import {Historial} from '@/models/observacion/historial';

@Injectable({
    providedIn: 'root',
})
export class ObservacionService {
    protected http=inject(HttpClient);
    private readonly apiUrl=`${environment.integraApi}/observacion`;

    constructor() {
    }

    obtenerPorFiltro(params?: any) {
        return this.http.get<ResponseData<Observacion[]>>(`${this.apiUrl}/observaciones`, {params: params});
    }

    obtenerOrigen(id: number) {
        return this.http.get<ResponseData<Observacion>>(`${this.apiUrl}/${id}/origen`);
    }

    obtenerResponsabilidad(id: number) {
        return this.http.get<ResponseData<Observacion>>(`${this.apiUrl}/${id}/responsabilidad`);
    }

    obtenerInfoDetallesPorId(id: number) {
        return this.http.get<ResponseData<Observacion>>(`${this.apiUrl}/${id}/detalles`);
    }

    actualizarEstado(id: number,
                     idEstatus) {
        return this.http.put(`${this.apiUrl}/${id}/estado`, null, {params: {idEstatus}});
    }

    agregarComentario(id: number,
                      comentario: string) {
        return this.http.post<ResponseData<any>>(`${this.apiUrl}/${id}/comentarios`, {comentario});
    }

    subirAdjunto(id: number,
                 archivo: File) {
        const formData=new FormData();
        formData.append('archivo', archivo);
        return this.http.post<ResponseData<any>>(`${this.apiUrl}/${id}/adjuntos`, formData);
    }

    visibleParaUnidad(id: number,
                      visible: boolean) {
        return this.http.put<ResponseData<any>>(`${this.apiUrl}/${id}/visible-unidad`, {visible});
    }

    obtenerHistorial(id: number) {
        return this.http.get<ResponseData<Historial[]>>(`${this.apiUrl}/${id}/historial`);
    }
}
