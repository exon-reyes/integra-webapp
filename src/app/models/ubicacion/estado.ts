import {Zona} from '@/models/ubicacion/zona';

export interface Estado {
    id: number;
    codigo?: string;
    nombre?: string;
    zonas?: Zona[];
}
