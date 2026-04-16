import {ChangeDetectionStrategy, Component, Input} from '@angular/core';

export type WidgetColor=
    | 'blue'
    | 'indigo'
    | 'green'
    | 'red'
    | 'yellow'
    | 'purple'
    | 'gray';

@Component({
    selector: 'app-stat-widget',
    standalone: true,
    imports: [],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="bg-white shadow rounded-lg p-4 flex items-center gap-4">

            <div
                class="w-12 h-12 rounded-lg flex items-center justify-center shadow-md text-white"
                [class]="colorClasses.iconBg">

                <span
                    [class]="icon"
                    class="flex items-center justify-center text-lg">
                </span>

            </div>

            <div>
                <div
                    class="text-2xl font-bold"
                    [class]="colorClasses.title">
                    {{ title }}
                </div>

                <div
                    class="text-sm font-medium"
                    [class]="colorClasses.subtitle">
                    {{ subtitle }}
                </div>
            </div>

        </div>
    `,
})
export class StatWidgetComponent {

    @Input({required: true}) title!: string | number;
    @Input({required: true}) subtitle!: string;
    @Input({required: true}) icon!: string;
    @Input() color: WidgetColor='blue';

    private readonly colorMap: Record<WidgetColor, any>={
        blue: {
            iconBg: 'bg-gradient-to-tr from-blue-500 to-cyan-500',
            title: 'text-blue-800',
            subtitle: 'text-blue-600',
        },
        indigo: {
            iconBg: 'bg-gradient-to-tr from-indigo-500 to-violet-500',
            title: 'text-indigo-800',
            subtitle: 'text-indigo-600',
        },
        green: {
            iconBg: 'bg-gradient-to-tr from-emerald-500 to-green-400',
            title: 'text-green-800',
            subtitle: 'text-green-600',
        },
        red: {
            iconBg: 'bg-gradient-to-tr from-red-500 to-orange-500',
            title: 'text-red-800',
            subtitle: 'text-red-600',
        },
        yellow: {
            iconBg: 'bg-gradient-to-tr from-amber-500 to-yellow-400',
            title: 'text-yellow-800',
            subtitle: 'text-yellow-600',
        },
        purple: {
            iconBg: 'bg-gradient-to-tr from-purple-500 to-fuchsia-500',
            title: 'text-purple-800',
            subtitle: 'text-purple-600',
        },
        gray: {
            iconBg: 'bg-gradient-to-tr from-slate-500 to-slate-400',
            title: 'text-gray-800',
            subtitle: 'text-gray-600',
        },
    };

    get colorClasses() {
        return this.colorMap[this.color] ?? this.colorMap.blue;
    }
}
