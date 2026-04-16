import {Unidad} from "@/models/empresa/unidad";
import {CatalogoEmpleado} from "@/service/catalogo-empleado.service";

export interface AsignacionVacacion {
    id: number;
    unidad: Unidad;
    empleado: CatalogoEmpleado;
}
