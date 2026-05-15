import {ChangeDetectionStrategy, Component, Input, OnChanges, SimpleChanges,} from '@angular/core';
import {DecimalPipe} from "@angular/common";

export interface DonutSlice {
    label: string;
    value: number;
    color: string;
}

interface ComputedSlice extends DonutSlice {
    percentage: number;
    dasharray: string;
    startAngle: number;
}

@Component({
    selector: 'app-donut-chart',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex items-center gap-6">

            <div class="relative shrink-0" [style.width.px]="size" [style.height.px]="size">
                <svg [attr.width]="size" [attr.height]="size" [attr.viewBox]="'0 0 ' + size + ' ' + size">

                    <circle
                        [attr.cx]="center"
                        [attr.cy]="center"
                        [attr.r]="radius"
                        fill="none"
                        stroke="#F1EFE8"
                        [attr.stroke-width]="thickness"
                    />

                    @for (slice of computed; track slice.label) {
                        <circle
                            [attr.cx]="center"
                            [attr.cy]="center"
                            [attr.r]="radius"
                            fill="none"
                            [attr.stroke]="slice.color"
                            [attr.stroke-width]="thickness"
                            stroke-linecap="butt"
                            [attr.stroke-dasharray]="slice.dasharray"
                            stroke-dashoffset="0"
                            [attr.transform]="'rotate(' + slice.startAngle + ' ' + center + ' ' + center + ')'"
                        />
                    }

                    @if (centerLabel !== null && centerLabel !== '') {
                        <text
                            [attr.x]="center"
                            [attr.y]="center - 8"
                            text-anchor="middle"
                            dominant-baseline="middle"
                            class="fill-gray-800"
                            [style.font-size.px]="size * 0.13"
                            font-weight="500"
                        >{{ centerLabel }}
                        </text>
                    }

                    @if (centerSublabel) {
                        <text
                            [attr.x]="center"
                            [attr.y]="center + 12"
                            text-anchor="middle"
                            dominant-baseline="middle"
                            class="fill-gray-500"
                            [style.font-size.px]="size * 0.09"
                        >{{ centerSublabel }}
                        </text>
                    }

                </svg>
            </div>

            <div class="flex flex-col gap-2.5 min-w-0">
                @for (slice of computed; track slice.label) {
                    <div class="flex items-center gap-2 text-sm">
                        <span
                            class="shrink-0 rounded-sm"
                            [style.background]="slice.color"
                            style="width:10px;height:10px;"
                        ></span>
                        <span class="text-gray-600 truncate">{{ slice.label }}</span>
                        <span class="font-medium text-gray-900 ml-auto pl-3 tabular-nums">
                            {{ slice.value }}
                            @if (showPercentage) {
                                <span class="text-gray-500 font-normal text-xs">({{ slice.percentage | number:'1.0-0' }}
                                    %)</span>
                            }
                        </span>
                    </div>
                }
            </div>

        </div>
    `,
    imports: [
        DecimalPipe
    ]
})
export class DonutChartComponent implements OnChanges {
    @Input() data: DonutSlice[]=[];
    @Input() size=160;
    @Input() thickness=24;
    @Input() gap=2;
    @Input() centerLabel: string | number='';
    @Input() centerSublabel='';
    @Input() showPercentage=true;

    computed: ComputedSlice[]=[];
    total=0;

    get center(): number {
        return this.size / 2;
    }

    get radius(): number {
        return (this.size - this.thickness) / 2;
    }

    get circumference(): number {
        return 2 * Math.PI * this.radius;
    }

    ngOnChanges(changes: SimpleChanges): void {
        if(changes['data'] || changes['size'] || changes['thickness'] || changes['gap']) {
            this.compute();
        }
    }

    private compute(): void {
        this.total=this.data.reduce((s,
                                     d) => s + d.value, 0);
        if(this.total === 0) {
            this.computed=[];
            return;
        }

        const gapAngle=this.gap;
        let angle=-90;

        this.computed=this.data.map((slice) => {
            const pct=slice.value / this.total;
            const sliceAngle=pct * 360;
            const arc=(this.circumference * (sliceAngle - gapAngle)) / 360;
            const startAngle=angle;
            angle+=sliceAngle;

            return {
                ...slice,
                percentage: pct * 100,
                dasharray: `${Math.max(arc, 0)} ${this.circumference}`,
                startAngle,
            };
        });
    }
}
