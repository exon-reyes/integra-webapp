import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import {
    DashboardGestionSolicitudResponse,
    DashboardVacacion,
    Festivo,
    GestionSolicitudResponse,
    SolicitudesGestionDTO,
    SolicitudVacacionRequest,
    DetalleSolicitudDTO,
    NuevoEstatusSolicitud
} from '../models/vacacion.model';
import { environment } from "@env/environment";
import { ResponseData } from "@/core/responseData";
import { PaginatedResponse } from "@/core/services/usuario/paginated-response.interface";

export interface EmpleadoTiempoHistorialDTO {
    id: number;
    empleadoTiempoId: number;
    tipoEvento: string;
    fechaEvento: string;
    usuarioId: number;
    comentario: string;
}

@Injectable({ providedIn: 'root' })
export class VacacionService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.integraApi}/vacaciones`;

    getDashboard(empleadoId: number, anio: number): Observable<ResponseData<DashboardVacacion>> {
        return this.http.get<ResponseData<DashboardVacacion>>(`${this.baseUrl}/dashboard`, {
            params: new HttpParams()
                .set('empleadoId', empleadoId)
                .set('anio', anio),
        });
    }

    crearSolicitud(request: SolicitudVacacionRequest): Observable<ResponseData<void>> {
        return this.http.post<ResponseData<void>>(`${this.baseUrl}/solicitud`, request);
    }

    getLineaTiempo(id: number): Observable<ResponseData<EmpleadoTiempoHistorialDTO[]>> {
        return this.http.get<ResponseData<EmpleadoTiempoHistorialDTO[]>>(`${this.baseUrl}/solicitudes/${id}/timeline`);
    }
}

@Injectable({ providedIn: 'root' })
export class VacacionAdminService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.integraApi}/vacaciones`;

    getFestivos(anio): Observable<ResponseData<Festivo[]>> {
        return this.http.get<ResponseData<Festivo[]>>(`${this.baseUrl}/calendario-festivo`, { params: { anio: anio } });
    }


    cancelarSolicitud(id: number,
        usuarioId: number,tipo:string) {
        return this.http.patch<ResponseData<void>>(`${this.baseUrl}/gestion/${id}/cancelar`, null, { params: { usuarioId: usuarioId, tipo:tipo } })
    }
    eliminarSolicitud(id){
        return this.http.delete<ResponseData<void>>(`${this.baseUrl}/gestion/${id}`);
    }

    getSolicitudesGestion(): Observable<ResponseData<GestionSolicitudResponse[]>> {
        return this.http.get<ResponseData<GestionSolicitudResponse[]>>(`${this.baseUrl}/gestion/dashboard`);
    }

    getDashboardGestionIndicadores(): Observable<ResponseData<DashboardGestionSolicitudResponse>> {
        return this.http.get<ResponseData<DashboardGestionSolicitudResponse>>(`${this.baseUrl}/gestion/dashboard/indicadores`);
    }

    getSolicitudesFiltradas(filtro): Observable<PaginatedResponse<SolicitudesGestionDTO>> {
        return this.http.get<any>(`${this.baseUrl}/gestion/solicitudes`, { params: filtro });
    }

    obtenerDetallesSolicitud(folio: number): Observable<ResponseData<DetalleSolicitudDTO>> {
        return this.http.get<ResponseData<DetalleSolicitudDTO>>(`${this.baseUrl}/gestion/solicitudes/${folio}`);
    }

    actualizarEstatusSolicitud(request: NuevoEstatusSolicitud): Observable<ResponseData<void>> {
        return this.http.patch<ResponseData<void>>(`${this.baseUrl}/gestion/solicitudes`, request);
    }

    actualizarEstatusSolicitudGranular(request: NuevoEstatusSolicitud): Observable<ResponseData<void>> {
        return this.http.patch<ResponseData<void>>(`${this.baseUrl}/gestion/solicitudes/dias`, request);
    }

    exportarValoresActuales(): Observable<Blob> {
        return this.http.get(`${this.baseUrl}/exportar`, {
            responseType: 'blob'
        });
    }

    exportarPapeleta(folio: number, salarioDiario: number, diasAdicionales: number): Observable<Blob> {
        const params = new HttpParams()
            .set('salarioDiario', salarioDiario)
            .set('diasAdicionales', diasAdicionales);

        return this.http.get(`${this.baseUrl}/exportar/solicitudes/${folio}/papeleta`, {
            params,
            responseType: 'blob'
        });
    }
}
