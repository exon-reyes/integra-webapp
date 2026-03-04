import {Puesto} from '@/models/empresa/puesto';
import {Unidad} from '@/models/empresa/unidad';
import {Departamento} from '@/models/empresa/departamento';
import {Contacto} from '@/models/ubicacion/contacto';

export interface Empleado {
    id: number;
    nombre: string;
    apellidoPaterno: string;
    apellidoMaterno: string;
    ping?: string;
    nombreCompleto?: string;
    estatus?: string;
    estadoCivil?: string;
    puesto?: Puesto;
    unidad?: Unidad;
    departamento?: Departamento;
    registrado?: string; // Puedes usar string para fechas o Date
    actualizado?: string; // Puedes usar string para fechas o Date
    contacto?: Contacto;

}
