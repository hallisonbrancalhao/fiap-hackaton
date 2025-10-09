import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, forkJoin, of, map, catchError, throwError } from 'rxjs';
import { Sale, SALE_STATUS, SaleItem, BatchAllocation, PAYMENT_METHOD } from '@fiap-hackaton/dashboard-domain';
import { SaleRepository } from '../infrastructure/sale.repository';
import { ProductRepository } from '../infrastructure/product.repository';
import { GoalFacade } from './goal.facade';
import { GOAL_TYPE } from '@fiap-hackaton/dashboard-domain';
import { StockBatchFacade, AllocationStrategy } from './stock-batch.facade';
import { BatchAnalyticsFacade } from './batch-analytics.facade';
import { Timestamp } from '@angular/fire/firestore';
import { ToastService } from '@fiap-hackaton/shared-ui';
import { AuthGuardService } from '@fiap-hackaton/shared-data-access';

export interface ProductAnalyticsData {
  productId: string;
  productName: string;
  totalRevenue: number;
  totalQuantitySold: number;
  totalCost: number;
  profit: number;
  profitMargin: number;
  averagePrice: number;
}

export interface SaleInput {
  userId: string;
  items: {
    productId: string;
    quantity: number;
    pricePerUnit?: number; // Se não informado, usa o preço do produto
  }[];
  customerName?: string;
  customerContact?: string;
  customerEmail?: string;
  customerDocument?: string;
  paymentMethod?: PAYMENT_METHOD;
  isPaid?: boolean;
  deliveryAddress?: string;
  deliveryDate?: Timestamp;
  deliveryFee?: number;
  notes?: string;
  invoiceNumber?: string;
}

@Injectable({
  providedIn: 'root',
})
export class SaleFacade {
  private saleRepository = inject(SaleRepository);
  private productRepository = inject(ProductRepository);
  private goalFacade = inject(GoalFacade);
  private stockBatchFacade = inject(StockBatchFacade);
  private batchAnalyticsFacade = inject(BatchAnalyticsFacade);
  private toastService = inject(ToastService);
  private authGuard = inject(AuthGuardService);

  create(sale: Omit<Sale, 'id'>): Observable<string> {
    return this.saleRepository.create(sale);
  }

  update(id: string, sale: Partial<Sale>): Observable<void> {
    return this.saleRepository.update(id, sale);
  }

  delete(id: string): Observable<void> {
    return this.saleRepository.delete(id);
  }

  getById(id: string): Observable<Sale | null> {
    return this.saleRepository.getById(id);
  }

  getByUserId(userId: string): Observable<Sale[]> {
    if (!this.authGuard.validateAuth(userId)) {
      return of([]);
    }
    return this.authGuard.handlePermissionError(
      this.saleRepository.getByUserId(userId)
    );
  }

  getByStatus(userId: string, status: SALE_STATUS): Observable<Sale[]> {
    if (!this.authGuard.validateAuth(userId)) {
      return of([]);
    }
    return this.authGuard.handlePermissionError(
      this.saleRepository.getByStatus(userId, status)
    );
  }

