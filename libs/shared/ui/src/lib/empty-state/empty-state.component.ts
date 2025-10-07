import { Component, ChangeDetectionStrategy, input, output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';

@Component({
  selector: 'lib-empty-state',
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-4">
      @if (icon()) {
        <i [class]="icon() + ' text-6xl text-surface-400 dark:text-surface-600 mb-4'"></i>
      }

      <h3 class="text-xl font-semibold text-surface-700 dark:text-surface-300 mb-2">
        {{ title() }}
      </h3>

      @if (description()) {
        <p class="text-surface-500 dark:text-surface-400 text-center max-w-md mb-6">
          {{ description() }}
        </p>
      }

      @if (actionLabel()) {
        <p-button
          [label]="actionLabel()"
          [icon]="actionIcon()"
          (onClick)="actionClick.emit()"
          severity="primary"
        />
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmptyStateComponent {
  icon = input<string>('pi pi-inbox');
  title = input<string>('No data available');
  description = input<string>('');
  actionLabel = input<string>('');
  actionIcon = input<string>('pi pi-plus');

  actionClick = output<void>();
}
