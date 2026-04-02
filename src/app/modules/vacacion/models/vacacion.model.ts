import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";
export interface SolicitudEmpleado {
    id: number | null; // Long en Java → number en TS
    empleadoId: number | null;
    fecha: string | null; // LocalDate → ISO string
    tipo: string | null;
    comentario: string | null;
    estatus: string | null;
    aprobadorId: number | null;
    fechaAprobacion: string | null; // LocalDateTime → ISO string
    comentariosAprobador: string | null;
    periodoId: number | null;
    activo: boolean | null;
    createdAt: string | null; // LocalDateTime → ISO string
}
export interface SolicitudesGestionDTO {
    id: number;
    colaborador: CatalogoEmpleado;
    unidad: string;
    estatusJefe: string;
    estatusRrhh: string;
    diasAprobados: number;
    diasTotalSolicitud: number;
    folioSolicitud: number;
    solicitudes: FechaSolicitud[];
    estatusGeneral: string;
    tipoSolicitud: string;
}
export interface FechaSolicitud {
    id: number;
    fecha: Date;
    estatus: string;
}
export interface SolicitudVacaciones {
    pendientes: SolicitudEmpleado[];
    aprobadas: SolicitudEmpleado[];
    canceladas: SolicitudEmpleado[];
    disfrutadas: SolicitudEmpleado[];

    sumaAprobadas?: number;
    sumaCancelados?: number;
    sumaDisfrutados?: number;
    sumaPendientesAprobacion?: number;
}

export interface PeriodoVacacional {
    id: number;
    empleadoId: number;
    anioLaboral: number;
    fechaInicio: string;
    fechaFin: string;
    diasHabilitados: number;
    diasTomados: number;
    diasRestantes: number;
    fechaCaducidad: string;
    estatus: string;
    periodoNumero: number;
    anioGestion: number;
}

export interface SolicituDescanso {
    pendientes: SolicitudEmpleado[];
    aprobadas: SolicitudEmpleado[];
    canceladas: SolicitudEmpleado[];
    sumaAprobadas?: number;
    sumaCanceladas?: number;
    sumaPendientes?: number;
}

export interface DashboardVacacion {
    empleado?: CatalogoEmpleado;
    periodoVacacional?: PeriodoVacacional
    descansos?: SolicituDescanso;
    vacaciones?: SolicitudVacaciones;
    proximoAniversario: Date;
}

export interface SolicitudVacacionRequest {
    diasSeleccionados: string[];
    motivo?: string;
    tipoSolicitud: string;
    usuarioId?: number;
}
export interface Festivo {
    id?: number;
    fecha?: string;
    nombre?: string;
    activo?: boolean;
}

export interface ResponsableEstatus {
    nombre: string;
    estatus: string;
}

export interface DiaSolicitado {
    id: number;
    fecha: string;
    tipo: string;
    estatus: string;
    primerResponsable: ResponsableEstatus;
    segundoResponsable: ResponsableEstatus;
    nuevoEstatus?: string;
    comentario?: string;
}
export interface SolicitudGestionIndicadores {
    totalDias: number;
    aprobados: number;
    pendientes: number;
    cancelados: number;
    disfrutados: number;
}

export interface SolicitudGestion {
    folio: number;
    tipo: string;
    estatus: string;
    dias: DiaSolicitado[];
    indicadores?: SolicitudGestionIndicadores;
}

export interface GestionSolicitudResponse {
    empleadoId: number;
    nombreCompleto: string;
    unidad: string;
    primerJefe?: string;
    segundoJefe?: string;
    solicitudes: SolicitudGestion[];
    totalSolicitudes: number;
    diasHabilitados?: number;
    diasDisponibles?: number;
    diasTomados?: number;
}

export interface DashboardGestionSolicitudResponse {
    totalSolicitudes: number;
    solicitudesPendientes: number;
    solicitudesAprobadas: number;
    solicitudesRechazadas: number;
    empleados: CatalogoEmpleado[];
}

export interface FechaSolicitudDetalle {
    id: number;
    fecha: string;
    estatus: string;
    estatusPrimerJefe?: string;
    estatusSegundoJefe?: string;
    comentario?: string;
}

export interface DetalleSolicitudDTO {
    anioGestion: number;
    diasHabilitados: number;
    diasSolicitados: number;
    diasTomados: number;
    estatusGlobal:string;
    empleado: CatalogoEmpleado;
    estatusPrimerResponsable: string;
    estatusSegundoResponsable: string;
    fechaSolicituds: FechaSolicitudDetalle[];
    folioSolicitud: number;
    primerJefe?: {
        id: number;
        nombreCompleto: string;
    };
    restanteSiAprueba: number;
    segundoJefe?: {
        id: number;
        nombreCompleto: string;
    };
    tipoSolicitud: string;
}

export interface NuevoEstatusSolicitud {
    empleadoId: number;
    folioSolicitud?: number;
    idSolicitud?: number;
    nuevoEstatus: string;
    tipoSolicitud?: string;
    nivel: number;
}
