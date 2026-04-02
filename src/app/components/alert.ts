import {ChangeDetectionStrategy, Component, computed, Input} from '@angular/core';
import {CommonModule} from '@angular/common';

export type AlertType='success' | 'warning' | 'error' | 'info' | 'neutral';

interface AlertConfig {
    containerClass: string;
    ringClass: string;
    titleClass: string;
    descriptionClass: string;
    iconClass: string;
}

const ALERT_CONFIG: Record<AlertType, AlertConfig>={
    success: {
        containerClass: 'bg-green-50',
        ringClass: 'ring-green-200',
        titleClass: 'text-green-700',
        descriptionClass: 'text-green-800',
        iconClass: 'text-green-500',
    },
    warning: {
        containerClass: 'bg-yellow-50',
        ringClass: 'ring-yellow-300',
        titleClass: 'text-yellow-700',
        descriptionClass: 'text-yellow-800',
        iconClass: 'text-yellow-500',
    },
    error: {
        containerClass: 'bg-red-50',
        ringClass: 'ring-red-200',
        titleClass: 'text-red-700',
        descriptionClass: 'text-red-800',
        iconClass: 'text-red-500',
    },
    info: {
        containerClass: 'bg-blue-50',
        ringClass: 'ring-blue-200',
        titleClass: 'text-blue-700',
        descriptionClass: 'text-blue-800',
        iconClass: 'text-blue-500',
    },
    neutral: {
        containerClass: 'bg-gray-50',
        ringClass: 'ring-gray-200',
        titleClass: 'text-gray-700',
        descriptionClass: 'text-gray-800',
        iconClass: 'text-gray-500',
    },
};

@Component({
    selector: 'app-alert',
    standalone: true,
    imports: [CommonModule],
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
        <div class="w-full">
            <div
                class="rounded-lg p-4 ring-1 ring-inset"
                [ngClass]="[config().containerClass, config().ringClass]"
                role="alert"
                [attr.aria-live]="type === 'error' ? 'assertive' : 'polite'"
            >
                <div class="flex items-start gap-x-4">
                    <div class="shrink-0">
                        <!-- Success icon -->
                        @if (type === 'success') {
                            <i class="pi pi-check-circle" [ngClass]="config().iconClass" style="font-size: 1.5rem"></i>
                        }

                        <!-- Warning icon -->
                        @if (type === 'warning') {
                            <i class="pi pi-exclamation-triangle" [ngClass]="config().iconClass" style="font-size: 1.5rem"></i>
                        }

                        <!-- Error icon -->
                        @if (type === 'error') {
                            <i class="pi pi-times-circle" [ngClass]="config().iconClass"  style="font-size: 1.5rem"></i>
                        }

                        <!-- Info / Neutral icon -->
                        @if (type === 'info' || type === 'neutral') {
                            <i class="pi pi-info-circle" [ngClass]="config().iconClass" style="font-size: 1.5rem"></i>
                        }
                    </div>

                    <div class="flex-1">
                        <div class="text-md font-semibold" [ngClass]="config().titleClass">
                            {{ title }}
                        </div>
                        @if (description) {
                            <div class="mt-1">
                                <p class="text-sm font-medium" [ngClass]="config().descriptionClass">
                                    {{ description }}
                                </p>
                            </div>
                        }
                    </div>
                </div>
            </div>
        </div>
    `,
})
export class AlertComponent {
    @Input({required: true}) type: AlertType='info';
    @Input({required: true}) title: string='';
    @Input() description?: string;

    protected config=computed<AlertConfig>(() => ALERT_CONFIG[this.type]);
}
