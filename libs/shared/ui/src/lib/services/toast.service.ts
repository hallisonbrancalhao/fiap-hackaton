import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastOptions {
  severity?: ToastSeverity;
  summary?: string;
  detail: string;
  life?: number;
  sticky?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ToastService {
  private messageService = inject(MessageService);

  /**
   * Display a success toast notification
   * @param detail - The main message to display
   * @param summary - Optional title for the toast (defaults to 'Sucesso')
   * @param life - Optional duration in ms (defaults to 3000)
   */
  success(detail: string, summary = 'Sucesso', life = 3000): void {
    this.messageService.add({
      severity: 'success',
      summary,
      detail,
      life,
    });
  }

  /**
   * Display an info toast notification
   * @param detail - The main message to display
   * @param summary - Optional title for the toast (defaults to 'Informação')
   * @param life - Optional duration in ms (defaults to 3000)
   */
  info(detail: string, summary = 'Informação', life = 3000): void {
    this.messageService.add({
      severity: 'info',
      summary,
      detail,
      life,
    });
  }

  /**
   * Display a warning toast notification
   * @param detail - The main message to display
   * @param summary - Optional title for the toast (defaults to 'Atenção')
   * @param life - Optional duration in ms (defaults to 4000)
   */
  warn(detail: string, summary = 'Atenção', life = 4000): void {
    this.messageService.add({
      severity: 'warn',
      summary,
      detail,
      life,
    });
  }

  /**
   * Display an error toast notification
   * @param detail - The main message to display
   * @param summary - Optional title for the toast (defaults to 'Erro')
   * @param life - Optional duration in ms (defaults to 5000)
   */
  error(detail: string, summary = 'Erro', life = 5000): void {
    this.messageService.add({
      severity: 'error',
      summary,
      detail,
      life,
    });
  }

  /**
   * Display a custom toast notification with full control over options
   * @param options - Complete toast configuration
   */
  show(options: ToastOptions): void {
    this.messageService.add({
      severity: options.severity || 'info',
      summary: options.summary || 'Notificação',
      detail: options.detail,
      life: options.life || 3000,
      sticky: options.sticky || false,
    });
  }

  /**
   * Clear all active toast notifications
   */
  clear(): void {
    this.messageService.clear();
  }

  /**
   * Clear a specific toast notification by key
   * @param key - The key of the toast to clear
   */
  clearByKey(key: string): void {
    this.messageService.clear(key);
  }

  /**
   * Helper method to display error from caught exceptions
   * @param error - The caught error object
   * @param fallbackMessage - Message to show if error has no message
   */
  showError(error: unknown, fallbackMessage = 'Ocorreu um erro inesperado'): void {
    let errorMessage = fallbackMessage;

    if (error instanceof Error) {
      errorMessage = error.message || fallbackMessage;
    } else if (typeof error === 'string') {
      errorMessage = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      errorMessage = String((error as { message: unknown }).message) || fallbackMessage;
    }

    this.error(errorMessage);
  }
}
