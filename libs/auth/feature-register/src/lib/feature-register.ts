import { Component, ChangeDetectionStrategy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { DialogService, DynamicDialogRef } from 'primeng/dynamicdialog';
import { CardComponent } from '@fiap-hackaton/shared-ui';
import { AuthRegisterFacade } from '@fiap-hackaton/auth-data-access';
import { MapLocationPickerComponent } from './map-location-picker/map-location-picker.component';

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'fiap-farms-register',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    PasswordModule,
    MessageModule,
    CardComponent,
  ],
  providers: [DialogService],
  templateUrl: './feature-register.html',
  styleUrl: './feature-register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class FeatureRegister {
  protected registerFacade = inject(AuthRegisterFacade);
  protected registerForm: FormGroup;
  protected submitted = signal(false);

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private dialogService = inject(DialogService);
  private dialogRef: DynamicDialogRef | null = null;

  constructor() {
    this.registerForm = this.createForm();
  }

  protected onSubmit(): void {
    this.submitted.set(true);

    if (this.registerForm.invalid) {
      this.markFormGroupTouched(this.registerForm);
      return;
    }

    const formValue = this.registerForm.value;

    const registerData = {
      name: formValue.name,
      email: formValue.email,
      password: formValue.password,
      farmName: formValue.farmName,
      phone: formValue.phone,
      location: {
        latitude: formValue.latitude,
        longitude: formValue.longitude,
        address: formValue.address,
      },
    };

    this.registerFacade.register(registerData).subscribe({
      next: () => {
        // Redireciona para login após registro bem-sucedido
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 1500);
      },
      error: () => {
        // Registration error handled by facade
      },
    });
  }

  protected onLoginClick(): void {
    this.router.navigate(['/auth/login']);
  }

  protected onOpenMapPicker(): void {
    this.dialogRef = this.dialogService.open(MapLocationPickerComponent, {
      header: 'Selecione a localização da sua fazenda',
      width: '80vw',
      height: '80vh',
      modal: true,
      draggable: false,
      resizable: false,
    });

    if (this.dialogRef) {
      this.dialogRef.onClose.subscribe((location: LocationCoordinates | null) => {
        if (location) {
          this.registerForm.patchValue({
            latitude: location.latitude,
            longitude: location.longitude,
          });
        }
      });
    }
  }

  protected hasError(fieldName: string): boolean {
    const field = this.registerForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted()));
  }

  protected getErrorMessage(fieldName: string): string {
    const field = this.registerForm.get(fieldName);

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

    if (field.errors['mismatch']) {
      return 'As senhas não coincidem';
    }

    return '';
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      farmName: ['', [Validators.required, Validators.minLength(3)]],
      phone: [''],
      address: ['', [Validators.required]],
      latitude: [0, [Validators.required]],
      longitude: [0, [Validators.required]],
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;

    if (password !== confirmPassword) {
      group.get('confirmPassword')?.setErrors({ mismatch: true });
      return { mismatch: true };
    }

    return null;
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
