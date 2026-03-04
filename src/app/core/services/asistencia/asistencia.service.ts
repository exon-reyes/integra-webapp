import {inject, Injectable} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';
import {Puesto} from '@/models/empresa/puesto';

// --------------------------------------
// Interfaces de tu modelo
// --------------------------------------
export interface Empleado {
    id: number;
    codigo: string;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
}

export interface Unidad {
    clave: string;
    nombre: string;
}

export interface Pausa {
    id: number;
    inicio: string;
    fin?: string;
    tipoPausa: string;
    duracion?: {
        minutos: number;
        horas: number;
        minutosRestantes: number;
    };
    pathFotoInicio?: string;
    pathFotoFin?: string;
}

export interface Asistencia {
    id: number;
    fecha: string;
    inicioJornada: string;
    finJornada?: string;
    jornadaCerrada: boolean;
    cerradoAutomatico?: boolean;
    tiempoCompensado?: string;
    pausas: Pausa[];
    pathFotoFin?: string;
    pathFotoInicio?: string;
    diferencia8HorasTrabajadasFormateada?: string;
    fueAsistenciaNocturna?: boolean;
    comentario?: string;
    inconsistencia?: boolean;
    horasNetasTrabajadas: {
        minutos: number;
        horas: number;
        minutosRestantes: number;
    };
    horasBrutasTrabajadas?: {
        minutos: number;
        horas: number;
        minutosRestantes: number;
    };
    totalPausas?: {
        minutos: number;
        horas: number;
        minutosRestantes: number;
    };
    totalPausaComida?: {
        minutos: number;
        horas: number;
        minutosRestantes: number;
    };
    totalOtrasPausas?: {
        minutos: number;
        horas: number;
        minutosRestantes: number;
    };
    horasExtras?: {
        minutos: number;
        horas: number;
        minutosRestantes: number;
    };
    horasExtrasNetas?: number;
    tiempoCalculado?: string;
    diferenciaCalculada?: {
        texto: string;
        clase: string;
    };
}

export interface ResumenMesAsistencia {
    diasLaborados: number;
    diasNoLaborados: number;
    nombreMes: string;
    anio: number;
    diasHabilesMes: number;
}

export interface EmpleadoReporte {
    id: number;
    empleado: Empleado;
    unidad: Unidad;
    puesto: Puesto;
    asistencias: Asistencia[];
    jornadaAbierta?: boolean;
    sumatoriaTiempoTrabajado: number;
    sumatoriaTiempoExtras: number;
}

export interface EmpleadoReporteRequest {
    empleadoId?: number;
    desde?: string;
    hasta?: string;
    unidadId?: number;
    zonaId?: number;
    empleadoResponsableId?: number;
    supervisorId?: number;
    diasTrabajados?: number;
    puestoId?: number;
}

// --------------------------------------
// INTERFACES PARA ASISTENCIA MANUAL
// --------------------------------------
export interface RegistroRequest {
    empleadoId: number;
    unidadId: number;
    unidadAsignadaId?: number;
    foto?: string;
    hora?: string;
    finDeposito?: string;
    pausa?: string;
}

// --------------------------------------
// SERVICE
// --------------------------------------
@Injectable({
    providedIn: 'root',
})
export class AsistenciaService {

    private http=inject(HttpClient);
    private readonly apiUrl=`${environment.integraApi}/asistencia`;
    private readonly apiUrlReporte=`${environment.integraApi}/asistencia/reporte`;

    get apiUrlImagen(): string {
        return this.apiUrlReporte;
    }

    // --------------------------------------
    // CONSULTAS

    obtenerResumenMes(params) {
        return this.http.get<ResponseData<ResumenMesAsistencia>>(
            `${this.apiUrlReporte}/resumen-mes`, {params});
    }

    /** Backend devuelve fechas como strings "yyyy-MM-dd"; convierte a Date[] en el componente si hace falta. */
    obtenerDiasLaborados(params: { empleadoId: number; anio: number; mes: number }) {
        return this.http.get<ResponseData<string[]>>(
            `${this.apiUrlReporte}/dias-laborados`,
            {params},
        );
    }

    // --------------------------------------
    obtenerAsistencias(params: any) {
        return this.http.get<ResponseData<EmpleadoReporte[]>>(
            `${this.apiUrlReporte}/asistencias`,
            {params},
        );
    }

    obtenerInconsistencias(params?: any) {
        return this.http.get<ResponseData<any>>(
            `${this.apiUrlReporte}/inconsistencias`,
            {params},
        );
    }

