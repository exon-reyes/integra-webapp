import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges,} from '@angular/core';
import {DatePipe} from '@angular/common';

@Component({
    selector: 'app-anniversary-card',
    standalone: true,
    imports: [DatePipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="p-3">
            <div class="flex items-center gap-2 mb-4">
                <div class="w-9 h-9 bg-amber-100 rounded-md flex items-center justify-center shrink-0">
                    <i class="pi pi-star-fill text-amber-500"></i>
                </div>
                <div>
                    <div class="font-bold text-slate-700">{{ title }}</div>
                    <div class="text-sm text-slate-500">{{ subtitle }}</div>
                </div>
            </div>

            <div class="bg-sky-700 text-white rounded-xl p-4 ">
                <div class="text-[10px] font-semibold tracking-widest mb-3">
                    Próximo aniversario
                </div>

                <div class="flex items-center justify-between gap-4">
                    <div class="flex-1">
                        <div class="text-lg font-bold  leading-tight">
                            {{ nextAnniversaryDate | date:"dd 'de' MMMM yyyy":"":"es" }}
                        </div>
                        <div class="text-sm  font-normal mt-1">
                            Celebrarás {{ nextYears }} años
                        </div>
                    </div>

                    <div class="bg-sky-600 rounded-2xl px-3 py-2 text-center min-w-[60px]  ">
                        <div class="text-xl font-semibold text-white leading-none">{{ currentYears }}</div>
                        <div class="text-[9px] text-blue-100 uppercase mt-1">Año actual</div>
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class AnniversaryCardComponent implements OnChanges {
    @Input() hireDate!: Date | string; // Aceptamos string por si viene de la API
    @Input() title='¡Gracias por tu dedicación!';
    @Input() subtitle='Eres parte importante del equipo';

    currentYears=0;
    nextYears=0;
    nextAnniversaryDate: Date=new Date();
    diasRestantes=0;

    ngOnChanges(changes: SimpleChanges): void {
        if(changes['hireDate'] && this.hireDate) {
            this.compute();
        }
    }

    private compute(): void {
        // 1. Normalización de entrada
        // Si hireDate es un string "2022-08-01", forzamos a que se lea en zona local
        // reemplazando los guiones por diagonales si es necesario.
        const hire=typeof this.hireDate === 'string'
            ? new Date(this.hireDate.replace(/-/g, '\/'))
            : new Date(this.hireDate);

        const today=new Date();
        today.setHours(0, 0, 0, 0); // Reset horas para comparación limpia

        const hDay=hire.getDate();
        const hMonth=hire.getMonth();
        const hYear=hire.getFullYear();

        // 2. Años cumplidos hasta hoy
        this.currentYears=today.getFullYear() - hYear;

        // Fecha de aniversario este año
        const thisYearAnniversary=new Date(today.getFullYear(), hMonth, hDay);

        if(today<thisYearAnniversary) {
            this.currentYears--;
        }

        this.nextYears=this.currentYears + 1;

        // 3. Cálculo de la PRÓXIMA fecha de aniversario
        // Empezamos asumiendo que es este año
        this.nextAnniversaryDate=new Date(today.getFullYear(), hMonth, hDay);

        // Si ya pasó (o es hoy), movemos al año siguiente
        if(this.nextAnniversaryDate<=today) {
            this.nextAnniversaryDate.setFullYear(today.getFullYear() + 1);
        }

        // 4. Calcular días restantes (Opcional)
        const diff=this.nextAnniversaryDate.getTime() - today.getTime();
        this.diasRestantes=Math.ceil(diff / (1000 * 60 * 60 * 24));
    }
}
