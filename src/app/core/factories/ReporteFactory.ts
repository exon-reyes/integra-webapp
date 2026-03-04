import {ImagenCompressionService} from '@/shared/service/imagen-compression.service';
import {Injectable} from '@angular/core';
import {Unidad} from '@/models/empresa/unidad';
import {Area} from '@/models/area/area';
import {Reporte} from '@/models/reporte/reporte';

export interface ReporteCreateRequest {
    idUnidad: number;
    folio: string;
    idArea: number;
    idReporte: number;
    idEstatus: number;
    agente: string;
    descripcion: string;
    publicar: boolean;
    checklist: string;
    idDepartamentoGenera: number;
    archivo: File;
}

@Injectable({
    providedIn: 'root',
})
export class ReporteFactory {
    constructor(private imageService: ImagenCompressionService) {
    }

    async crearReporteRequest(area: Area,
                              reporte: Reporte,
                              unidad: Unidad,
                              agente: string,
                              descripcion: string,
                              checklist: string,
                              idDepartamentoGenera: number,
                              archivo: File): Promise<ReporteCreateRequest> {
        let publicar=area.externo ?? false;
        if(descripcion) {
            descripcion= await this.imageService.comprimirImagenesEnHtml(descripcion);
        }
        let reporteRequest: ReporteCreateRequest={
            idUnidad: unidad.id,
            folio: '',
            idArea: area.id,
            idReporte: reporte.id,
            idEstatus: 1,
            agente: agente,
            descripcion: descripcion,
            checklist: checklist,
            idDepartamentoGenera: idDepartamentoGenera,
            archivo: archivo,
            publicar: publicar,
        };
        if(checklist) {
            reporteRequest.checklist=checklist;
        }
        return reporteRequest;
    }
}
