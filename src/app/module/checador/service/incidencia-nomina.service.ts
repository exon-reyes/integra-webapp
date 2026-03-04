import {Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {AbstractService} from '@/core/services/abstract-service';
import {ResponseData} from '@/core/responseData';

export interface FiltroConsultaIncidenciaNomina {
    fechaInicio: string;
    fechaFin: string;
    unidadId?: number;
    supervisorId?: number;
    zonaId: number;
    empleadoId?: number;
}

export interface EmpleadoAsistencia {
    empleadoId: number;
    nombreCompleto: string;
    nombreUnidad: string;
    clave?: string;
    puesto: string;
    zona: string;
    supervisor: string;
    asistencias: number[];
}

export interface ReporteAsistenciaResponse {
    fechas: string[];
    empleados: EmpleadoAsistencia[];
}

@Injectable({
    providedIn: 'root',
})
export class IncidenciaNominaService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/asistencia/incidencia`;

    constructor() {
        super();
    }

    obtenerIncidenciasNomina(params: any) {
        return this.http.get<ResponseData<ReporteAsistenciaResponse>>(this.apiUrl, {params});
    }
}
