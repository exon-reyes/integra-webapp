import {Injectable} from '@angular/core';
import {environment} from '@env/environment';
import {Observable} from 'rxjs';
import {ResponseData} from '@/core/responseData';
import {AbstractService} from '@/core/services/abstract-service';
import {Area} from '@/models/area/area';

@Injectable({
    providedIn: 'root',
})
export class AreaService extends AbstractService {
    private readonly apiUrl=`${environment.integraApi}/empresa`;

    constructor() {
        super();
    }

    obtenerAreas(filtro): Observable<ResponseData<Area[]>> {
        return this.http.get<ResponseData<Area[]>>(`${this.apiUrl}/areas`, {params: filtro});
    }

    crearArea(area: Area): Observable<ResponseData<Area>> {
        return this.http.post<ResponseData<Area>>(`${this.apiUrl}/areas`, area);
    }

    /**
     * Actualiza un área existente
     * @param id - ID del área a actualizar
     * @param area - Datos actualizados del área
     * @returns Observable con la respuesta que contiene el área actualizada
     */
    actualizarArea(id: number,
                   area: Partial<Area>): Observable<ResponseData<Area>> {
        return this.http.put<ResponseData<Area>>(`${this.apiUrl}/areas/${id}`, area);
    }

    /**
     * Elimina un área
     * @param id - ID del área a eliminar
     * @returns Observable con la respuesta de la eliminación
     */
    eliminarArea(id: number): Observable<ResponseData<void>> {
        return this.http.delete<ResponseData<void>>(`${this.apiUrl}/areas/${id}`);
    }
}
