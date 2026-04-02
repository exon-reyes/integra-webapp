import {ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

export interface InfoItem {
    subtitle: string;
    description: string;
}

@Component({
    selector: 'app-info-card',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        @if (isVisible) {
            <div
                class="mb-5 p-4 border-l-4 border-indigo-600 bg-white shadow-md rounded-lg transition-all duration-300">
                <div class="flex items-start gap-3">
                    <div class="flex-shrink-0 mt-1">
                        <i [class]="iconClass"></i>
                    </div>

                    <div class="flex-grow">
                        <div class="text-base font-bold text-gray-800">{{ title }}</div>
                        @for (item of items; track $index) {
                            <div class="text-sm font-medium mt-1">
                                <span class="font-semibold text-indigo-700">{{ item.subtitle }}
                                    :</span> {{ item.description }}
                            </div>
                        }
                    </div>

                    <button type="button" (click)="close()"
                            class="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none transition-colors cursor-pointer ml-2"
                            aria-label="Cerrar">
                        <i class="pi pi-times text-lg"></i>
                    </button>
                </div>
            </div>
        }
    `,
})
export class InfoList {
    @Input() title='';
    @Input() items: InfoItem[]=[];
    @Input() iconClass='pi pi-info-circle text-2xl text-indigo-600';

    // Estado de visibilidad
    isVisible=true;

    close() {
        this.isVisible=false;
    }
}
