import { Component, ChangeDetectionStrategy, inject, signal, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { CardComponent, LoadingComponent, EmptyStateComponent } from '@fiap-hackaton/shared-ui';
import { Sale, SALE_STATUS } from '@fiap-hackaton/dashboard-domain';
import { SaleFacade } from '@fiap-hackaton/dashboard-data-access';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { SALE_STATUS_SEVERITIES } from './sale-list.constants';

@Component({
	selector: 'lib-sale-list',
	imports: [
		CommonModule,
		TableModule,
		ButtonModule,
		TagModule,
		CardComponent,
		LoadingComponent,
		EmptyStateComponent,
		CurrencyPipe,
		DatePipe,
	],
	template: `
		<div class="p-6">
			<lib-card title="Vendas" subtitle="Acompanhe suas vendas e receitas">
				<div class="mb-4 flex justify-between items-center">
					<div class="flex gap-2">
						<p-button
							[label]="'Todas (' + getTotalCount() + ')'"
							[outlined]="selectedStatus() !== null"
							(onClick)="filterByStatus(null)"
							size="small"
						/>
						<p-button
							[label]="'Concluídas (' + getStatusCount(SALE_STATUS.COMPLETED) + ')'"
							[outlined]="selectedStatus() !== SALE_STATUS.COMPLETED"
							(onClick)="filterByStatus(SALE_STATUS.COMPLETED)"
							severity="success"
							size="small"
						/>
						<p-button
							[label]="'Pendentes (' + getStatusCount(SALE_STATUS.PENDING) + ')'"
							[outlined]="selectedStatus() !== SALE_STATUS.PENDING"
							(onClick)="filterByStatus(SALE_STATUS.PENDING)"
							severity="warn"
							size="small"
						/>
					</div>

					<p-button
						label="Nova Venda"
						icon="pi pi-plus"
						(onClick)="onAddSale()"
						data-testid="add-sale-button"
					/>
				</div>

				@if (isLoading()) {
					<lib-loading message="Carregando vendas..." />
				} @else if (filteredSales().length === 0) {
					<lib-empty-state
						icon="pi pi-shopping-cart"
						title="Nenhuma venda ainda"
						description="Comece registrando sua primeira venda"
						actionLabel="Nova Venda"
						(actionClick)="onAddSale()"
					/>
				} @else {
					<p-table
						[value]="filteredSales()"
						[paginator]="true"
						[rows]="10"
					>
						<ng-template #header>
							<tr>
								<th>Data</th>
								<th>Cliente</th>
								<th>Itens</th>
								<th>Total</th>
								<th>Status</th>
								<th class="text-right">Ações</th>
							</tr>
						</ng-template>
						<ng-template #body let-sale>
							<tr>
								<td>{{ sale.saleDate?.toDate() | date: 'short' }}</td>
								<td>{{ sale.customerName || 'N/A' }}</td>
								<td>{{ sale.items.length }} item(ns)</td>
								<td>{{ sale.totalAmount | currency }}</td>
								<td>
									<p-tag
										[value]="sale.status"
										[severity]="getStatusSeverity(sale.status)"
									/>
								</td>
								<td class="text-right">
									<p-button
										icon="pi pi-eye"
										[text]="true"
										[rounded]="true"
										severity="secondary"
										(onClick)="onViewSale(sale)"
										data-testid="view-sale-button"
									/>
									@if (sale.status === SALE_STATUS.PENDING) {
										<p-button
											icon="pi pi-check"
											[text]="true"
											[rounded]="true"
											severity="success"
											(onClick)="onCompleteSale(sale)"
											data-testid="complete-sale-button"
										/>
									}
									<p-button
										icon="pi pi-trash"
										[text]="true"
										[rounded]="true"
										severity="danger"
										(onClick)="onDeleteSale(sale)"
										data-testid="delete-sale-button"
									/>
								</td>
							</tr>
						</ng-template>
					</p-table>

					<!-- Summary Card -->
					<div class="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
						<div class="bg-primary-50 p-4 rounded-lg">
							<p class="text-sm text-primary-600 mb-1">Total de Vendas</p>
							<p class="text-2xl font-bold text-primary-700">
								{{ getTotalSales() | currency }}
							</p>
						</div>
						<div class="bg-green-50 p-4 rounded-lg">
							<p class="text-sm text-green-600 mb-1">Concluídas</p>
							<p class="text-2xl font-bold text-green-700">
								{{ getCompletedTotal() | currency }}
							</p>
						</div>
						<div class="bg-orange-50 p-4 rounded-lg">
							<p class="text-sm text-orange-600 mb-1">Pendentes</p>
							<p class="text-2xl font-bold text-orange-700">
								{{ getPendingTotal() | currency }}
							</p>
						</div>
					</div>
				}
			</lib-card>
		</div>
	`,
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SaleListComponent implements OnInit {
	protected sales = signal<Sale[]>([]);
	protected filteredSales = signal<Sale[]>([]);
	protected selectedStatus = signal<SALE_STATUS | null>(null);
	protected isLoading = signal(false);
	protected readonly SALE_STATUS = SALE_STATUS;

	private saleFacade = inject(SaleFacade);
	private authFacade = inject(AuthLoginFacade);
	private router = inject(Router);

	ngOnInit(): void {
		this.loadSales();
	}

	protected filterByStatus(status: SALE_STATUS | null): void {
		this.selectedStatus.set(status);
		this.filterSales();
	}

	protected onAddSale(): void {
		this.router.navigate(['/dashboard/sales/new']);
	}

	protected onViewSale(sale: Sale): void {
		this.router.navigate(['/dashboard/sales/view', sale.id]);
	}

	protected onCompleteSale(sale: Sale): void {
		if (!sale.id) return;

		this.saleFacade.updateStatus(sale.id, SALE_STATUS.COMPLETED).subscribe({
			next: () => {
				this.loadSales();
			},
			error: () => {
				// Error completing sale
			},
		});
	}

	protected onDeleteSale(sale: Sale): void {
		if (!sale.id || !confirm(`Excluir venda para ${sale.customerName}?`)) {
			return;
		}

		this.saleFacade.delete(sale.id).subscribe({
			next: () => {
				this.loadSales();
			},
			error: () => {
				// Error deleting sale
			},
		});
	}

	protected getStatusSeverity(status: SALE_STATUS): 'success' | 'info' | 'warn' | 'secondary' | 'contrast' | 'danger' {
		return SALE_STATUS_SEVERITIES[status] || 'info';
	}

	protected getTotalCount(): number {
		return this.sales().length;
	}

	protected getStatusCount(status: SALE_STATUS): number {
		return this.sales().filter((s) => s.status === status).length;
	}

	protected getTotalSales(): number {
		return this.sales().reduce((sum, sale) => sum + sale.totalAmount, 0);
	}

	protected getCompletedTotal(): number {
		return this.sales()
			.filter((s) => s.status === SALE_STATUS.COMPLETED)
			.reduce((sum, sale) => sum + sale.totalAmount, 0);
	}

	protected getPendingTotal(): number {
		return this.sales()
			.filter((s) => s.status === SALE_STATUS.PENDING)
			.reduce((sum, sale) => sum + sale.totalAmount, 0);
	}

	private loadSales(): void {
		this.isLoading.set(true);
		
		const currentUser = this.authFacade.currentUser();
		
		if (!currentUser?.id) {
			this.isLoading.set(false);
			return;
		}

		this.saleFacade.getByUserId(currentUser.id).subscribe({
			next: (sales) => {
				this.sales.set(sales);
				this.filterSales();
				this.isLoading.set(false);
			},
			error: () => {
				this.isLoading.set(false);
			},
		});
	}

	private filterSales(): void {
		const status = this.selectedStatus();
		if (status === null) {
			this.filteredSales.set(this.sales());
		} else {
			this.filteredSales.set(this.sales().filter((s) => s.status === status));
		}
	}
}
