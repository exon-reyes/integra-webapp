import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, delay } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AvatarService {
  private http = inject(HttpClient);

  /**
   * Simula el guardado del avatar de un usuario en la API.
   * @param usuarioId El ID del usuario.
   * @param avatarPayload El nombre del archivo o un objeto File si es foto subida.
   * @returns Un observable que simula la respuesta de éxito después de 500ms.
   */
  actualizarAvatar(usuarioId: number | string, avatarPayload: string | File): Observable<{ success: boolean, message: string }> {
    // Aquí iría la llamada real cuando el backend lo soporte:
    // const formData = new FormData();
    // formData.append('avatar', avatarPayload);
    // return this.http.post<{ success: boolean, message: string }>(...);

    const logMsg = avatarPayload instanceof File ? `archivo "${avatarPayload.name}"` : `avatar "${avatarPayload}"`;
    console.log(`Simulando API: Guardando ${logMsg} para el usuario con ID ${usuarioId}`);
    return of({ success: true, message: 'Avatar actualizado correctamente' }).pipe(delay(500));
  }

  /**
   * Simula la eliminación del avatar de un usuario en la API.
   * @param usuarioId El ID del usuario.
   * @returns Un observable que simula la respuesta de éxito después de 500ms.
   */
  eliminarAvatar(usuarioId: number | string): Observable<{ success: boolean, message: string }> {
    // Aquí iría la llamada real cuando el backend lo soporte:
    // return this.http.delete<{ success: boolean, message: string }>(`/api/usuarios/${usuarioId}/avatar`);

    console.log(`Simulando API: Eliminando avatar para el usuario con ID ${usuarioId}`);
    return of({ success: true, message: 'Avatar eliminado correctamente' }).pipe(delay(500));
  }
}