  getByDateRange(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<Sale[]> {
    if (!this.authGuard.validateAuth(userId)) {
      return of([]);
    }
    return this.authGuard.handlePermissionError(
      this.saleRepository.getByDateRange(userId, startDate, endDate)
    );
  }

  getRecentSales(userId: string, limit?: number): Observable<Sale[]> {
    if (!this.authGuard.validateAuth(userId)) {
      return of([]);
    }
    return this.authGuard.handlePermissionError(
      this.saleRepository.getRecentSales(userId, limit)
    );
  }

  updateStatus(id: string, status: SALE_STATUS): Observable<void> {
    return this.saleRepository.update(id, { status, updatedAt: Timestamp.now() });
  }

  /**
   * Registra uma nova venda com todos os cálculos, alocação de lotes e atualizações
   */
  registerSale(input: SaleInput, allocationStrategy: AllocationStrategy = 'FIFO'): Observable<string> {
    const productIds = input.items.map(item => item.productId);
    const productObservables = productIds.map(id =>
      this.productRepository.getById(id)
    );

    return forkJoin(productObservables).pipe(
      switchMap(products => {
        const allProductsExist = products.every(p => p !== null);
        if (!allProductsExist) {
          throw new Error('Um ou mais produtos não foram encontrados');
        }

        const allocationObservables = input.items.map(item =>
          this.stockBatchFacade.allocateBatches(
            input.userId,
            item.productId,
            item.quantity,
            allocationStrategy
          )
        );

        return forkJoin(allocationObservables).pipe(
          map(allocationResults => ({ products, allocationResults }))
        );
      }),
      switchMap(({ products, allocationResults }) => {
        // 3. Validar se há estoque suficiente em lotes
        for (let i = 0; i < allocationResults.length; i++) {
          const result = allocationResults[i];
          const item = input.items[i];
          const product = products[i]!;

          if (result.hasInsufficientStock) {
            throw new Error(
              `Estoque insuficiente em lotes para ${product.name}. ` +
              `Disponível: ${result.totalQuantityAllocated}, Solicitado: ${item.quantity}`
            );
          }
        }

        // 4. Construir itens da venda com custos reais dos lotes
        const saleItems: SaleItem[] = input.items.map((item, index) => {
          const product = products[index]!;
          const allocationResult = allocationResults[index];
          const pricePerUnit = item.pricePerUnit || product.pricePerUnit;
          const costPerUnit = allocationResult.averageCostPerUnit; // Custo real dos lotes alocados
          const quantity = item.quantity;
          const totalPrice = pricePerUnit * quantity;
          const totalCost = allocationResult.totalCost;
          const profit = totalPrice - totalCost;

          return {
            productId: item.productId,
            productName: product.name,
            quantity,
            unit: product.unit,
            pricePerUnit,
            costPerUnit,
            totalPrice,
            totalCost,
            profit,
            batchAllocations: allocationResult.allocations // Rastreabilidade dos lotes
          } as SaleItem;
        });

        // 5. Calcular totais
        const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalCost = saleItems.reduce((sum, item) => sum + item.totalCost, 0);
        const totalProfit = totalAmount - totalCost;
        const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

        // Adicionar taxa de entrega ao total
        const finalTotalAmount = totalAmount + (input.deliveryFee || 0);

        // 6. Criar objeto de venda
        const sale: Omit<Sale, 'id'> = {
          userId: input.userId,
          items: saleItems,
          totalAmount: finalTotalAmount,
          totalCost,
          totalProfit,
          profitMargin,

          customerName: input.customerName,
          customerContact: input.customerContact,
          customerEmail: input.customerEmail,
          customerDocument: input.customerDocument,

          paymentMethod: input.paymentMethod,
          isPaid: input.isPaid || false,
          paymentDate: input.isPaid ? Timestamp.now() : undefined,
          deliveryAddress: input.deliveryAddress,
          deliveryDate: input.deliveryDate,
          deliveryFee: input.deliveryFee,

          status: SALE_STATUS.COMPLETED,
          saleDate: Timestamp.now(),
          notes: input.notes,
          invoiceNumber: input.invoiceNumber,

          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // 7. Criar a venda e confirmar alocações
        return this.saleRepository.create(sale).pipe(
          switchMap(saleId => {
            // Confirmar todas as alocações de lotes
            const allAllocations = allocationResults.flatMap(result => result.allocations);

            return this.stockBatchFacade.confirmAllocation(allAllocations).pipe(
              switchMap(() => {
                // Atualizar analytics de cada lote vendido
                const batchUpdates = allAllocations.map(allocation =>
                  this.stockBatchFacade.getBatchById(allocation.batchId).pipe(
                    switchMap(batch => {
                      if (!batch) return of(void 0);

                      // Calcular informações de venda para este lote
                      const saleItem = saleItems.find(si =>
                        si.batchAllocations?.some((ba: BatchAllocation) => ba.batchId === allocation.batchId)
                      );

                      if (!saleItem) return of(void 0);

                      const sales = [{
                        quantity: allocation.quantityAllocated,
                        price: saleItem.pricePerUnit,
                        date: Timestamp.now()
                      }];

                      return this.batchAnalyticsFacade.calculateBatchAnalytics(batch, sales);
                    })
                  )
                );

                return forkJoin(batchUpdates.length > 0 ? batchUpdates : [of(void 0)]).pipe(
                  map(() => saleId)
                );
              }),
              switchMap(createdSaleId => {
                // Atualizar metas de vendas
                return this.updateSalesGoals(input.userId, totalAmount).pipe(
                  map(() => createdSaleId)
                );
              })
            );
          })
        );
      }),
      catchError(error => {
        this.toastService.error(
          error?.message || 'Não foi possível registrar a venda. Verifique os dados e tente novamente.'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Calcula analytics de produtos diretamente das vendas
   * Retorna os produtos mais lucrativos
   */
  getTopProfitableProducts(userId: string, limit = 10): Observable<ProductAnalyticsData[]> {
    // Validação: retornar vazio se userId não estiver disponível
    if (!this.authGuard.validateAuth(userId)) {
      return of([]);
    }

    return this.getByUserId(userId).pipe(
      map(sales => {
        const completedSales = sales.filter(s => s.status === SALE_STATUS.COMPLETED);
        const productMap = new Map<string, ProductAnalyticsData>();

        // Agregar dados de todos os itens vendidos
        completedSales.forEach(sale => {
          sale.items.forEach(item => {
            const existing = productMap.get(item.productId);

            if (existing) {
              existing.totalRevenue += item.totalPrice;
              existing.totalQuantitySold += item.quantity;
              existing.totalCost += item.totalCost;
              existing.profit += item.profit;
            } else {
              productMap.set(item.productId, {
                productId: item.productId,
                productName: item.productName,
                totalRevenue: item.totalPrice,
                totalQuantitySold: item.quantity,
                totalCost: item.totalCost,
                profit: item.profit,
                profitMargin: 0,
                averagePrice: 0
              });
            }
          });
        });

        // Calcular médias e margens
        const analytics = Array.from(productMap.values()).map(data => ({
          ...data,
          profitMargin: data.totalRevenue > 0 ? (data.profit / data.totalRevenue) * 100 : 0,
          averagePrice: data.totalQuantitySold > 0 ? data.totalRevenue / data.totalQuantitySold : 0
        }));

        // Ordenar por lucro e limitar
        return analytics
          .sort((a, b) => b.profit - a.profit)
          .slice(0, limit);
      })
    );
  }

  /**
   * Calcula analytics de produtos por receita total
   */
  getTopRevenueProducts(userId: string, limit = 10): Observable<ProductAnalyticsData[]> {
    // Validação: retornar vazio se userId não estiver disponível
    if (!this.authGuard.validateAuth(userId)) {
      return of([]);
    }

    return this.getByUserId(userId).pipe(
      map(sales => {
        const completedSales = sales.filter(s => s.status === SALE_STATUS.COMPLETED);
        const productMap = new Map<string, ProductAnalyticsData>();

        completedSales.forEach(sale => {
          sale.items.forEach(item => {
            const existing = productMap.get(item.productId);

            if (existing) {
              existing.totalRevenue += item.totalPrice;
              existing.totalQuantitySold += item.quantity;
              existing.totalCost += item.totalCost;
              existing.profit += item.profit;
            } else {
              productMap.set(item.productId, {
                productId: item.productId,
                productName: item.productName,
                totalRevenue: item.totalPrice,
                totalQuantitySold: item.quantity,
                totalCost: item.totalCost,
                profit: item.profit,
                profitMargin: 0,
                averagePrice: 0
              });
            }
          });
        });

        const analytics = Array.from(productMap.values()).map(data => ({
          ...data,
          profitMargin: data.totalRevenue > 0 ? (data.profit / data.totalRevenue) * 100 : 0,
          averagePrice: data.totalQuantitySold > 0 ? data.totalRevenue / data.totalQuantitySold : 0
        }));

        return analytics
          .sort((a, b) => b.totalRevenue - a.totalRevenue)
          .slice(0, limit);
      })
    );
  }

  /**
   * Cancela uma venda e retorna produtos ao estoque
   */
  cancelSale(saleId: string, reason?: string): Observable<void> {
    return this.saleRepository.getById(saleId).pipe(
      switchMap(sale => {
        if (!sale) {
          throw new Error('Venda não encontrada');
        }

        if (sale.status === SALE_STATUS.CANCELLED) {
          throw new Error('Venda já está cancelada');
        }

        // Retornar produtos ao estoque
        const stockUpdates = sale.items.map(item =>
          this.productRepository.getById(item.productId).pipe(
            switchMap(product => {
              if (!product) {
                return of(void 0);
              }

              const newStock = (product.currentStock || 0) + item.quantity;
              return this.productRepository.update(item.productId, {
                currentStock: newStock,
                updatedAt: Timestamp.now()
              });
            })
          )
        );

        return forkJoin(stockUpdates).pipe(
          switchMap(() => {
            const updates: Partial<Sale> = {
              status: SALE_STATUS.CANCELLED,
              updatedAt: Timestamp.now()
            };

            if (reason) {
              updates.notes = `${sale.notes || ''}\nMotivo do cancelamento: ${reason}`.trim();
            }

            return this.saleRepository.update(saleId, updates);
          })
        );
      }),
      catchError(error => {
        this.toastService.error(
          error?.message || 'Não foi possível cancelar a venda. Tente novamente.'
        );
        return throwError(() => error);
      })
    );
  }

  /**
   * Atualiza as metas de vendas após uma venda
   */
  private updateSalesGoals(userId: string, saleAmount: number): Observable<void> {
    return this.goalFacade.getByType(userId, GOAL_TYPE.SALES).pipe(
      switchMap(goals => {
        const activeGoals = goals.filter(g => !g.isCompleted);
        if (activeGoals.length === 0) {
          return of(void 0);
        }

        const updates = activeGoals.map(goal => {
          const newValue = goal.currentValue + saleAmount;
          const isCompleted = newValue >= goal.targetValue;

          return this.goalFacade.update(goal.id!, {
            currentValue: newValue,
            isCompleted,
            updatedAt: Timestamp.now()
          });
        });

        return forkJoin(updates).pipe(map(() => void 0));
      }),
      catchError(_error => {
        // console.error('Erro ao atualizar metas de vendas:', _error);
        return of(void 0);
      })
    );
  }

  /**
   * Calcula estatísticas de vendas para um período
   */
  getSalesStatistics(
    userId: string,
    startDate: Timestamp,
    endDate: Timestamp
  ): Observable<{
    totalSales: number;
    totalRevenue: number;
    totalCost: number;
    totalProfit: number;
    averageProfitMargin: number;
    salesByProduct: { [productId: string]: { quantity: number; revenue: number } };
  }> {
    return this.getByDateRange(userId, startDate, endDate).pipe(
      map(sales => {
        const completedSales = sales.filter(s => s.status === SALE_STATUS.COMPLETED);

        const stats = {
          totalSales: completedSales.length,
          totalRevenue: 0,
          totalCost: 0,
          totalProfit: 0,
          averageProfitMargin: 0,
          salesByProduct: {} as { [productId: string]: { quantity: number; revenue: number } }
        };

        completedSales.forEach(sale => {
          stats.totalRevenue += sale.totalAmount;
          stats.totalCost += sale.totalCost;
          stats.totalProfit += sale.totalProfit;

          sale.items.forEach(item => {
            if (!stats.salesByProduct[item.productId]) {
              stats.salesByProduct[item.productId] = { quantity: 0, revenue: 0 };
            }
            stats.salesByProduct[item.productId].quantity += item.quantity;
            stats.salesByProduct[item.productId].revenue += item.totalPrice;
          });
        });

        stats.averageProfitMargin = stats.totalRevenue > 0
          ? (stats.totalProfit / stats.totalRevenue) * 100
          : 0;

        return stats;
      })
    );
  }

  /**
   * Marca uma venda como paga
   */
  markAsPaid(saleId: string, paymentDate?: Timestamp): Observable<void> {
    return this.saleRepository.update(saleId, {
      isPaid: true,
      paymentDate: paymentDate || Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }
}
