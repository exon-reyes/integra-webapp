import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';

export interface CompensacionReporteQuery {
    clave: string;
    colaborador: string;
    unidad: string;
    fecha: string | Date; // LocalDate llega como ISO string "2026-01-27"
    horaSalida: string;    // LocalTime llega como "09:30:00"
    horasTrabajadas: string;
    horasFaltantes: string;
    tiempoCompensado: string;
}

export interface EmpleadoReporteRequest {
    empleadoId?: number;
    desde?: string;
    hasta?: string;
    unidadId?: number;
    supervisorId?: number;
    zonaId?: number;
    puestoId?: number;
}

@Injectable({
    providedIn: 'root',
})
export class CompensacionService {
    private http=inject(HttpClient);
    private readonly apiUrl=`${environment.integraApi}/opentime/compensaciones`;

    obtenerCompensaciones(params) {
        return this.http.get<ResponseData<CompensacionReporteQuery[]>>(this.apiUrl, {params});
    }

    descargarExcel(params?: EmpleadoReporteRequest) {
        return this.http.get(`${this.apiUrl}/excel`, {
            responseType: 'blob',
            params: params as any,
        });
    }
}
