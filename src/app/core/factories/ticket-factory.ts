import {SeguimientoCreateCmd} from '@/models/reporte/request/seguimiento-create.cmd';
import {ImagenCompressionService} from '@/shared/service/imagen-compression.service';
import {TicketRequestBuilder} from '@/core/factories/TicketRequestBuilder';
import {Injectable} from '@angular/core';
import {CrearTicketRequest} from '@/models/reporte/request/crear-ticket.request';

@Injectable({
    providedIn: 'root',
})
export class TicketFactory {
    constructor(private imageService: ImagenCompressionService) {
    }

    async crearTicketRequest(data: any): Promise<CrearTicketRequest> {
        const builder=new TicketRequestBuilder(this.imageService);
        await builder
            .withUnidad(data.unidad)
            .withArea(data.area)
            .withReporte(data.reporte)
            .withEstatus(data.estatus)
            .withAgente(data.agente)
            .withDepartamentoGenera(data.idDepartamentoGenera)
            .withFolio(data.folio)
            .withChecklist(data.checklist)
            .withDescripcion(data.descripcion);

        return builder.build();
    }

    generarRequestPublicar(idTicket: number,
                           idEstatus: string): SeguimientoCreateCmd {
        return {
            idTicket,
            descripcion: 'Se ha publicado el reporte',
            estatus: idEstatus,
            agente: 'Sistema',
        };
    }

    async seguimientoDataRequest(ticket,
                                 {estatus, agente, descripcion}) {
        const desc=descripcion ? await this.imageService.comprimirImagenesEnHtml(descripcion) : null;
        return {
            idTicket: ticket.id,
            agente,
            idEstatus: estatus.id,
            folio: ticket.folio,
            descripcion: desc,
        };
    }
}
