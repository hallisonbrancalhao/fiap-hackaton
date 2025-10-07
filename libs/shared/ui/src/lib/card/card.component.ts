import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-card',
  imports: [CommonModule],
  template: `
    <div
      class="bg-surface-0 dark:bg-surface-900 rounded-lg shadow-md p-6 border border-surface-200 dark:border-surface-700"
      [class]="customClass()"
    >
      @if (title()) {
        <div class="mb-4">
          <h3 class="text-xl font-semibold text-surface-900 dark:text-surface-0">
            {{ title() }}
          </h3>
          @if (subtitle()) {
            <p class="text-sm text-surface-500 dark:text-surface-400 mt-1">
              {{ subtitle() }}
            </p>
          }
        </div>
      }

      <div>
        <ng-content></ng-content>
      </div>

      @if (hasFooter()) {
        <div class="mt-4 pt-4 border-t border-surface-200 dark:border-surface-700">
          <ng-content select="[footer]"></ng-content>
        </div>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardComponent {
  title = input<string>();
  subtitle = input<string>();
  customClass = input<string>('');
  hasFooter = input<boolean>(false);
}
