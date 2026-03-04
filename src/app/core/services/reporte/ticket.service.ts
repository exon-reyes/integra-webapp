import {inject, Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';
import {Ticket} from '@/models/reporte/ticket';
import {CrearTicketRequest} from '@/models/reporte/request/crear-ticket.request';
import {Seguimiento} from '@/models/reporte/seguimiento';
import {Checklist} from '@/models/checklist/checklist';
import {Observable, of} from 'rxjs';
import {catchError, map} from 'rxjs/operators';
import {TicketCount} from '@/models/reporte/TicketCount';
import {HttpClient} from '@angular/common/http';

interface DetallesCompletos {
    ticket: Ticket;
    seguimientos: Seguimiento[];
    checklist: Checklist;
}

@Injectable({
    providedIn: 'root',
})
export class TicketService {
    protected http=inject(HttpClient);
    private readonly apiUrl=`${environment.integraApi}`;

    constructor() {
    }

    obtenerGenerales(params?: any) {
        return this.http.get<ResponseData<Ticket[]>>(`${this.apiUrl}/tickets`, {params: params});
    }

    registrar(ticketCreateRequest: CrearTicketRequest) {
        return this.http.post<ResponseData<Ticket>>(this.apiUrl + '/tickets', ticketCreateRequest);
    }

    registrarConArchivo(formData: FormData) {
        return this.http.post<ResponseData<Ticket>>(this.apiUrl + '/tickets/con-archivo', formData);
    }

    obtenerDetalles(folio: string) {
        return this.http.get<ResponseData<Ticket>>(`${this.apiUrl}/tickets/detalles`, {params: {folio}});
    }

    obtenerDetallesCompletos(folio: string) {
        return this.http.get<ResponseData<DetallesCompletos>>(`${this.apiUrl}/tickets/detalles-completos`, {params: {folio}});
    }

    obtenerHistorial(id: number) {
        return this.http.get<ResponseData<Seguimiento[]>>(`${this.apiUrl}/tickets/${id}/seguimiento`);
    }

    agregarSeguimiento(params) {
        return this.http.post<ResponseData<void>>(`${this.apiUrl}/tickets/seguimiento`, params);
    }

    agregarSeguimientoConArchivo(formData: FormData) {
        return this.http.post<ResponseData<void>>(`${this.apiUrl}/tickets/seguimiento/con-archivo`, formData);
    }

    publicar(idTicket: number,
             value: boolean) {
        return this.http.put<ResponseData<void>>(`${this.apiUrl}/tickets/publicar`, {
            idTicket: idTicket,
            publicar: value,
        });
    }

    checkFolio(folio: string): Observable<boolean> {
        return this.http
            .get<{
                data: boolean;
            }>(`${this.apiUrl}/tickets/${folio}/existe`)
            .pipe(
                map((response) => response.data), // Extrae el valor de 'data'
                catchError(() => of(false)), // Devuelve false en caso de error
            );
    }

    obtenerIndicadores(ID_DEPARTAMENTO: number) {
        return this.http.get<ResponseData<TicketCount>>(`${this.apiUrl}/tickets/${ID_DEPARTAMENTO}/stats`);
    }
}
