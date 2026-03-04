import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

export interface StepItem {
    label: string;
    subtitle?: string;
}

type StepStatus = 'completed' | 'active' | 'pending';

@Component({
    selector: 'app-stepper-widget',
    standalone:true,
    changeDetection: ChangeDetectionStrategy.OnPush,
    template: `
    <nav aria-label="Progress" class="flex w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50">
      @for (step of stepsWithStatus(); track step.label; let last = $last) {
        <div
          role="listitem"
          [attr.aria-current]="step.status === 'active' ? 'step' : null"
          class="relative flex flex-1 items-center gap-4 px-8 py-4 text-sm transition-colors duration-300 select-none"
          [class.bg-white]="step.status !== 'pending'"
          [class.bg-gray-50]="step.status === 'pending'"
        >

          <!-- Badge -->
          <div
            aria-hidden="true"
            class="flex size-9 shrink-0 items-center justify-center rounded-full border-2 text-sm font-semibold transition-all duration-300"
            [class.bg-green-600]="step.status === 'completed'"
            [class.border-green-600]="step.status == 'completed'"
            [class.border-blue-600]="step.status !== 'pending'"
            [class.text-white]="step.status === 'completed'"
            [class.text-blue-600]="step.status === 'active'"
            [class.bg-white]="step.status === 'active'"
            [class.border-gray-300]="step.status === 'pending'"
            [class.text-gray-400]="step.status === 'pending'"
          >
            @if (step.status === 'completed') {
              <svg class="size-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="3,8 6.5,11.5 13,5"/>
              </svg>
            } @else {
              {{ step.index }}
            }
          </div>

          <!-- Labels -->
          <div class="flex min-w-0 flex-col">
            <span
              class="truncate text-lg  font-semibold leading-tight"
              [class.text-blue-600]="step.status === 'active'"
              [class.text-gray-800]="step.status === 'completed'"
              [class.text-gray-400]="step.status === 'pending'"
            >{{ step.label }}</span>

            @if (step.subtitle) {
              <span
                class="truncate text-sm leading-tight mt-0.5"
                [class.text-blue-700]="step.status === 'active'"
                [class.text-gray-400]="step.status === 'completed'"
                [class.text-gray-300]="step.status === 'pending'"
              >{{ step.subtitle }}</span>
            }
          </div>
        </div>
      }
    </nav>
  `,
})
export class StepperWidgetComponent {
    steps = input.required<StepItem[]>();
    currentStep = input<number>(0);

    protected stepsWithStatus = computed(() =>
        this.steps().map((step, i) => ({
            ...step,
            index: (i + 1).toString().padStart(2, '0'),
            status: (i < this.currentStep() ? 'completed' : i === this.currentStep() ? 'active' : 'pending') as StepStatus,
        }))
    );
}