    descargarExcel(params?: any) {
        return this.http.get(
            `${this.apiUrlReporte}/asistencias/detallado/excel`,
            {responseType: 'blob', params},
        );
    }

    calcularDiferenciaEnMomento(asistencia: any): { texto: string; clase: string } {
        if(asistencia.jornadaCerrada) {
            return {
                texto: asistencia.diferencia8HorasTrabajadasFormateada,
                clase: asistencia.diferencia8HorasTrabajadasFormateada.includes('-') ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800',
            };
        }

        const ahora=new Date();
        const inicio=new Date(asistencia.inicioJornada);
        const tiempoTranscurrido=ahora.getTime() - inicio.getTime();

        let tiempoPausas=0;
        asistencia.pausas.forEach((pausa: any) => {
            if(pausa.fin) {
                const inicioPausa=new Date(pausa.inicio);
                const finPausa=new Date(pausa.fin);
                tiempoPausas+=finPausa.getTime() - inicioPausa.getTime();
            }
        });

        const tiempoNeto=tiempoTranscurrido - tiempoPausas;
        const totalMinutos=Math.floor(tiempoNeto / (1000 * 60));
        const diferencia=totalMinutos - 480;

        if(diferencia>=0) {
            const horas=Math.floor(diferencia / 60);
            const mins=diferencia % 60;
            return {
                texto: `+${horas}h ${mins}m`, clase: 'bg-green-100 text-green-800',
            };
        } else {
            const horas=Math.floor(Math.abs(diferencia) / 60);
            const mins=Math.abs(diferencia) % 60;
            return {
                texto: `-${horas}h ${mins}m`, clase: 'bg-red-100 text-red-800',
            };
        }
    }

    // --------------------------------------
    // MÉTODOS DEL BACKEND DE ASISTENCIA MANUAL
    // --------------------------------------

    iniciarJornada(body: RegistroRequest) {
        return this.http.post<ResponseData<any>>(
            `${this.apiUrl}/iniciar`,
            body,
        );
    }

    calcularTiempoEnMomento(asistencia: any): string {
        if(asistencia.jornadaCerrada) {
            return `${asistencia.horasNetasTrabajadas.horas}h ${asistencia.horasNetasTrabajadas.minutosRestantes}m`;
        }

        const ahora=new Date();
        const inicio=new Date(asistencia.inicioJornada);
        const tiempoTranscurrido=ahora.getTime() - inicio.getTime();

        let tiempoPausas=0;
        asistencia.pausas.forEach((pausa: any) => {
            if(pausa.fin) {
                const inicioPausa=new Date(pausa.inicio);
                const finPausa=new Date(pausa.fin);
                tiempoPausas+=finPausa.getTime() - inicioPausa.getTime();
            }
        });

        const tiempoNeto=tiempoTranscurrido - tiempoPausas;
        const horas=Math.floor(tiempoNeto / (1000 * 60 * 60));
        const minutos=Math.floor((tiempoNeto % (1000 * 60 * 60)) / (1000 * 60));

        return `${horas}h ${minutos}m (en curso)`;
    }


    actualizarJornada(body: { jornadaId: number; inicioJornada: string; finJornada?: string; comentario?: string }) {
        return this.http.put<ResponseData<any>>(
            `${this.apiUrl}/jornada`,
            body,
        );
    }

    actualizarPausa(body: { pausaId: number; inicio: string; fin?: string }) {
        return this.http.put<ResponseData<any>>(
            `${this.apiUrl}/pausa`,
            body,
        );
    }

    eliminarJornada(id: number) {
        return this.http.delete<ResponseData<any>>(
            `${this.apiUrl}/jornada/${id}`,
        );
    }

    eliminarPausa(id: number) {
        return this.http.delete<ResponseData<any>>(
            `${this.apiUrl}/pausa/${id}`,
        );
    }

    /**
     * Crear jornada completa (con inicio y fin) para fechas pasadas
     */
    /**
     * Crear jornada completa (con inicio y fin) para fechas pasadas
     */
    crearJornadaCompleta(data: {
        empleadoId: number;
        inicioJornada: string;
        finJornada: string;
        comentario?: string;
        unidadId: number;
    }) {
        return this.http.post<ResponseData<any>>(`${this.apiUrl}/jornada/completa`, data);
    }

    /**
     * Crear pausa completa (con inicio y fin)
     */
    registrarPausaCompleta(data: {
        empleadoId: number;
        inicio: string;
        fin: string;
        tipoPausa: string;
        unidadId: number;
    }) {
        return this.http.post<ResponseData<any>>(`${this.apiUrl}/pausa/completa`, data);
    }
}

