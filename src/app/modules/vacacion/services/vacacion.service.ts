import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DashboardVacacion, Festivo, SolicitudVacacionRequest } from '../models/vacacion.model';
import { environment } from "@env/environment";
import { ResponseData } from "@/core/responseData";

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

    getDashboard(empleadoId: number): Observable<ResponseData<DashboardVacacion>> {
        return this.http.get<ResponseData<DashboardVacacion>>(`${this.baseUrl}/dashboard`, {
            params: new HttpParams().set('empleadoId', empleadoId),
        });
    }

    crearSolicitud(empleadoId: number,
        request: SolicitudVacacionRequest): Observable<ResponseData<void>> {
        return this.http.post<ResponseData<void>>(`${this.baseUrl}/solicitud`, request, {
            params: new HttpParams().set('empleadoId', empleadoId),
        });
    }

    getLineaTiempo(id: number): Observable<ResponseData<EmpleadoTiempoHistorialDTO[]>> {
        return this.http.get<ResponseData<EmpleadoTiempoHistorialDTO[]>>(`${this.baseUrl}/solicitudes/${id}/timeline`);
    }

    //
    // getDiasDisponibles(empleadoId: number): Observable<number> {
    //     return this.http.get<number>(`${this.baseUrl}/disponibles`, {
    //         params: new HttpParams().set('empleadoId', empleadoId),
    //     });
    // }
    //
    // crearSolicitud(empleadoId: number,
    //                request: SolicitudVacacionRequest): Observable<ResponseData<void>> {
    //     return this.http.post<ResponseData<void>>(`${this.baseUrl}/solicitud`, request, {
    //         params: new HttpParams().set('empleadoId', empleadoId),
    //     });
    // }
    //
    // getHistorial(empleadoId: number): Observable<SolicitudVacacion[]> {
    //     return this.http.get<SolicitudVacacion[]>(`${this.baseUrl}/solicitudes`, {
    //         params: new HttpParams().set('empleadoId', empleadoId),
    //     });
    // }
    //
    // getSolicitud(id: number): Observable<SolicitudVacacion> {
    //     return this.http.get<SolicitudVacacion>(`${this.baseUrl}/solicitudes/${id}`);
    // }
    //
    // cancelarSolicitud(id: number,
    //                   empleadoId: number): Observable<void> {
    //     return this.http.delete<void>(`${this.baseUrl}/solicitudes/${id}`, {
    //         params: new HttpParams().set('empleadoId', empleadoId),
    //     });
    // }
    //
    // getCalendarioEquipo(empleadoId: number): Observable<CalendarioEquipo[]> {
    //     return this.http.get<CalendarioEquipo[]>(`${this.baseUrl}/calendario-equipo`, {
    //         params: new HttpParams().set('empleadoId', empleadoId),
    //     });
    // }
    //
    // calcularDias(empleadoId: number,
    //              inicio: string,
    //              fin: string): Observable<CalculoDias> {
    //     return this.http.post<CalculoDias>(`${this.baseUrl}/calcular-dias?empleadoId=${empleadoId}&inicio=${inicio}&fin=${fin}`, {});
    // }
    //
    // getPendientesAprobacion(gestorId: number): Observable<SolicitudVacacion[]> {
    //     return this.http.get<SolicitudVacacion[]>(`${this.baseUrl}/aprobacion/pendientes`, {
    //         params: new HttpParams().set('gestorId', gestorId),
    //     });
    // }
    //
    // aprobarSolicitud(id: number,
    //                  gestorId: number): Observable<SolicitudVacacion> {
    //     return this.http.post<SolicitudVacacion>(`${this.baseUrl}/aprobacion/${id}/aprobar?gestorId=${gestorId}`, {});
    // }
    //
    // rechazarSolicitud(id: number,
    //                   gestorId: number,
    //                   request: AprobacionRequest): Observable<SolicitudVacacion> {
    //     return this.http.post<SolicitudVacacion>(`${this.baseUrl}/aprobacion/${id}/rechazar?gestorId=${gestorId}`, request);
    // }
    //
    // getConfiguracionDescansos(empleadoId: number): Observable<ConfiguracionDescanso> {
    //     return this.http.get<ConfiguracionDescanso>(`${this.baseUrl}/descansos`, {
    //         params: new HttpParams().set('empleadoId', empleadoId),
    //     });
    // }
    //
    // configurarDescansos(empleadoId: number,
    //                     request: ConfiguracionDescansoRequest): Observable<ConfiguracionDescanso> {
    //     return this.http.post<ConfiguracionDescanso>(`${this.baseUrl}/descansos?empleadoId=${empleadoId}`, request);
    // }
    //
    // eliminarDescanso(descansoId: number,
    //                  empleadoId: number): Observable<void> {
    //     return this.http.delete<void>(`${this.baseUrl}/descansos/${descansoId}?empleadoId=${empleadoId}`);
    // }
}

@Injectable({ providedIn: 'root' })
export class VacacionAdminService {
    private readonly http = inject(HttpClient);
    private readonly baseUrl = `${environment.integraApi}/vacaciones`;

    getFestivos(anio): Observable<ResponseData<Festivo[]>> {
        return this.http.get<ResponseData<Festivo[]>>(`${this.baseUrl}/calendario-festivo`, { params: { anio: anio } });
    }

    crearFestivo(request: { fecha: string; descripcion: string }): Observable<Festivo> {
        return this.http.post<Festivo>(`${this.baseUrl}/festivos`, request);
    }

    actualizarFestivo(id: number,
        request: { fecha: string; descripcion: string }): Observable<Festivo> {
        return this.http.put<Festivo>(`${this.baseUrl}/festivos/${id}`, request);
    }

    eliminarFestivo(id: number): Observable<void> {
        return this.http.delete<void>(`${this.baseUrl}/festivos/${id}`);
    }


    cancelarSolicitudVacaciones(id: number, usuarioId: number) {
        return this.http.patch<ResponseData<void>>(`${this.baseUrl}/${id}/cancelar`, null, { params: { usuarioId: usuarioId } })
    }

    cancelarDescanso(id: number,
        usuarioCancelaId: number) {
        return this.http.delete<ResponseData<void>>(`${this.baseUrl}/descansos/${id}`, { params: { usuarioId: usuarioCancelaId } })
    }

    reactivarSolicitud(id: number, usuarioId: number) {
        return this.http.patch<ResponseData<void>>(`${this.baseUrl}/${id}/reactivar`, null, { params: { usuarioId } });
    }

    getPoliticas(): Observable<any[]> {
        return this.http.get<any[]>(`${this.baseUrl}/politicas`);
    }

    generarPeriodos(): Observable<{ mensaje: string }> {
        return this.http.post<{ mensaje: string }>(`${this.baseUrl}/generar-periodos`, {});
    }
}
