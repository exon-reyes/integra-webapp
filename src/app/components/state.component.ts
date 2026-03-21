import { Component, Input } from '@angular/core';
import { NgOptimizedImage } from "@angular/common";

@Component({
    selector: 'app-state',
    standalone: true,
    imports: [NgOptimizedImage],
    template: `
        <div class="flex flex-col items-center justify-center py-16 px-4 bg-gradient-to-r from-indigo-50 to-slate-50 rounded-lg border border-slate-200 text-center">
            <div class="flex items-center justify-center mb-6">
                <img [height]="iconHeight" [ngSrc]="iconSrc" [width]="iconWidth" alt="Icono de estado">
            </div>
            <h3 [class]="titleSize + ' font-bold text-slate-800 mb-2'">
                {{ title }}
            </h3>
            <p [class]="descriptionSize + ' font-medium text-center max-w-md mx-auto leading-relaxed'">
                {{ description }}
            </p>
        </div>
    `,
})
export class StateComponent {
    @Input() title: string = '';
    @Input() description: string = '';
    @Input() titleSize: string = 'text-2xl'; // Un poco más grande para el estilo moderno
    @Input() descriptionSize: string = 'text-md';
    @Input() iconSrc: string = '/assets/icon/search2.svg';
    @Input() iconWidth: number = 100;
    @Input() iconHeight: number = 80;
}
