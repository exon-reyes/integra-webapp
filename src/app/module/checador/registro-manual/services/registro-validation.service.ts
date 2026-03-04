import {Injectable} from '@angular/core';
import {Asistencia} from '@/core/services/asistencia/asistencia.service';

@Injectable({providedIn: 'root'})
export class RegistroValidationService {

    validarRegistroFuturo(fecha: string): boolean {
        return new Date(fecha)>new Date();
    }

    validarHoraSalida(horaSalida: string,
                      horaEntrada: string): boolean {
        return new Date(horaSalida)>new Date(horaEntrada);
    }

    validarPausaDentroDeJornada(inicioPausa: Date,
                                finPausa: Date,
                                jornada: Asistencia): boolean {
        const inicioJornada=new Date(jornada.inicioJornada);
        const finJornada=new Date(jornada.finJornada!);
        return inicioPausa>=inicioJornada && finPausa<=finJornada;
    }

    validarHoraInicioAyer(hora: string,
                          diffDays: number): boolean {
        if(diffDays !== 1) return true;
        const [horaNum]=hora.split(':').map(Number);
        return horaNum>=20;
    }

    calcularDiferenciaDias(fecha: Date): number {
        const today=new Date();
        today.setHours(0, 0, 0, 0);
        const selectedDate=new Date(fecha);
        selectedDate.setHours(0, 0, 0, 0);
        return Math.ceil((today.getTime() - selectedDate.getTime()) / (1000 * 60 * 60 * 24));
    }
}
