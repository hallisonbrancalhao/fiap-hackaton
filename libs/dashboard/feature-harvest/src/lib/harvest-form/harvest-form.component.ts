import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { ButtonModule } from 'primeng/button';
import { CardModule } from 'primeng/card';
import { SelectModule } from 'primeng/select';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { TextareaModule } from 'primeng/textarea';
import { FloatLabelModule } from 'primeng/floatlabel';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { Timestamp } from '@angular/fire/firestore';
import { HarvestFacade, ProductionFacade } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { Harvest, HARVEST_QUALITY, Production } from '@fiap-hackaton/dashboard-domain';

@Component({
  selector: 'lib-harvest-form',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    ButtonModule,
    CardModule,
    SelectModule,
    DatePickerModule,
    InputTextModule,
    TextareaModule,
    FloatLabelModule,
    ToastModule,
  ],
  providers: [MessageService],
  templateUrl: './harvest-form.component.html',
  styleUrls: ['./harvest-form.component.css'],
})
export class HarvestFormComponent implements OnInit {
  private fb = inject(FormBuilder);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private harvestFacade = inject(HarvestFacade);
  private productionFacade = inject(ProductionFacade);
  private authFacade = inject(AuthLoginFacade);

  harvestForm!: FormGroup;
  isLoading = signal(false);
  productions = signal<Production[]>([]);
  productionOptions = signal<{ label: string; value: string; production: Production }[]>([]);

  qualityOptions = [
    { label: 'Excelente', value: HARVEST_QUALITY.EXCELLENT },
    { label: 'Boa', value: HARVEST_QUALITY.GOOD },
    { label: 'Média', value: HARVEST_QUALITY.AVERAGE },
    { label: 'Ruim', value: HARVEST_QUALITY.POOR },
  ];

  ngOnInit(): void {
    this.initForm();
    this.loadProductions();
  }

  private initForm(): void {
    this.harvestForm = this.fb.group({
      productionId: ['', Validators.required],
      quantityHarvested: [0, [Validators.required, Validators.min(0)]],
      quantityLost: [0, Validators.min(0)],
      quality: [HARVEST_QUALITY.GOOD, Validators.required],
      gradeA: [0, Validators.min(0)],
      gradeB: [0, Validators.min(0)],
      gradeC: [0, Validators.min(0)],
      harvestDate: [new Date(), Validators.required],
      harvestStartTime: [''],
      harvestEndTime: [''],
      harvestCost: [0, Validators.min(0)],
      laborCost: [0, Validators.min(0)],
      equipmentCost: [0, Validators.min(0)],
      transportCost: [0, Validators.min(0)],
      weatherConditions: [''],
      temperature: [null],
      humidity: [null],
      workersCount: [null, Validators.min(0)],
      hoursWorked: [null, Validators.min(0)],
      notes: [''],
    });
  }

  private loadProductions(): void {
    this.isLoading.set(true);
    const userId = this.authFacade.currentUser()?.id;

    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Usuário não autenticado',
      });
      this.router.navigate(['/auth/login']);
      return;
    }

    this.productionFacade.getActiveProductions(userId).subscribe({
      next: (productions) => {
        this.productions.set(productions);
        this.productionOptions.set(
          productions
            .filter((p) => p.id)
            .map((p) => ({
              label: `${p.productName} - Plantado em ${this.formatDate(p.plantingDate)}`,
              value: p.id,
              production: p,
            }))
        );
        this.isLoading.set(false);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao carregar plantios disponíveis',
        });
        this.isLoading.set(false);
      },
    });
  }

  onProductionChange(event: { value: string }): void {
    const productionId = event.value;
    const production = this.productions().find((p) => p.id === productionId);

    if (production) {
      // Preencher dados do produto automaticamente
      this.harvestForm.patchValue({
        quantityHarvested: production.quantityPlanted,
      });
    }
  }

  onSubmit(): void {
    if (this.harvestForm.invalid) {
      this.markFormGroupTouched(this.harvestForm);
      this.messageService.add({
        severity: 'warn',
        summary: 'Atenção',
        detail: 'Preencha todos os campos obrigatórios',
      });
      return;
    }

    const userId = this.authFacade.currentUser()?.id;
    if (!userId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Usuário não autenticado',
      });
      return;
    }

    const formValue = this.harvestForm.value;
    const selectedProduction = this.productions().find(
      (p) => p.id === formValue.productionId
    );

    if (!selectedProduction) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Plantio não encontrado',
      });
      return;
    }

    const quantityLost = formValue.quantityLost || 0;
    const quantityHarvested = formValue.quantityHarvested;
    const lossPercentage = quantityHarvested > 0
      ? (quantityLost / (quantityHarvested + quantityLost)) * 100
      : 0;

    if (!formValue.productionId) {
      this.messageService.add({
        severity: 'error',
        summary: 'Erro',
        detail: 'Plantio não selecionado',
      });
      return;
    }

    const harvest: Omit<Harvest, 'id'> = {
      userId,
      productionId: formValue.productionId,
      productId: selectedProduction.productId,
      productName: selectedProduction.productName,
      quantityHarvested,
      unit: selectedProduction.unit,
      quantityLost,
      lossPercentage,
      quality: formValue.quality,
      harvestDate: Timestamp.fromDate(formValue.harvestDate),
      gradeA: formValue.gradeA ?? 0,
      gradeB: formValue.gradeB ?? 0,
      gradeC: formValue.gradeC ?? 0,
      harvestStartTime: formValue.harvestStartTime ?? '',
      harvestEndTime: formValue.harvestEndTime ?? '',
      harvestCost: formValue.harvestCost ?? 0,
      laborCost: formValue.laborCost ?? 0,
      equipmentCost: formValue.equipmentCost ?? 0,
      transportCost: formValue.transportCost ?? 0,
      weatherConditions: formValue.weatherConditions ?? '',
      temperature: formValue.temperature ?? 0,
      humidity: formValue.humidity ?? 0,
      workersCount: formValue.workersCount ?? 0,
      hoursWorked: formValue.hoursWorked ?? 0,
      notes: formValue.notes ?? '',
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    this.isLoading.set(true);
    this.harvestFacade.performHarvest(harvest).subscribe({
      next: () => {
        this.messageService.add({
          severity: 'success',
          summary: 'Sucesso',
          detail: 'Colheita registrada com sucesso!',
        });
        setTimeout(() => {
          this.router.navigate(['/dashboard']);
        }, 1500);
      },
      error: () => {
        this.messageService.add({
          severity: 'error',
          summary: 'Erro',
          detail: 'Erro ao registrar colheita. Tente novamente.',
        });
        this.isLoading.set(false);
      },
    });
  }

  onCancel(): void {
    this.router.navigate(['/dashboard']);
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach((key) => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  private formatDate(timestamp: Timestamp): string {
    const date = timestamp.toDate();
    return date.toLocaleDateString('pt-BR');
  }

  isFieldInvalid(fieldName: string): boolean {
    const field = this.harvestForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }
}
