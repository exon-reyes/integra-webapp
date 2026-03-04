import { CatalogoEmpleado } from '@/service/catalogo-empleado.service';

export interface Gestor extends CatalogoEmpleado {
    nivel?: number;
    proceso?: string;
}
