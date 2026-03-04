import {ChangeDetectionStrategy, Component, computed, input} from '@angular/core';
import {NgOptimizedImage} from '@angular/common';

export interface ContentTitle {
    text: string;
    colorClass?: string;
}

type IconType='image' | 'prime' | 'isc' | 'none';


@Component({
    selector: 'app-content-component',
    standalone: true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    imports: [NgOptimizedImage],
    host: {
        class: 'block',
    },
    template: `
        <figure class="flex flex-col items-center text-center gap-3" role="group">

            @if (iconType() !== 'none') {
                <div
                    class="flex items-center justify-center rounded-xl bg-gray-100 transition-colors"
                    [style.width.rem]="containerRem()"
                    [style.height.rem]="containerRem()"
                    aria-hidden="true"
                >

                    <!-- IMAGE -->
                    @if (iconType() === 'image') {
                        <img
                            [ngSrc]="icon()!"
                            width="40"
                            height="40"
                            alt=""
                            class="object-contain"
                            [style.width.rem]="imageRem()"
                            [style.height.rem]="imageRem()"
                        />
                    }

                    <!-- PRIME ICON -->
                    @if (iconType() === 'prime') {
                        <i
                            [class]="primeBaseClass()"
                            [style.font-size.rem]="primeRem()"
                        ></i>
                    }

                    <!-- ISC ICON -->
                    @if (iconType() === 'isc') {
                        <i
                            [class]="iscBaseClass()"
                            [style.width.rem]="iscRem()"
                            [style.height.rem]="iscRem()"
                        ></i>
                    }

                </div>
            }

            @if (title()) {
                <figcaption
                    class="text-base font-semibold tracking-tight"
                    [class]="titleColorClass()"
                >
                    {{ title()!.text }}
                </figcaption>
            }

            @if (description()) {
                <p class="max-w-md text-sm text-gray-600">
                    {{ description() }}
                </p>
            }

            <ng-content/>

        </figure>
    `,
})

/**
 * Componente reutilizable para mostrar contenido con icono, título y descripción.
 *
 * @example
 * ```html
 * <!-- Icono PrimeIcons con título personalizado -->
 * <app-content-component
 *     [iconClass]="'pi pi-check'"
 *     [primeRem]="2.5"
 *     [containerRem]="4"
 *     [title]="{ text: 'Usuarios', colorClass: 'text-blue-600' }"
 * />
 *
 * <!-- Icono PrimeIcons con animación de rotación -->
 * <app-content-component
 *     [iconClass]="'pi pi-cog'"
 *     [spin]="true"
 *     [primeRem]="2.2"
 *     [title]="{ text: 'Procesando' }"
 * />
 *
 * <!-- Icono personalizado ISC -->
 * <app-content-component
 *     [iconClass]="'isc i-expired'"
 *     [iscRem]="2"
 *     [containerRem]="4"
 *     [title]="{ text: 'Roles' }"
 * />
 *
 * <!-- Imagen SVG como icono -->
 * <app-content-component
 *     [icon]="'/assets/icon/layout.svg'"
 *     [imageRem]="2"
 *     [containerRem]="5"
 *     [title]="{ text: 'Layout' }"
 * />
 * ```
 *
 * @property {string} icon - URL de la imagen del icono (opcional)
 * @property {string} iconClass - Clases CSS para iconos PrimeIcons o ISC (opcional)
 * @property {number} containerRem - Tamaño del contenedor del icono en REM (por defecto: 3.5)
 * @property {number} imageRem - Tamaño de la imagen en REM (por defecto: 1.5)
 * @property {number} primeRem - Tamaño del icono PrimeIcons en REM (por defecto: 1.8)
 * @property {number} iscRem - Tamaño del icono ISC en REM (por defecto: 1.6)
 * @property {boolean} spin - Aplica animación de rotación al icono (por defecto: false)
 * @property {ContentTitle} title - Objeto con texto y clase de color opcional para el título
 * @property {string} description - Texto descriptivo debajo del título (opcional)
 */
export class StateContent {

    /* ===============================
       Inputs
    =============================== */

    readonly icon=input<string | undefined>();
    readonly iconClass=input<string | undefined>();

    // Tamaños en REM → robusto y libre
    readonly containerRem=input<number>(3.5);
    readonly imageRem=input<number>(1.5);
    readonly primeRem=input<number>(1.8);
    readonly iscRem=input<number>(1.6);

    readonly spin=input<boolean>(false);

    readonly title=input<ContentTitle | undefined>();
    readonly description=input<string | undefined>();

    /* ===============================
       Derived State
    =============================== */

    readonly iconType=computed<IconType>(() => {
        if(this.icon()) return 'image';

        const cls=this.iconClass();
        if(!cls) return 'none';

        if(cls.includes('pi ')) return 'prime';
        if(cls.includes('isc')) return 'isc';

        return 'none';
    });

    readonly primeBaseClass=computed(() => {
        const spinClass=this.spin() ? 'pi-spin' : '';
        return `${this.iconClass() ?? ''} ${spinClass}`;
    });

    readonly iscBaseClass=computed(() =>
        `${this.iconClass() ?? ''}`,
    );

    readonly titleColorClass=computed(() =>
        this.title()?.colorClass ?? 'text-gray-900',
    );
}
