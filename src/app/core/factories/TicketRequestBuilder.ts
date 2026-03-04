import {ImagenCompressionService} from '@/shared/service/imagen-compression.service';

export class TicketRequestBuilder {
    private request: any={};

    constructor(private imageService: ImagenCompressionService) {
    }

    withUnidad(unidad: any) {
        this.request.idUnidad=unidad?.id;
        return this;
    }

    withArea(area: any) {
        this.request.idArea=area?.id;
        this.request.idDepartamentoDestino=area?.idDepartamento;
        this.request.publicar=area?.externo ?? false;
        return this;
    }

    withReporte(reporte: any) {
        this.request.idReporte=reporte?.id;
        return this;
    }

    withEstatus(estatus: any) {
        this.request.idEstatus=estatus?.id;
        return this;
    }

    withAgente(agente: any) {
        this.request.agente=agente;
        return this;
    }

    async withDescripcion(descripcion: string | null) {
        if(descripcion) {
            this.request.descripcion= await this.imageService.comprimirImagenesEnHtml(descripcion);
        }
        return this;
    }

    withChecklist(checklist: any) {
        if(checklist) this.request.checklist=checklist;
        return this;
    }

    withDepartamentoGenera(idDepartamentoGenera: number | null) {
        if(idDepartamentoGenera) this.request.idDepartamentoGenera=idDepartamentoGenera;
        return this;
    }

    withFolio(folio: string | null) {
        if(folio) this.request.folio=folio;
        return this;
    }

    build() {
        return {...this.request};
    }
}
