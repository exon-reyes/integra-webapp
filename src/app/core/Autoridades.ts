/**
 * Autoridades normalizadas para permisos del sistema.
 * Cada constante incluye la descripción del permiso.
 */
export const Autoridades={
    // ================== GENERALES ==================
    // Visualización del espacio Generales
    GENERALES_VER: 'A',

    // === UNIDADES ===
    // Acceso al módulo Gestión de Unidades
    UNIDADES_VER: 'AA', // Consultar unidades
    UNIDADES_CONSULTAR: 'AA1', // Editar información general de la unidad
    UNIDADES_EDITAR: 'AA2', // Eliminar unidad
    UNIDADES_ELIMINAR: 'AA3', // Permite crear una nueva unidad
    UNIDADES_CREAR: 'AA4', // Permite exportar la información de contacto
    UNIDADES_EXPORTAR_CONTACTO: 'AA5',

    // === ZONAS ===
    // Acceso al módulo Gestión de Zonas
    ZONAS_VER: 'AB', // Permite agregar una nueva zona
    ZONAS_CREAR: 'AB1', // Permite editar la información de la zona
    ZONAS_EDITAR: 'AB2', // Permite eliminar la zona
    ZONAS_ELIMINAR: 'AB3',

    // ================== GESTIÓN RRHH ==================
    // Visualización del espacio Gestión RRHH
    RRHH_VER: 'B',

    // === EMPLEADOS ===
    // Acceso al módulo Gestión de Empleados
    EMPLEADOS_VER: 'BA', // Consultar catalágo de colaboradores
    EMPLEADOS_CONSULTAR: 'BA1', // Visualizar indicadores de empleados activos, inactivos, reingresos
    EMPLEADOS_VER_INDICADORES: 'BA2', // Permitir exportar empleados
    EMPLEADOS_EXPORTAR: 'BA3', // Restringe filtros de consulta a puesto de supervisores
    EMPLEADOS_RESTRINGIR_FILTRO_SUPERVISOR: 'BA4', //Visualizar empleados a cargo del usuario autenticado
    EMPLEADOS_VISUALIZAR_EMPLEADOS_RESPONSABLES: 'BA5',

    // ================== GESTIÓN ASISTENCIA ==================
    // Visualización del espacio Gestión de asistencia
    ASISTENCIA_VER: 'C',
    ASISTENCIA_MI_REGISTRO: 'CF1', // === RELOJ CHECADOR ===
    // Acceso a la aplicación Reloj Checador
    RELOJ_CHECADOR_ACCESO: 'CA1',

    // === ASISTENCIA MANUAL ===
    // Acceso a la aplicación Asistencia Manual
    ASISTENCIA_MANUAL_ACCESO: 'CB', // Restringe filtros de consulta a puesto de supervisores
    ASISTENCIA_MANUAL_AGREGAR: 'CB1',
    ASISTENCIA_MANUAL_ACCESO_MODULO: 'CB2',
    ASISTENCIA_MANUAL_FILTRAR_SUPERVISOR: 'CB3',
    ASISTENCIA_MANUAL_EMPLEADOS_RESPONSABLES: 'CB4',

    // === CONSULTA DE ASISTENCIA ===
    // Acceso al módulo consulta de asistencia
    CONSULTA_ASISTENCIA_VER: 'CC', // Consultar informe de asistencia de empleados
    CONSULTA_ASISTENCIA_CONSULTAR: 'CC1', // Restringe filtros de consulta a puesto de supervisores
    CONSULTA_ASISTENCIA_RESTRINGIR_FILTRO_SUPERVISOR: 'CC2', // Exportar lista de asistencia
    CONSULTA_ASISTENCIA_EXPORTAR: 'CC3',
    CONSULTA_ASISTENCIA_EMPLEADOS_RESPONSABLES: 'CC4',

    // === CONFIGURACIÓN RELOJ CHECADOR ===
    // Acceso al módulo Configuración Reloj Checador
    CONFIG_RELOJ_VER: 'CD', // Visualizar configuración del Reloj Checador asociada a las unidades
    CONFIG_RELOJ_VER_UNIDADES: 'CD1', // Puede activar o desactivar el uso de camara web
    CONFIG_RELOJ_ACTIVAR_CAMARA: 'CD2', // Puede modificar tiempos de compensación a las unidades
    CONFIG_RELOJ_EDITAR_TIEMPOS: 'CD3', // Puede aprobar solicitudes de configuración personalizada
    CONFIG_RELOJ_APROBAR_PERSONALIZADA: 'CD4', // Puede visualizar indicadores generales de uso
    CONFIG_RELOJ_VER_TOKENS: 'CD5',

    // === COMPENSACIONES ===
    // Acceso al módulo de compensaciones
    COMPENSACIONES_VER: 'CE', // Visualizar compensaciones aplicadas a empleados
    COMPENSACIONES_VER_APLICADAS: 'CE1', // Restringe filtros de consulta a puesto de supervisores
    COMPENSACIONES_RESTRINGIR_FILTRO_SUPERVISOR: 'CE2', // Exportar lista de compensaciones aplicadas
    COMPENSACIONES_EXPORTAR: 'CE3',

    // === EXPORTACIÓN DE INCIDENCIAS
    // Acceso al módulo Exportación de Incidencias
    EXPORTACION_INCIDENCIAS_VER: 'CF', // Restringe filtros de consulta a puesto de supervisores
    EXPORTACION_INCIDENCIAS_RESTRINGIR_FILTRO_SUPERVISOR: 'CF1',

    // ================== INFRAESTRUCTURA TI ==================
    // Visualización del espacio Infraestructura TI
    INFRAESTRUCTURA_VER: 'D',

    // === ROLES ===
    // Acceso al módulo Gestión de roles
    ROLES_VER: 'DA', // Visualiza los roles y los permisos asociados
    ROLES_VER_DETALLE: 'DA1', // Eliminar roles creados por el usuario
    ROLES_ELIMINAR: 'DA2', // Puede editar roles y sus permisos asociados
    ROLES_EDITAR: 'DA3', // Crear nuevos roles
    ROLES_CREAR: 'DA4',

    // === USUARIOS ===
    // Acceso al módulo Gestión de usuarios
    USUARIOS_VER: 'DB', // Consultar usuarios
    USUARIOS_CONSULTAR: 'DB1', // Permite crear un nuevo usuario
    USUARIOS_CREAR: 'DB2', // Editar información de roles y permisos de usuario
    USUARIOS_EDITAR: 'DB3', // Permite desactivar un usuario
    USUARIOS_DESACTIVAR: 'DB4',
    USUARIOS_ELIMINAR: 'DB5',

    // === CREDENCIALES ===
    // Acceso al módulo Gestión de Credenciales
    CREDENCIALES_VER: 'DC', // Permite visualizar las credenciales de acceso
    CREDENCIALES_CONSULTAR: 'DC1', // Permite editar las credenciales de acceso
    CREDENCIALES_EDITAR: 'DC2', // Permite eliminar credenciales de acceso
    CREDENCIALES_ELIMINAR: 'DC3', // Exportar credenciales
    CREDENCIALES_EXPORTAR: 'DC4', // Crear credenciales de acceso
    CREDENCIALES_CREAR: 'DC5',

    // === TIPO DE CUENTA ===
    // Acceso al módulo tipo de Cuenta
    TIPO_CUENTA_VER: 'DD', // Crear un nuevo proveedor de cuenta de acceso
    TIPO_CUENTA_CREAR_PROVEEDOR: 'DD1', // Consultar proveedores de acceso
    TIPO_CUENTA_CONSULTAR_PROVEEDORES: 'DD2', // Editar información del proveedor de acceso
    TIPO_CUENTA_EDITAR_PROVEEDOR: 'DD3', // Eliminar proveedores de acceso
    TIPO_CUENTA_ELIMINAR_PROVEEDOR: 'DD4',

    //GESTION-VACACIONES
    VACACIONES_CREAR_SOLICITUD_AUSENCIAS: 'EA2',
    VACACIONES_CONSULTAR_SOLICITUDES: 'EA1',
    VACACIONES_GESTOR_CONSULTAR:'EB1',
    VACACIONES_AUTORIZACION_NIVEL1: 'EB4',
    VACACIONES_AUTORIZACION_NIVEL2: 'EB5',


} as const;

export type AutoridadKey=typeof Autoridades[keyof typeof Autoridades];
