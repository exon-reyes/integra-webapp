import {finalize, Subject, takeUntil} from 'rxjs';
import {CrearTicketRequest} from '@/models/reporte/request/crear-ticket.request';
import {inject, Injectable, OnDestroy, signal} from '@angular/core';
import {TicketService} from '@/core/services/reporte/ticket.service';
import {Ticket} from '@/models/reporte/ticket';

@Injectable({
    providedIn: 'root',
})
export class RegistrarFormService implements OnDestroy {
    procesando=signal<boolean>(false);
    registrado=signal<boolean>(false);
    ticketSuccess=signal<Ticket>(null);

    private ticketService=inject(TicketService);
    private destroy$=new Subject<void>();

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();
    }

    guardar(command: CrearTicketRequest,
            archivo?: File) {
        this.procesando.set(true);

        let request$;

        if(archivo) {
            const formData=new FormData();

            // request como JSON real
            formData.append('request', new Blob([JSON.stringify(command)], {type: 'application/json'}));

            // archivo separado
            formData.append('archivo', archivo);

            request$=this.ticketService.registrarConArchivo(formData);
        } else {
            // si no hay archivo, enviamos JSON directo
            request$=this.ticketService.registrar(command);
        }

        request$
            .pipe(
                takeUntil(this.destroy$),
                finalize(() => this.procesando.set(false)),
            )
            .subscribe({
                next: (value) => {
                    this.ticketSuccess.set(value.data);
                    this.registrado.set(true);
                },
                error: () => {
                    this.registrado.set(false);
                },
            });
    }
}
