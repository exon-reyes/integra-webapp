import {inject, Injectable} from '@angular/core';
import {forkJoin, Observable, of} from 'rxjs';
import {JWTService} from '@/core/security/JWTService';
import {CatalogoEmpleado, CatalogoEmpleadoService, FiltroEmpleado} from '@/service/catalogo-empleado.service';
import {UnidadService} from '@/core/services/empresa/unidad.service';
import {Unidad} from '@/models/empresa/unidad';
import {ResponseData} from '@/core/responseData';

/**
 * Configuración de permisos para inicializar el contexto.
 * Cada módulo define sus propias claves de autoridad.
 */
export interface PermisosConsulta {
    keySupervisor: string;
    keyResponsable?: string;
}

/**
 * Resultado de la resolución de restricciones del usuario en sesión.
 */
export interface RestriccionUsuario {
    supervisorId?: number;
    responsableId?: number;
    tieneRestriccion: boolean;
    supRestringido: boolean;
}

/**
 * Servicio reutilizable que centraliza la lógica de filtrado por permisos.
 *
 * Resuelve:
 * - Si el usuario tiene restricción de supervisor → fuerza su ID como supervisorId
 * - Si tiene restricción de responsable → fuerza su ID como responsableId
 * - Si no tiene restricción → puede filtrar libremente por supervisor
 *
 * Carga los catálogos de empleados, unidades y supervisores
 * filtrados según la restricción detectada.
 */
@Injectable({providedIn: 'root'})
export class ContextoConsultaService {
    private readonly jwt=inject(JWTService);
    private readonly empleadoService=inject(CatalogoEmpleadoService);
    private readonly unidadService=inject(UnidadService);

    /**
     * Resuelve las restricciones del usuario en sesión según los permisos dados.
     */
    resolverRestriccion(permisos: PermisosConsulta): RestriccionUsuario {
        const userId=this.jwt.getUser().employeeName.id;
        const supRestringido=this.jwt.hasAuthority(permisos.keySupervisor);
        const responsableRestringido=permisos.keyResponsable
            ? this.jwt.hasAuthority(permisos.keyResponsable)
            : false;

        const restriccion: RestriccionUsuario={
            tieneRestriccion: supRestringido || responsableRestringido,
            supRestringido,
        };

        if(supRestringido) {
            restriccion.supervisorId=userId;
        } else if(responsableRestringido) {
            restriccion.responsableId=userId;
        }

        return restriccion;
    }

    /**
     * Carga los catálogos de empleados, unidades y supervisores
     * respetando las restricciones del usuario.
     */
    cargarCatalogos(restriccion: RestriccionUsuario): Observable<CatalogosConsulta> {
        const filtroEmpleado: FiltroEmpleado={activos: true};
        if(restriccion.supervisorId) filtroEmpleado.idSupervisor=restriccion.supervisorId;
        if(restriccion.responsableId) filtroEmpleado.idResponsable=restriccion.responsableId;

        const unidades$=restriccion.supRestringido
            ? this.unidadService.filtrar({supervisorId: restriccion.supervisorId})
            : this.unidadService.filtrar({activo: true});

        const supervisores$=restriccion.tieneRestriccion
            ? of({data: [] as CatalogoEmpleado[]} as ResponseData<CatalogoEmpleado[]>)
            : this.empleadoService.obtenerSupervisores();

        return forkJoin({
            empleados: this.empleadoService.obtenerEmpleados(filtroEmpleado),
            unidades: unidades$,
            supervisores: supervisores$,
        });
    }

    /**
     * Aplica las restricciones de supervisor/responsable a un objeto de parámetros.
     * Si el usuario está restringido, fuerza su ID.
     * Si no, usa el valor del filtro manual (supervisorId seleccionado por el usuario).
     */
    aplicarRestriccion<T extends Record<string, any>>(
        params: T,
        restriccion: RestriccionUsuario,
        filtroSupervisorManual?: number | null,
    ): T {
        if(restriccion.supRestringido) {
            (params as any).supervisorId=restriccion.supervisorId;
        } else if(filtroSupervisorManual) {
            (params as any).supervisorId=filtroSupervisorManual;
        }

        if(restriccion.responsableId) {
            (params as any).responsableId=restriccion.responsableId;
        }

        return params;
    }
}

export interface CatalogosConsulta {
    empleados: ResponseData<CatalogoEmpleado[]>;
    unidades: ResponseData<Unidad[]>;
    supervisores: ResponseData<CatalogoEmpleado[]>;
}
