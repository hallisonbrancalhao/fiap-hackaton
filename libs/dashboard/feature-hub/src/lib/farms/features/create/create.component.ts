import { Component, ChangeDetectionStrategy, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { InputTextModule } from 'primeng/inputtext';
import { ButtonModule } from 'primeng/button';
import { CardComponent } from '@fiap-hackaton/shared-ui';
import { FarmUserFacade } from '@fiap-hackaton/auth-data-access';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';

@Component({
  selector: 'fiap-farms-create',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    InputTextModule,
    ButtonModule,
    CardComponent,
    ToastModule,
  ],
  providers: [MessageService],
  template: `
    <p-toast />
    <div class="p-6">
      <lib-card title="Criar Fazenda" subtitle="Adicione uma nova propriedade rural">
        <form [formGroup]="farmForm" (ngSubmit)="onSubmit()">
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <!-- Nome -->
            <div class="mb-4 md:col-span-2">
              <label for="name" class="block text-sm font-medium text-surface-700 mb-2">
                Nome da Fazenda *
              </label>
              <input
                pInputText
                id="name"
                formControlName="name"
                type="text"
                placeholder="Ex: Fazenda Santa Cruz"
                class="w-full"
                [class.ng-invalid]="hasError('name')"
                [class.ng-dirty]="hasError('name')"
              />
              @if (hasError('name')) {
                <small class="text-red-500 mt-1 block">
                  {{ getErrorMessage('name') }}
                </small>
              }
            </div>

            <!-- Cidade -->
            <div class="mb-4">
              <label for="city" class="block text-sm font-medium text-surface-700 mb-2">
                Cidade *
              </label>
              <input
                pInputText
                id="city"
                formControlName="city"
                type="text"
                placeholder="Ex: São Paulo"
                class="w-full"
                [class.ng-invalid]="hasError('city')"
                [class.ng-dirty]="hasError('city')"
              />
              @if (hasError('city')) {
                <small class="text-red-500 mt-1 block">
                  {{ getErrorMessage('city') }}
                </small>
              }
            </div>

            <!-- Estado -->
            <div class="mb-4">
              <label for="state" class="block text-sm font-medium text-surface-700 mb-2">
                Estado *
              </label>
              <input
                pInputText
                id="state"
                formControlName="state"
                type="text"
                placeholder="Ex: SP"
                class="w-full"
                [class.ng-invalid]="hasError('state')"
                [class.ng-dirty]="hasError('state')"
              />
              @if (hasError('state')) {
                <small class="text-red-500 mt-1 block">
                  {{ getErrorMessage('state') }}
                </small>
              }
            </div>

            <!-- Área -->
            <div class="mb-4">
              <label for="area" class="block text-sm font-medium text-surface-700 mb-2">
                Área (hectares)
              </label>
              <input
                pInputText
                id="area"
                formControlName="area"
                type="number"
                placeholder="Ex: 100"
                class="w-full"
              />
            </div>

            <!-- Endereço -->
            <div class="mb-4">
              <label for="address" class="block text-sm font-medium text-surface-700 mb-2">
                Endereço
              </label>
              <input
                pInputText
                id="address"
                formControlName="address"
                type="text"
                placeholder="Ex: Estrada Rural, 123"
                class="w-full"
              />
            </div>
          </div>

          <!-- Botões -->
          <div class="mt-6 flex gap-2 justify-end">
            <p-button
              type="button"
              label="Cancelar"
              severity="secondary"
              [outlined]="true"
              (onClick)="onCancel()"
            />
            <p-button
              type="submit"
              label="Criar Fazenda"
              icon="pi pi-check"
              [disabled]="farmForm.invalid || isLoading()"
              [loading]="isLoading()"
            />
          </div>
        </form>
      </lib-card>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CreateComponent {
  protected farmForm: FormGroup;
  protected submitted = signal(false);
  protected isLoading = signal(false);

  private fb = inject(FormBuilder);
  private router = inject(Router);
  private farmUserFacade = inject(FarmUserFacade);
  private messageService = inject(MessageService);

  constructor() {
    this.farmForm = this.createForm();
  }

  protected onSubmit(): void {
    this.submitted.set(true);

    if (this.farmForm.invalid) {
      this.markFormGroupTouched(this.farmForm);
      return;
    }

    this.isLoading.set(true);
    const formValue = this.farmForm.value;

    // Criar usuário de fazenda com os dados do formulário
    const farmUser = {
      name: 'Admin', // Nome padrão, poderia vir de um campo ou do usuário logado
      email: 'admin@farm.com', // Email padrão, poderia vir do usuário logado
      farmName: formValue.name,
      location: {
        latitude: 0, // Valores padrão, seria ideal ter um mapa para selecionar
        longitude: 0,
        address: `${formValue.address || ''}, ${formValue.city}, ${formValue.state}`.trim(),
      },
      phone: '', // Opcional
    };

    this.farmUserFacade.create(farmUser).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Fazenda criada com sucesso!',
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard/farms']);
        }, 1500);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: error.message || 'Erro ao criar fazenda',
        });
      },
    });
  }

  protected onCancel(): void {
    this.router.navigate(['/dashboard/farms']);
  }

  protected hasError(fieldName: string): boolean {
    const field = this.farmForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched || this.submitted()));
  }

  protected getErrorMessage(fieldName: string): string {
    const field = this.farmForm.get(fieldName);

    if (!field || !field.errors) {
      return '';
    }

    if (field.errors['required']) {
      return 'Este campo é obrigatório';
    }

    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `O tamanho mínimo é ${minLength} caracteres`;
    }

    return '';
  }

  private createForm(): FormGroup {
    return this.fb.group({
      name: ['', [Validators.required, Validators.minLength(3)]],
      city: ['', [Validators.required]],
      state: ['', [Validators.required]],
      area: [''],
      address: [''],
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
