export interface Empresa {
    id: number;
    nombre: string;
    rfc?: string;
    razonSocial?: string;
    regimenCapital?: string;
    inicioOperaciones?: string; // Puedes usar string para fechas o Date
    estatusPadron?: string;
    ultimoCambioEstado?: string; // Puedes usar string para fechas o Date
    regimen?: string;
    nombreVialidad?: string;
    numeroExterior?: string;
    numeroInterior?: string;
    tipoVialidad?: string;
    localidad?: string;
    municipio?: string;
    entidadFederativa?: string;
    codigoPostal?: string;
    colonia?: string;
    calle?: string;
    telefono?: string;
}
