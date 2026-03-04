import {Component, Input} from '@angular/core';
import {NgClass} from '@angular/common';

@Component({
    selector: 'app-spinner',
    standalone: true,
    imports: [NgClass],
    template: `
        <div [ngClass]="{ 'loading-overlay': modal }">
            <div class="flex flex-col items-center justify-center content-center">
                <div
                    class="w-20 h-20 border-4 border-transparent text-blue-400 text-4xl animate-spin flex items-center justify-center border-t-blue-400 rounded-full">
                    <div
                        class="w-16 h-16 border-4 border-transparent text-orange-400 text-2xl animate-spin flex items-center justify-center border-t-orange-400 rounded-full"></div>
                </div>
                <div class="text-center flex  text-2xl mt-4">
                    <p>{{ title }}</p>
                    <div class="text-sm">{{ message }}</div>
                </div>
            </div>
        </div>
    `,
})
export class SpinnerComponent {
    @Input() title: string | undefined;
    @Input() message: string | undefined;
    @Input() modal: boolean=false;
}
