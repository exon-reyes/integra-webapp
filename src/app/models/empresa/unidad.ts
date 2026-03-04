import {HorarioOperativo} from '@/models/empresa/horario-operativo';
import {Empresa} from '@/models/empresa/empresa';
import {Contacto} from '@/models/ubicacion/contacto';
import {Empleado} from '@/models/empleado/empleado';

export interface Unidad {
    id?: number;
    clave?: string;
    nombre?: string;
    empresa?: Empresa;
    nivelOperativo?: string;
    nombreCompleto?: string;
    actualizado?: Date;
    operativo?: boolean;
    activo?: boolean;
    contacto?: Contacto;
    requiereCamara?: boolean;
    supervisor?: Empleado;
    requiereReset?: boolean;
    horarios?: HorarioOperativo[];
    requiereCodigo?: boolean;
    codigoAutorizacionKiosco?: string;
    versionKiosco?: number;
    tiempoCompensacion?: string;
    tiempoEsperaKiosco?: number;
}
