import {inject, Injectable} from '@angular/core';
import {FiltroEmpleado} from "@/service/catalogo-empleado.service";
import {JWTService} from "@/core/security/JWTService";

@Injectable({
    providedIn: 'root',
})
export class EmpleadoSesionService {
    private readonly securityService=inject(JWTService);

    buildParams(supKey: string,
                empleadoKey): FiltroEmpleado {
        const empleadoId=this.securityService.getUser().employeeName.id
        //Si tiene permiso para supervisor, se trae todos los registros
        if(this.securityService.hasAuthority(supKey)) {
            return {idSupervisor: empleadoId, activos: true};
        } else if(this.securityService.hasAuthority(empleadoKey)) {
            //Si tiene permiso para ver solo empleados a su responsabilidad, se filtra por responsable
            return {idResponsable: empleadoId, activos: true};
        } else {
            // Si es personal con privilegios globales, se trae todo el catalago de empledos
            return {activos: true};
        }
    }
}
