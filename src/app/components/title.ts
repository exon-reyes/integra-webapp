import {booleanAttribute, ChangeDetectionStrategy, Component, Input} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

@Component({
    selector: 'app-title',
    imports: [NgOptimizedImage],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="flex items-center">
            <!-- Imagen con NgOptimizedImage -->
            @if (hasValidImage) {
                <div
                    class="flex items-center justify-center w-11 h-11 min-w-11 min-h-11 mr-3 bg-white rounded-lg shadow-sm border-b border-gray-200 p-2.5 shrink-0">
                    <img
                        [ngSrc]="imageSrc"
                        [priority]="priority"
                        alt="icon"
                        class="w-full h-full object-contain"
                        height="34"
                        width="34">
                </div>
            } @else if (hasValidIconClass) {
                <div
                    class="flex items-center justify-center w-11 h-11 min-w-11 min-h-11 mr-3 bg-white rounded-lg shadow-sm p-2.5 shrink-0">
            <span
                [attr.aria-label]="title + ' icon'"
                [class]="iconClass + ' w-full h-full !min-w-0 !min-h-0'"
                role="img"></span>
                </div>
            } @else if (shouldShowFallback) {
                <span
                    [attr.aria-label]="title + ' initial'"
                    class="flex items-center justify-center w-11 h-11 min-w-11 min-h-11 mr-3 bg-white text-black text-2xl font-bold rounded-lg shadow-sm shrink-0"
                    role="img">
            {{ titleInitial }}
        </span>
            }

            <!-- Contenido del título -->
            <div class="flex-1">
                <span class="text-xl font-bold block">{{ title }}</span>
                @if (description) {
                    <p class="text-inherit text-md  mb-0">{{ description }}</p>
                }
            </div>
        </div>

    `,
    standalone: true,
})
export class Title {
    @Input({alias: 'enable-icon', transform: booleanAttribute})
    habilitarIcono: boolean=true;

    @Input() imageSrc: string='';
    @Input() iconClass: string='';
    @Input() title: string='';
    @Input() description: string='';
    @Input({transform: booleanAttribute}) priority: boolean=false;

    /**
     * Determina si tiene imagen válida
     */
    get hasValidImage(): boolean {
        return !!this.imageSrc && !this.imageSrc.includes('undefined');
    }

    /**
     * Determina si tiene clase de icono válida
     */
    get hasValidIconClass(): boolean {
        return !!this.iconClass;
    }

    /**
     * Obtiene la primera letra del título en mayúscula
     */
    get titleInitial(): string {
        return this.title?.charAt(0)?.toUpperCase() || '';
    }

    /**
     * Determina si debe mostrar el fallback
     */
    get shouldShowFallback(): boolean {
        return this.habilitarIcono && !this.hasValidImage && !this.hasValidIconClass && !!this.titleInitial;
    }
}
