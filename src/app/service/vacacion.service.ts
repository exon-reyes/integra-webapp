import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  DashboardVacacion, 
  SolicitudVacacion, 
  SolicitudVacacionRequest, 
  CalculoDias,
  CalendarioEquipo,
  AprobacionRequest 
} from '../models/vacacion.model';

@Injectable({ providedIn: 'root' })
export class VacacionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/v1/vacaciones';

  getDashboard(empleadoId: number): Observable<DashboardVacacion> {
    return this.http.get<DashboardVacacion>(`${this.baseUrl}/dashboard`, {
      params: new HttpParams().set('empleadoId', empleadoId)
    });
  }

  getDiasDisponibles(empleadoId: number): Observable<number> {
    return this.http.get<number>(`${this.baseUrl}/disponibles`, {
      params: new HttpParams().set('empleadoId', empleadoId)
    });
  }

  crearSolicitud(empleadoId: number, request: SolicitudVacacionRequest): Observable<SolicitudVacacion> {
    return this.http.post<SolicitudVacacion>(`${this.baseUrl}/solicitudes?empleadoId=${empleadoId}`, request);
  }

  getHistorial(empleadoId: number): Observable<SolicitudVacacion[]> {
    return this.http.get<SolicitudVacacion[]>(`${this.baseUrl}/solicitudes`, {
      params: new HttpParams().set('empleadoId', empleadoId)
    });
  }

  getSolicitud(id: number): Observable<SolicitudVacacion> {
    return this.http.get<SolicitudVacacion>(`${this.baseUrl}/solicitudes/${id}`);
  }

  cancelarSolicitud(id: number, empleadoId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/solicitudes/${id}`, {
      params: new HttpParams().set('empleadoId', empleadoId)
    });
  }

  getCalendarioEquipo(empleadoId: number): Observable<CalendarioEquipo[]> {
    return this.http.get<CalendarioEquipo[]>(`${this.baseUrl}/calendario-equipo`, {
      params: new HttpParams().set('empleadoId', empleadoId)
    });
  }

  calcularDias(empleadoId: number, inicio: string, fin: string): Observable<CalculoDias> {
    return this.http.post<CalculoDias>(`${this.baseUrl}/calcular-dias?empleadoId=${empleadoId}&inicio=${inicio}&fin=${fin}`, {});
  }

  getPendientesAprobacion(gestorId: number): Observable<SolicitudVacacion[]> {
    return this.http.get<SolicitudVacacion[]>(`${this.baseUrl}/aprobacion/pendientes`, {
      params: new HttpParams().set('gestorId', gestorId)
    });
  }

  aprobarSolicitud(id: number, gestorId: number): Observable<SolicitudVacacion> {
    return this.http.post<SolicitudVacacion>(`${this.baseUrl}/aprobacion/${id}/aprobar?gestorId=${gestorId}`, {});
  }

  rechazarSolicitud(id: number, gestorId: number, request: AprobacionRequest): Observable<SolicitudVacacion> {
    return this.http.post<SolicitudVacacion>(`${this.baseUrl}/aprobacion/${id}/rechazar?gestorId=${gestorId}`, request);
  }
}
