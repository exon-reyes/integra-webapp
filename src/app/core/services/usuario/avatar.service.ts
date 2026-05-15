import {inject, Injectable, signal} from '@angular/core';
import {HttpClient} from '@angular/common/http';
import {Observable} from 'rxjs';
import {environment} from '@env/environment';
import {ResponseData} from '@/core/responseData';

export interface ActualizarAvatarRequest {
    avatarName?: string;
    base64Image?: string;
}

@Injectable({
    providedIn: 'root'
})
export class AvatarService {
    private http=inject(HttpClient);
    private readonly apiUrl=`${environment.integraApi}/empleados`;

    // Señal global para mantener el estado del avatar reaccionando en toda la app
    private readonly _avatarActual=signal<string | null>(null);
    public readonly avatarActual=this._avatarActual.asReadonly();

    // Mantiene un timestamp estable para evitar ExpressionChangedAfterItHasBeenCheckedError
    // Se actualiza únicamente cuando cambia el avatar
    private _refreshTimestamp=new Date().getTime();

    /**
     * Actualiza el estado global del avatar en el frontend.
     * @param avatar Nombre del avatar, url, base64 o null.
     */
    setAvatarSource(avatar: string | null | undefined): void {
        this._refreshTimestamp=new Date().getTime();
        this._avatarActual.set(avatar || null);
    }

    /**
     * Genera la ruta absoluta o relativa de visualización de un avatar
     * @param avatar Nombre, ruta base64 o URL del avatar.
     * @param empleadoId El ID del empleado dueño del avatar.
     * @returns Un string con la ruta a asignar al [src] de <img />.
     */
    obtenerRutaAvatar(avatar: string | null | undefined,
                      empleadoId: number): string {
        if(!avatar) return '';
        if(avatar.startsWith('data:image/') || avatar.startsWith('http')) {
            return avatar;
        } else if(avatar.endsWith('.svg')) {
            return 'assets/avatars/' + avatar;
        } else {
            // Añadimos un timestamp estable para evitar la caché del navegador al actualizar la imagen en el servidor
            return `${this.apiUrl}/${empleadoId}/avatar/imagen?t=${this._refreshTimestamp}`;
        }
    }

    /**
     * Actualiza el avatar de un empleado en la API.
     * @param usuarioId El ID del usuario.
     * @param payload Request object con el base64 de la imagen o el nombre del avatar.
     * @returns Un observable con la respuesta.
     */
    actualizarAvatar(usuarioId: number | string,
                     payload: ActualizarAvatarRequest): Observable<ResponseData<void>> {
        return this.http.put<ResponseData<void>>(`${this.apiUrl}/${usuarioId}/avatar`, payload);
    }

    /**
     * Elimina el avatar de un empleado en la API.
     * @param usuarioId El ID del usuario.
     * @returns Un observable con la respuesta.
     */
    eliminarAvatar(usuarioId: number | string): Observable<ResponseData<void>> {
        return this.http.delete<ResponseData<void>>(`${this.apiUrl}/${usuarioId}/avatar`);
    }
}
