import { Component, input, computed } from '@angular/core';

@Component({
    selector: 'app-status-badge',
    standalone: true,
    host: {
        '[class]': 'hostClasses()',
        '[style.--badge-color]': 'resolvedColor()',
        '[attr.data-pulsing]': 'pulse()',
    },
    template: `
        <span class="font-semibold tracking-tight leading-none">{{ label() }}</span>
    `,
    styles: `
        :host {
            background-color: var(--badge-color);
        }

        @keyframes status-pulse {
            0% { box-shadow: 0 0 0 0px rgba(255, 255, 255, 0.4); }
            70% { box-shadow: 0 0 0 6px rgba(255, 255, 255, 0); }
            100% { box-shadow: 0 0 0 0px rgba(255, 255, 255, 0); }
        }

        :host([data-pulsing="true"]) {
            animation: status-pulse 2s infinite ease-in-out;
        }
    `
})
export class StatusBadgeComponent {
    // Signal Inputs
    label = input.required<string>();
    color = input<string>('blue'); // Puede ser un preset (blue, cyan...) o un HEX/CSS Var
    pulse = input<boolean>(false);

    // Paleta de colores extraída de tu imagen
    private readonly colorPresets: Record<string, string> = {
        'blue': '#005edb',
        'cyan': '#00b8ff',
        'green': '#00bc7d',
        'red': '#FB2C36',
        'yellow': '#fe9a00'
    };

    // Resolución lógica: Preset > Valor directo (HEX, RGB, Tailwind Var)
    protected resolvedColor = computed(() =>
        this.colorPresets[this.color()] ?? this.color()
    );

    protected hostClasses = computed(() =>
        `inline-flex items-center justify-center px-3 py-1 rounded-md
     text-[11px] text-white antialiased select-none
     cursor-default transition-all duration-200
     hover:brightness-110 active:scale-95 shadow-sm`
    );
}
