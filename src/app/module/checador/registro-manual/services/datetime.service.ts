import {Injectable} from '@angular/core';
import {fechaISOString} from '@/shared/util/date.util';

@Injectable({providedIn: 'root'})
export class DateTimeService {

    formatDate(date: Date): string {
        const year=date.getFullYear();
        const month=String(date.getMonth() + 1).padStart(2, '0');
        const day=String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }

    extractTime(dateTimeString: string): string {
        if(!dateTimeString) return '';
        if(!dateTimeString.includes('T')) {
            return dateTimeString.substring(0, 5);
        }
        const timePart=dateTimeString.split('T')[1];
        return timePart ? timePart.substring(0, 5) : '';
    }

    esJornadaNocturna(horaInicio: string,
                      horaFin: string): boolean {
        return this.horaAMinutos(horaFin)<this.horaAMinutos(horaInicio);
    }

    combinarFechaHora(fecha: string,
                      hora: string): string {
        const [year, month, day]=fecha.split('-').map(Number);
        const [hours, minutes, seconds=0]=hora.split(':').map(Number);
        const dateTime=new Date(year, month - 1, day, hours, minutes, seconds);
        return fechaISOString(dateTime);
    }

    private horaAMinutos(hora: string): number {
        const [hours, minutes]=hora.split(':').map(Number);
        return hours * 60 + minutes;
    }
}
