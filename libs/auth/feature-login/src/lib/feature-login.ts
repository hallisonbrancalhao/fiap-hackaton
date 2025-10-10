import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { CardComponent } from '@fiap-hackaton/shared-ui';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';

@Component({
  selector: 'fiap-farms-login',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    MessageModule,
    CardComponent,
  ],
  templateUrl: './feature-login.html',
  styleUrl: './feature-login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureLogin {
  protected authFacade = inject(AuthLoginFacade);
  protected loginForm: FormGroup;
  protected submitted = signal(false);

  private fb = inject(FormBuilder);
  private router = inject(Router);

  constructor() {
    this.loginForm = this.createForm();
  }

  protected onSubmit(): void {
    this.submitted.set(true);

    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    const credentials = this.loginForm.value;

    this.authFacade.login(credentials).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },
      error: () => {
        // Login error handled by facade
      },
    });
  }

  protected onRegisterClick(): void {
    this.router.navigate(['/auth/register']);
  }

  protected hasError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted()));
  }

  protected getErrorMessage(fieldName: string): string {
    const field = this.loginForm.get(fieldName);

    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo é obrigatório';
    }

    if (field.errors['email']) {
      return 'Por favor, insira um e-mail válido';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `O tamanho mínimo é ${minLength} caracteres`;
    }

    return '';
  }

  private createForm(): FormGroup {
    return this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
    });
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();

      if (control instanceof FormGroup) {
        this.markFormGroupTouched(control);
      }
    });
  }
}
