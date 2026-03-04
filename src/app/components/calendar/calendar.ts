import {ChangeDetectionStrategy, Component, computed, input, output, signal} from '@angular/core';
import {ControlValueAccessor, NG_VALUE_ACCESSOR} from '@angular/forms';

// Constantes tipadas
const MONTH_NAMES=[
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
] as const;

const DAYS_OF_WEEK=['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'] as const;

// Utilidades
const createDateKey=(year: number,
                     month: number,
                     day: number): string =>
    `${year}-${month}-${day}`;

const normalizeDate=(year: number,
                     month: number,
                     day: number): Date => {
    const date=new Date(year, month, day);
    date.setHours(0, 0, 0, 0);
    return date;
};

interface CalendarDay {
    value: number | null;
    isDisabled: boolean;
    isTagged: boolean;
    isMissingRecord: boolean;
    classes: string;
}

@Component({
    selector: 'app-calendar',
    imports: [],
    standalone: true,
    styleUrl: './calendar.scss',
    templateUrl: './calendar.html',
    changeDetection: ChangeDetectionStrategy.OnPush,
    providers: [
        {provide: NG_VALUE_ACCESSOR, useExisting: Calendar, multi: true},
    ],
})
export class Calendar implements ControlValueAccessor {
    // Inputs
    readonly disableFutureDays=input<boolean>(true);
    readonly disabledDates=input<Date[]>([]);
    readonly showRegisterIndicator=input<boolean>(false);
    readonly taggedDates=input<Date[]>([]);

    // Outputs
    readonly daySelect=output<Date>();
    readonly monthChange=output<Date>();

    // Signals de estado
    readonly displayDate=signal<Date>(new Date());
    readonly selectedDay=signal<number | null>(null);

    // Constantes públicas
    readonly monthNames=MONTH_NAMES;
    readonly daysOfWeek=DAYS_OF_WEEK;

    // Computed: días del mes actual
    readonly daysInMonth=computed(() => {
        const date=this.displayDate();
        const year=date.getFullYear();
        const month=date.getMonth();

        const firstDayOfWeek=new Date(year, month, 1).getDay();
        const totalDays=new Date(year, month + 1, 0).getDate();

        return [
            ...Array<null>(firstDayOfWeek).fill(null),
            ...Array.from({length: totalDays}, (_,
                                                i) => i + 1),
        ];
    });

    // Computed: día actual si está en el mes visible
    readonly todayInView=computed(() => {
        const today=new Date();
        const currentView=this.displayDate();

        if(currentView.getMonth() !== today.getMonth() ||
            currentView.getFullYear() !== today.getFullYear()) {
            return null;
        }
        return today.getDate();
    });
    readonly calendarDays=computed<CalendarDay[]>(() => {
        const days=this.daysInMonth();

        return days.map(day => {
            if(!day) return {value: null, isDisabled: true, isTagged: false, isMissingRecord: false, classes: ''};

            return {
                value: day,
                isDisabled: this.isDayDisabled(day),
                isTagged: this.isDayTagged(day),
                isMissingRecord: this.isDayMissingRecord(day),
                classes: this.getDayClasses(day),
            };
        });
    });
    // Computed: conjunto de días futuros deshabilitados
    private readonly futureDisabledDays=computed(() => {
        if(!this.disableFutureDays()) return new Set<number>();

        const today=new Date();
        const viewDate=this.displayDate();
        const viewYear=viewDate.getFullYear();
        const viewMonth=viewDate.getMonth();
        const totalDays=new Date(viewYear, viewMonth + 1, 0).getDate();

        // Si el mes/año es futuro, todos los días están deshabilitados
        if(viewYear>today.getFullYear() ||
            (viewYear === today.getFullYear() && viewMonth>today.getMonth())) {
            return new Set(Array.from({length: totalDays}, (_,
                                                            i) => i + 1));
        }

        // Si el mes/año es pasado, ningún día futuro está deshabilitado
        if(viewYear<today.getFullYear() || viewMonth<today.getMonth()) {
            return new Set<number>();
        }

        // Mismo mes/año: deshabilitar días después de hoy
        const todayDay=today.getDate();
        return new Set(
            Array.from({length: totalDays - todayDay}, (_,
                                                        i) => todayDay + i + 1),
        );
    });
    // Lookup tables para fechas deshabilitadas y con tags
    private readonly disabledKeys=computed(() =>
        new Set(this.disabledDates().map(d =>
            createDateKey(d.getFullYear(), d.getMonth(), d.getDate()))),
    );
    private readonly taggedKeys=computed(() =>
        new Set(this.taggedDates().map(d =>
            createDateKey(d.getFullYear(), d.getMonth(), d.getDate()))),
    );

    // Métodos de validación
    isDayDisabled(day: number): boolean {
        if(this.futureDisabledDays().has(day)) return true;

        const date=this.displayDate();
        return this.disabledKeys().has(
            createDateKey(date.getFullYear(), date.getMonth(), day),
        );
    }

    isDayTagged(day: number): boolean {
        const date=this.displayDate();
        return this.taggedKeys().has(
            createDateKey(date.getFullYear(), date.getMonth(), day),
        );
    }

    isDayMissingRecord(day: number): boolean {
        if(this.isDayTagged(day)) return false;

        const today=this.todayInView();
        if(day === today) return false;
        if(today !== null && day>today) return false;

        return true;
    }

    // Clases CSS dinámicas
    getDayClasses(day: number): string {
        const isToday=this.todayInView() === day;
        const isSelected=this.selectedDay() === day;
        const isDisabled=this.isDayDisabled(day);

        const classes=[
            'relative', 'w-full', 'h-full', 'max-w-[40px]', 'max-h-[40px]',
            'flex', 'items-center', 'justify-center', 'text-sm', 'transition-all',
        ];

        if(isToday) {
            classes.push('bg-blue-600', 'text-white', 'shadow-md', 'z-10', 'scale-100');
        } else if(isSelected) {
            classes.push('bg-blue-100', 'text-blue-700', 'font-bold');
        } else if(!isDisabled) {
            classes.push('text-slate-600', 'hover:bg-slate-100');
        }

        if(isDisabled) {
            classes.push('opacity-25', 'cursor-not-allowed');
        }

        return classes.join(' ');
    }

    // Navegación
    changeMonth(offset: number): void {
        const current=this.displayDate();
        const newDate=new Date(current.getFullYear(), current.getMonth() + offset, 1);
        this.displayDate.set(newDate);
        this.monthChange.emit(newDate);
    }

    // Selección
    selectDay(day: number | null): void {
        if(!day || this.isDayDisabled(day)) return;

        const date=this.displayDate();
        this.selectedDay.set(day);

        const selectedDate=normalizeDate(date.getFullYear(), date.getMonth(), day);
        this.onChange(selectedDate);
        this.onTouched();
        this.daySelect.emit(selectedDate);
    }

    // ControlValueAccessor
    writeValue(value: Date | null | undefined): void {
        if(!value || !(value instanceof Date) || isNaN(value.getTime())) {
            this.selectedDay.set(null);
            return;
        }

        this.displayDate.set(new Date(value.getFullYear(), value.getMonth(), 1));
        this.selectedDay.set(value.getDate());
    }

    registerOnChange(fn: (value: Date | null) => void): void {
        this.onChange=fn;
    }

    registerOnTouched(fn: () => void): void {
        this.onTouched=fn;
    }

    setDisabledState(_isDisabled: boolean): void {
    }

    // Callbacks privados
    private onChange: (value: Date | null) => void=() => {
    };
    private onTouched: () => void=() => {
    };
}
