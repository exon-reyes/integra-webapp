import {
    Component,
    Input,
    OnChanges,
    SimpleChanges,
    ChangeDetectionStrategy,
    computed,
    signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';

export interface BarSlice {
    label: string;
    value: number;
    color: string;
    textColor?: string;
}

interface ComputedSlice extends BarSlice {
    percentage: number;
    flex: number;
}

@Component({
    selector: 'app-segmented-bar',
    standalone: true,
    imports: [DecimalPipe],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div>
            <div style="display:flex;height:10px;border-radius:99px;overflow:hidden;gap:2px;margin-bottom:16px;">
                @for (slice of computed; track slice.label) {
                    <div [style.flex]="slice.flex" [style.background]="slice.color"></div>
                }
            </div>

            <div style="display:flex;flex-direction:column;gap:8px;">
                @for (slice of computed; track slice.label) {
                    <div style="display:flex;align-items:center;gap:10px;">
                        <span
                            style="width:8px;height:8px;border-radius:50%;flex-shrink:0;display:inline-block;"
                            [style.background]="slice.color"
                        ></span>
                        <span style="font-size:12px;color:var(--color-text-secondary);flex:1;">
                            {{ slice.label }}
                        </span>
                        <span
                            style="font-size:13px;font-weight:500;min-width:20px;text-align:right;"
                            [style.color]="slice.textColor ?? slice.color"
                        >
                            {{ slice.value }}
                        </span>
                        <span style="font-size:11px;color:var(--color-text-tertiary);min-width:34px;text-align:right;">
                            {{ slice.percentage | number:'1.0-0' }}%
                        </span>
                    </div>
                }
            </div>
        </div>
    `,
})
export class SegmentedBarComponent implements OnChanges {
    @Input() data: BarSlice[] = [];

    computed: ComputedSlice[] = [];
    total = 0;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            this.compute();
        }
    }

    private compute(): void {
        this.total = this.data.reduce((s, d) => s + d.value, 0);
        if (this.total === 0) { this.computed = []; return; }

        this.computed = this.data.map((slice) => {
            const pct = slice.value / this.total;
            return {
                ...slice,
                percentage: pct * 100,
                flex: slice.value,
            };
        });
    }
}
