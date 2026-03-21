import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";


// export interface Descanso {
//     id?: number;
//     empleado?: CatalogoEmpleado;
//     fecha?: string;
//     motivo?: string;
//     activo?: boolean;
//     estatus?: string;
//     gestor?: Gestor;
//     fechaAprobacion?: string;
//     comentarioAprobador?: string;
// }

// export interface Descansos {
//     pendientes: Descanso[];
//     aprobados: Descanso[];
//     rechazados: Descanso[];
// }
//
// export interface Vacaciones {
//     pendientes: Solicitud[];
//     aprobadas: Solicitud[];
//     rechazadas: Solicitud[];
//     canceladas: Solicitud[];
//     disfrudadas: Solicitud[];
//     aprobadasPorTomar: Solicitud[];
// }


// export interface Solicitud {
//     id: number;
//     fecha: string;
//     diasSolicitados: number;
//     motivo: string;
//     estatus: string; // puedes convertirlo en enum si lo deseas
//     gestores: Gestor[];
//     comentarioAprobador: string;
//     fechaAprobacion: Date;
//     fechaSolicitud: Date;
//     periodoId: number;
// }
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

export interface SolicitudVacaciones {
    pendientes: SolicitudEmpleado[];
    aprobadas: SolicitudEmpleado[];
    canceladas: SolicitudEmpleado[];
    disfrutadas?: SolicitudEmpleado[];
    aprobadasPorTomar: SolicitudEmpleado[];

    sumaAprobadosPorTomar?: number;
    sumaCancelados?: number,
    sumaDisfrutados?: number,
    sumaPendientesAprobacion?: number,
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
    //
    //
    // empleadoId: number;
    // nombreCompleto: string;
    // antiguedadAnios: number;
    // diasTotalesAnio: number;
    // diasDisponibles: number;
    // diasAprobados?: number;
    // diasDisfrutados: number;
    // diasProgramados: number;
    // diasProximosVencer: number;
    // fechaProximoVencer: string | null;
    // proximasVacaciones: ProximaVacacion[];
    // diasAnualesActual: number;

    // departamento: string;
    // puesto: string;
    // unidad: string;
}

export interface SolicitudVacacionRequest {
    diasSeleccionados: string[];
    // Set<LocalDate> → array de strings en formato ISO (YYYY-MM-DD)

    motivo?: string;
    // opcional, ya que en Java no tiene @NotEmpty

    tipoSolicitud: string;
    // enum que deberías definir en TS

    usuarioId?: number;
}

//
// export interface ProximaVacacion {
//     solicitudId: number;
//     fechaInicio: string;
//     fechaFin: string;
//     diasLaborables: number;
//     estado: string;
// }
//
// export interface SolicitudVacacion {
//     id: number;
//     empleadoId: number;
//     nombreEmpleado: string;
//     departamento: string;
//     puesto: string;
//     fechaInicio: string;
//     fechaFin: string;
//     diasNaturales: number;
//     diasLaborables: number;
//     estatus: string;
//     motivoRechazo: string | null;
//     aprobadoPor: number | null;
//     nombreAprobador: string | null;
//     fechaAprobacion: string | null;
//     nivelAutoridadActual: number;
//     observaciones: string | null;
//     createdAt: string;
// }
//
// export interface SolicitudVacacionRequest {
//     diasDescanso: string[];  // Fechas en formato 'YYYY-MM-DD'
//     motivo?: string;
//     tipoSolicitud: 'VACACION' | 'DESCANSO';
// }
//
// export interface CalculoDias {
//     fechaInicio: string;
//     fechaFin: string;
//     diasNaturales: number;
//     diasLaborables: number;
//     diasFestivosExcluidos: number;
//     diasDescansoExcluidos: number;
//     saldoDisponible: number;
//     puedeSolicitar: boolean;
//     diasFestivosEnRango: string[];
//     diasDescansoEnRango: string[];
//     mensajeError: string | null;
// }
//
// export interface CalendarioEquipo {
//     empleadoId: number;
//     nombreCompleto: string;
//     departamento: string;
//     fechaInicio: string;
//     fechaFin: string;
//     diasLaborables: number;
//     estado: string;
// }
//
// export interface AprobacionRequest {
//     aprobada: boolean;
//     motivoRechazo?: string;
// }
//
export interface Festivo {
    id?: number;
    fecha?: string;
    nombre?: string;
    activo?: boolean;
}

//
// export interface PeriodoVeda {
//     id: number;
//     fechaInicio: string;
//     fechaFin: string;
//     comentario: string;
//     activo: boolean;
// }
//
// export interface ConfiguracionDescanso {
//     empleadoId: number;
//     diasDescanso: string[];
//     diasDescansosPendientes: string[];
//     diasDescansosPendientesConId?: { id: number; fecha: string }[];
//     configurado: boolean;
// }
//
// export interface ConfiguracionDescansoRequest {
//     diasDescanso: string[];      // Fechas en formato 'YYYY-MM-DD'
//     comentario?: string;         // Comentario opcional de la solicitud
// }
