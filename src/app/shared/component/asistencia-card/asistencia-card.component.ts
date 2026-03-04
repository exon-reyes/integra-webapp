import {ChangeDetectionStrategy, Component, computed, input, output} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';
import {Button} from 'primeng/button';
import {Tooltip} from 'primeng/tooltip';
import {Asistencia, Pausa} from '@/core/services/asistencia/asistencia.service';
import {MenuItem} from "primeng/api";

/**
 * Evento emitido cuando se hace clic en ver foto
 */
export interface PhotoClickEvent {
    pathFoto: string;
    tipo: string;
    fecha: string;
}

/**
 * Evento emitido cuando se hace clic en editar
 */
export interface EditClickEvent {
    asistencia: Asistencia;
}

/**
 * Evento emitido cuando se hace clic en eliminar
 */
export interface DeleteClickEvent {
    asistencia: Asistencia;
}

/**
 * Evento emitido cuando se hace clic en editar pausa
 */
export interface EditPausaClickEvent {
    pausa: Pausa;
    asistencia: Asistencia;
}

/**
 * Evento emitido cuando se hace clic en eliminar pausa
 */
export interface DeletePausaClickEvent {
    pausa: Pausa;
    asistencia: Asistencia;
}

export interface AddPausaClickEvent {
    asistencia: Asistencia;
}

@Component({
    selector: 'asistencia-card',
    standalone: true,
    imports: [CommonModule, DatePipe, Button, Tooltip],
    changeDetection: ChangeDetectionStrategy.OnPush,
    templateUrl: './asistencia-card.component.html',
    styles: [
        `
            :host {
                display: block;
            }
        `,
    ],
})
export class AsistenciaCardComponent {
    /**
     * Datos de la asistencia a mostrar
     */
    readonly asistencia=input.required<Asistencia>();
    items: MenuItem[] | undefined;
    /**
     * URL base para las imágenes
     */
    readonly apiUrlImagen=input<string>();
    /**
     * Evento emitido cuando se hace clic en ver una foto
     */
    readonly verFotoClick=output<PhotoClickEvent>();
    /**
     * Evento emitido cuando se hace clic en editar (opcional)
     */
    readonly editClick=output<EditClickEvent>();
    /**
     * Evento emitido cuando se hace clic en eliminar (opcional)
     */
    readonly deleteClick=output<DeleteClickEvent>();
    /**
     * Evento emitido cuando se hace clic en editar pausa
     */
    readonly editPausaClick=output<EditPausaClickEvent>();
    /**
     * Evento emitido cuando se hace clic en eliminar pausa
     */
    readonly deletePausaClick=output<DeletePausaClickEvent>();
    /**
     * Evento emitido cuando se hace clic en agregar pausa
     */
    readonly addPausaClick=output<AddPausaClickEvent>();
    /**
     * Evento emitido cuando se hace clic en finalizar jornada
     */
    readonly finalizarJornadaClick=output<Asistencia>();
    /**
     * Mostrar botones de edición/eliminación
     */
    readonly showEditButtons=input<boolean>(false);
    readonly showImg=input.required<boolean>();
    /**
     * Duración fija de la jornada para el diseño uniforme del timeline
     */
    readonly duracionJornada=computed(() => 8);

    /**
     * Calcula la posición de una pausa en el timeline (porcentaje)
     *
     * @param pausa - Pausa a posicionar
     * @returns Porcentaje de posición (0-95)
     */
    calcularPosicionPausa(pausa: Pausa): number {
        const asistencia=this.asistencia();
        const inicioJornada=new Date(asistencia.inicioJornada);
        const inicioPausa=new Date(pausa.inicio);
        const tiempoTranscurrido=(inicioPausa.getTime() - inicioJornada.getTime()) / (1000 * 60 * 60);
        const duracionTotal=this.duracionJornada();
        return Math.min(95, (tiempoTranscurrido / duracionTotal) * 100);
    }

    /**
     * Calcula el ancho de una pausa en el timeline (porcentaje)
     *
     * @param pausa - Pausa a dimensionar
     * @returns Porcentaje de ancho (2-10)
     */
    calcularAnchoPausa(pausa: Pausa): number {
        if(!pausa.fin) return 2;
        const duracionPausa=(pausa.duracion?.horas || 0) + (pausa.duracion?.minutosRestantes || 0) / 60;
        const duracionTotal=this.duracionJornada();
        return Math.max(2, Math.min(10, (duracionPausa / duracionTotal) * 100));
    }

    /**
     * Maneja el clic en el botón de ver foto
     *
     * @param pathFoto - Ruta de la foto
     * @param tipo - Tipo de foto (Inicio, Fin, etc.)
     */
    protected onVerFotoClick(pathFoto: string,
                             tipo: string): void {
        this.verFotoClick.emit({
            pathFoto, tipo, fecha: this.asistencia().fecha,
        });
    }

    /**
     * Maneja el clic en el botón de editar
     */
    protected onEditClick(): void {
        this.editClick.emit({asistencia: this.asistencia()});
    }

    /**
     * Maneja el clic en el botón de eliminar
     */
    protected onDeleteClick(): void {
        this.deleteClick.emit({asistencia: this.asistencia()});
    }

    /**
     * Maneja el clic en el botón de editar pausa
     */
    protected onEditPausaClick(pausa: Pausa): void {
        this.editPausaClick.emit({pausa, asistencia: this.asistencia()});
    }

    /**
     * Maneja el clic en el botón de eliminar pausa
     */
    protected onDeletePausaClick(pausa: Pausa): void {
        this.deletePausaClick.emit({pausa, asistencia: this.asistencia()});
    }

    /**
     * Maneja el clic en el botón de agregar pausa
     */
    protected onAddPausaClick(): void {
        this.addPausaClick.emit({asistencia: this.asistencia()});
    }

    /**
     * Maneja el clic en el botón de finalizar jornada
     */
    protected onFinalizarJornadaClick(): void {
        this.finalizarJornadaClick.emit(this.asistencia());
    }

    /**
     * Obtiene el inicio de una pausa (compatible con ambos tipos)
     */
    protected getPausaInicio(pausa: Pausa): string {
        return pausa.inicio;
    }

    /**
     * Obtiene el fin de una pausa (compatible con ambos tipos)
     */
    protected getPausaFin(pausa: Pausa): string | undefined {
        return pausa.fin;
    }

    /**
     * Obtiene el tipo de pausa
     */
    protected getPausaTipo(pausa: Pausa): string {
        return pausa.tipoPausa;
    }

    /**
     * Obtiene la duración de una pausa
     */
    protected getPausaDuracion(pausa: Pausa): { horas: number; minutosRestantes: number } | undefined {
        if(pausa.duracion) {
            return pausa.duracion;
        }
        // Si no tiene duración, calcularla
        const fin=this.getPausaFin(pausa);
        if(!fin) return undefined;

        const inicio=new Date(this.getPausaInicio(pausa));
        const finDate=new Date(fin);
        const diffMs=finDate.getTime() - inicio.getTime();
        const diffHours=diffMs / (1000 * 60 * 60);
        const horas=Math.floor(diffHours);
        const minutosRestantes=Math.round((diffHours - horas) * 60);

        return {horas, minutosRestantes};
    }
}
