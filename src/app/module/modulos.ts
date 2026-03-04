export interface Permiso {
    id: string;
    nombre: string;
    asignado: boolean;
    desdeRol?: boolean;
}

export interface Submodulo {
    id: string;
    nombre: string;
    asignado?: boolean;
    permisos: Permiso[];
}

export interface Modulo {
    id: string;
    nombre: string;
    permisoAcceso: string;
    asignado: boolean;
    submodulos: Submodulo[];
}

export interface Universo {
    id: string;
    nombre: string;
    modulos: Modulo[];
}
