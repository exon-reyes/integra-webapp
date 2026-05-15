import {HttpClient} from '@angular/common/http';
import {inject, Injectable} from '@angular/core';
import {Observable, Subject} from 'rxjs';
import {distinctUntilChanged, switchMap, throttleTime} from 'rxjs/operators';
import {Empleado} from '@/core/services/checador/Empleado';
import {TipoPausa} from '@/core/services/checador/TipoPausa';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';

@Injectable({
    providedIn: 'root',
})
export class WorktimeService {
    private http = inject(HttpClient);
    private readonly apiUrl = `${environment.integraApi}/asistencia`;

    // Rate limiting subjects para prevenir saturación
    private readonly accionSubject = new Subject<{tipo: string; payload: FormData}>();

    constructor() {
        // Pipeline anti-saturación con throttleTime y switchMap
        this.accionSubject
            .pipe(
                throttleTime(1000), // Máximo 1 acción por segundo
                distinctUntilChanged((a, b) => a.tipo === b.tipo),
                switchMap(({tipo, payload}) => this.ejecutarAccion(tipo, payload)),
            )
            .subscribe();
    }

    consultarEmpleadoPorNip(nip: string): Observable<ResponseData<Empleado>> {
        return this.http.get<ResponseData<Empleado>>(`${this.apiUrl}/${nip}`);
    }

    consultarEmpleadoPorId(id: number): Observable<ResponseData<Empleado>> {
        return this.http.get<ResponseData<Empleado>>(`${this.apiUrl}/${id}/perfil`);
    }

    iniciarJornada(
        empleadoId: number,
        foto: Blob | null,
        unidadId: number,
        unidadAsignadaId: number,
    ): Observable<ResponseData<any>> {
        const form = this.buildFormData({empleadoId, unidadId, unidadAsignadaId}, foto);
        return this.enviarAccionProtegida('iniciar', form);
    }

    finalizarJornada(
        empleadoId: number,
        foto: Blob | null,
        unidadId: number,
        unidadAsignadaId: number,
    ): Observable<ResponseData<any>> {
        const form = this.buildFormData({empleadoId, unidadId, unidadAsignadaId}, foto);
        return this.enviarAccionProtegida('finalizar', form);
    }

    finalizarJornadaDeposito(
        empleadoId: number,
        foto: Blob | null,
        unidadId: number,
        unidadAsignadaId: number,
    ): Observable<ResponseData<any>> {
        const form = this.buildFormData({empleadoId, unidadId, unidadAsignadaId, finDeposito: true}, foto);
        return this.enviarAccionProtegida('finalizar', form);
    }

    iniciarPausa(
        empleadoId: number,
        tipoPausa: TipoPausa,
        foto: Blob | null,
        unidadId: number,
        unidadAsignadaId: number,
    ): Observable<ResponseData<any>> {
        const form = this.buildFormData({empleadoId, pausa: tipoPausa, unidadId, unidadAsignadaId}, foto);
        return this.enviarAccionProtegida('pausa/iniciar', form);
    }

    finalizarPausa(
        empleadoId: number,
        tipoPausa: TipoPausa,
        foto: Blob | null,
        unidadId: number,
        unidadAsignadaId: number,
    ): Observable<ResponseData<any>> {
        const form = this.buildFormData({empleadoId, pausa: tipoPausa, unidadId, unidadAsignadaId}, foto);
        return this.enviarAccionProtegida('pausa/finalizar', form);
    }

    /**
     * Registro manual de asistencia con soporte para fechas anteriores.
     * Permanece como JSON ya que no envía foto.
     */
    registroManual(registroData: {
        empleadoId: number;
        tipoAccion: 'iniciarJornada' | 'finalizarJornada' | 'finalizarJornadaDeposito' | 'iniciarPausa' | 'finalizarPausa';
        hora: string;
        pausa?: 'COMIDA' | 'OTRA';
        observaciones: string;
        unidadId: number;
        unidadAsignadaId?: number;
    }): Observable<ResponseData<any>> {
        const horaFormateada = registroData.hora.length === 5 ? `${registroData.hora}:00` : registroData.hora;
        const body = {
            empleadoId: registroData.empleadoId,
            tipoAccion: registroData.tipoAccion,
            hora: horaFormateada,
            pausa: registroData.pausa,
            observaciones: registroData.observaciones,
            unidadId: registroData.unidadId,
            unidadAsignadaId: registroData.unidadAsignadaId,
        };
        return this.http.post<ResponseData<any>>(`${this.apiUrl}/manual`, body);
    }

    /**
     * Construye el FormData con la parte JSON (datos) y la foto opcional (Blob binario).
     * Spring Boot deserializa "datos" como @RequestPart con @Valid RegistroDTO.
     */
    private buildFormData(datos: Record<string, unknown>, foto: Blob | null): FormData {
        const form = new FormData();
        form.append('datos', new Blob([JSON.stringify(datos)], {type: 'application/json'}));
        if (foto) {
            form.append('foto', foto, 'capture.jpg');
        }
        return form;
    }

    private enviarAccionProtegida(endpoint: string, body: FormData): Observable<ResponseData<any>> {
        return this.ejecutarAccion(endpoint, body);
    }

    private ejecutarAccion(endpoint: string, body: FormData): Observable<ResponseData<any>> {
        return this.http.post<ResponseData<any>>(`${this.apiUrl}/${endpoint}`, body);
    }
}
