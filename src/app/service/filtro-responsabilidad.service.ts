import {inject, Injectable} from '@angular/core';
import {JWTService} from "@/core/security/JWTService";

export interface FiltroResponsabilidad {
    /**
     * Id del supervisor al que se filtra la consulta.
     * Se incluye solo cuando el usuario tiene el permiso
     * `CONSULTAR_SUPERVISOR`.
     */
    supervisorId?: number;

    /**
     * Id del responsable (colaborador asignado) al que se filtra la consulta.
     * Se incluye solo cuando el usuario tiene el permiso
     * `CONSULTAR_EMPLEADOS_ASIGNADOS` y no posee el permiso de supervisor.
     */
    responsableId?: number;
}

@Injectable({
    providedIn: 'root',
})
export class FiltroResponsabilidadService {

    private readonly sessionService=inject(JWTService);

    obtenerFiltro(keySupervisor: string,
                  keyResponsable: string): FiltroResponsabilidad {
        const userId=this.sessionService.getUser().employeeName.id;

        const filtro: FiltroResponsabilidad={};

        if(this.sessionService.hasAuthority(keySupervisor)) {
            filtro.supervisorId=userId;
        } else if(this.sessionService.hasAuthority(keyResponsable)) {
            filtro.responsableId=userId;
        }
        return filtro;
    }

    supRestringido(keySup: string) {
        return this.sessionService.hasAuthority(keySup);
    }
}
