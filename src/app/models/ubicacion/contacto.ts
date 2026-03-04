import {Zona} from '@/models/ubicacion/zona';
import {Estado} from '@/models/ubicacion/estado';

export interface Contacto {
    email?: string;
    localizacion?: string;
    telefono?: string;
    direccion?: string;
    zona?: Zona;
    estado?: Estado;
}
