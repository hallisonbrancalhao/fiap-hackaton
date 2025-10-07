import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'lib-loading',
  imports: [CommonModule],
  template: `
    <div
      class="flex flex-col items-center justify-center"
      [class.h-screen]="fullScreen()"
      [class.py-12]="!fullScreen()"
    >
      <div
        class="animate-spin rounded-full border-4 border-primary-200 border-t-primary-500"
        [class.h-12]="size() === 'small'"
        [class.w-12]="size() === 'small'"
        [class.h-16]="size() === 'medium'"
        [class.w-16]="size() === 'medium'"
        [class.h-20]="size() === 'large'"
        [class.w-20]="size() === 'large'"
      ></div>

      @if (message()) {
        <p class="mt-4 text-surface-600 dark:text-surface-400 text-center">
          {{ message() }}
        </p>
      }
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class LoadingComponent {
  size = input<'small' | 'medium' | 'large'>('medium');
  message = input<string>('');
  fullScreen = input<boolean>(false);
}
