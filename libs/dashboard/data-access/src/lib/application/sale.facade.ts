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

  /**
   * Cria uma venda simples sem alocação automática de lotes ou analytics
   * Use este método quando quiser apenas registrar a venda manualmente
   */
  createSimpleSale(input: SaleInput): Observable<string> {
    // Buscar dados dos produtos
    const productIds = input.items.map(item => item.productId);
    const productObservables = productIds.map(id => this.productRepository.getById(id));

    return forkJoin(productObservables).pipe(
      switchMap(products => {
        // Validar se todos os produtos existem
        const allProductsExist = products.every(p => p !== null);
        if (!allProductsExist) {
          throw new Error('Um ou mais produtos não foram encontrados');
        }

        // Construir itens da venda
        const saleItems: SaleItem[] = input.items.map((item, index) => {
          const product = products[index];
          if (!product) {
            throw new Error(`Produto não encontrado para o item ${index + 1}`);
          }
          const pricePerUnit = item.pricePerUnit || product.pricePerUnit;
          const costPerUnit = product.averageCost || 0;
          const quantity = item.quantity;
          const totalPrice = pricePerUnit * quantity;
          const totalCost = costPerUnit * quantity;
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
            profit
          };
        });

        // Calcular totais
        const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalCost = saleItems.reduce((sum, item) => sum + item.totalCost, 0);
        const totalProfit = totalAmount - totalCost;
        const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

        // Criar objeto de venda limpo
        const saleData: Partial<Sale> = {
          userId: input.userId,
          items: saleItems,
          totalAmount,
          totalCost,
          totalProfit,
          profitMargin,
          isPaid: input.isPaid || false,
          status: SALE_STATUS.COMPLETED,
          saleDate: Timestamp.now(),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // Adicionar campos opcionais
        if (input.customerName) saleData.customerName = input.customerName;
        if (input.customerContact) saleData.customerContact = input.customerContact;
        if (input.customerEmail) saleData.customerEmail = input.customerEmail;
        if (input.customerDocument) saleData.customerDocument = input.customerDocument;
        if (input.paymentMethod) saleData.paymentMethod = input.paymentMethod;
        if (input.isPaid) saleData.paymentDate = Timestamp.now();
        if (input.deliveryAddress) saleData.deliveryAddress = input.deliveryAddress;
        if (input.deliveryDate) saleData.deliveryDate = input.deliveryDate;
        if (input.deliveryFee !== undefined && input.deliveryFee !== null) saleData.deliveryFee = input.deliveryFee;
        if (input.notes) saleData.notes = input.notes;
        if (input.invoiceNumber) saleData.invoiceNumber = input.invoiceNumber;

        // Limpar undefined
        const sale = this.removeUndefinedFields(saleData) as Omit<Sale, 'id'>;

        // Apenas criar a venda - SEM alocação de lotes, SEM analytics automáticos
        return this.saleRepository.create(sale).pipe(
          switchMap(saleId => {
            // Atualizar estoque dos produtos (simples decrement)
            const stockUpdates = input.items.map((item, index) => {
              const product = products[index];
              if (!product) {
                throw new Error(`Produto não encontrado para atualização de estoque`);
              }
              const newStock = (product.currentStock || 0) - item.quantity;

              return this.productRepository.update(item.productId, {
                currentStock: Math.max(0, newStock),
                updatedAt: Timestamp.now()
              });
            });

            return forkJoin(stockUpdates.length > 0 ? stockUpdates : [of(void 0)]).pipe(
              map(() => saleId)
            );
          })
        );
      }),
      catchError(error => {
        this.toastService.error(
          error?.message || 'Não foi possível criar a venda. Verifique os dados e tente novamente.'
        );
        return throwError(() => error);
      })
    );
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
          const product = products[i];

          if (!product) {
            throw new Error(`Produto não encontrado para o item ${i + 1}`);
          }

          if (result.hasInsufficientStock) {
            throw new Error(
              `Estoque insuficiente em lotes para ${product.name}. ` +
              `Disponível: ${result.totalQuantityAllocated}, Solicitado: ${item.quantity}`
            );
          }
        }

        // 4. Calcular totais base (sem taxa de entrega)
        const itemsTotal = input.items.reduce((sum, item, index) => {
          const product = products[index];
          if (!product) {
            throw new Error(`Produto não encontrado para cálculo de totais`);
          }
          const pricePerUnit = item.pricePerUnit || product.pricePerUnit;
          return sum + (pricePerUnit * item.quantity);
        }, 0);

        // 5. Rateio proporcional da taxa de entrega entre os itens
        const deliveryFee = input.deliveryFee || 0;

        // 6. Construir itens da venda com custos reais dos lotes + rateio da taxa de entrega
        const saleItems: SaleItem[] = input.items.map((item, index) => {
          const product = products[index];
          if (!product) {
            throw new Error(`Produto não encontrado para construção de itens da venda`);
          }
          const allocationResult = allocationResults[index];
          const pricePerUnit = item.pricePerUnit || product.pricePerUnit;
          const costPerUnit = allocationResult.averageCostPerUnit; // Custo real dos lotes alocados
          const quantity = item.quantity;

          // Preço base do item (sem taxa de entrega)
          const itemBasePrice = pricePerUnit * quantity;

          // Calcular proporção deste item no total da venda
          const itemProportion = itemsTotal > 0 ? itemBasePrice / itemsTotal : 0;

          // Rateio da taxa de entrega proporcional ao valor do item
          const itemDeliveryFee = deliveryFee * itemProportion;

          // Totais finais incluindo o rateio da taxa de entrega
          const totalPrice = itemBasePrice + itemDeliveryFee;
          const totalCost = allocationResult.totalCost; // Custo não inclui taxa de entrega
          const profit = totalPrice - totalCost; // Lucro inclui a parte proporcional da taxa de entrega

          // Construir objeto base do item (campos obrigatórios)
          const saleItem: Partial<SaleItem> = {
            productId: item.productId,
            productName: product.name,
            quantity,
            unit: product.unit,
            pricePerUnit, // Preço unitário base (sem taxa de entrega)
            costPerUnit,  // Custo unitário dos lotes
            totalPrice,   // Preço total + rateio da taxa de entrega
            totalCost,    // Custo total dos lotes
            profit        // Lucro incluindo rateio da taxa de entrega
          };

          // Adicionar campos opcionais apenas se existirem e tiverem valor
          if (allocationResult.allocations && allocationResult.allocations.length > 0) {
            saleItem.batchAllocations = allocationResult.allocations;

            // Extrair productionId do primeiro lote alocado, se existir
            const firstAllocation = allocationResult.allocations[0];
            if (firstAllocation?.productionId) {
              saleItem.productionId = firstAllocation.productionId;
            }
          }

          return saleItem as SaleItem;
        });

        // 7. Calcular totais finais da venda
        const totalAmount = saleItems.reduce((sum, item) => sum + item.totalPrice, 0);
        const totalCost = saleItems.reduce((sum, item) => sum + item.totalCost, 0);
        const totalProfit = totalAmount - totalCost;
        const profitMargin = totalAmount > 0 ? (totalProfit / totalAmount) * 100 : 0;

        // 8. Criar objeto de venda com todos os campos calculados corretamente
        const saleData: Partial<Sale> = {
          userId: input.userId,
          items: saleItems,

          // Totais calculados
          totalAmount,      // Total com taxa de entrega incluída
          totalCost,        // Custo total dos produtos (sem taxa de entrega)
          totalProfit,      // Lucro total (inclui taxa de entrega como lucro)
          profitMargin,     // Margem de lucro percentual

          // Status da venda
          isPaid: input.isPaid || false,
          status: SALE_STATUS.COMPLETED,
          saleDate: Timestamp.now(),

          // Timestamps
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        // Adicionar campos opcionais apenas se tiverem valor
        if (input.customerName) saleData.customerName = input.customerName;
        if (input.customerContact) saleData.customerContact = input.customerContact;
        if (input.customerEmail) saleData.customerEmail = input.customerEmail;
        if (input.customerDocument) saleData.customerDocument = input.customerDocument;
        if (input.paymentMethod) saleData.paymentMethod = input.paymentMethod;
        if (input.isPaid) saleData.paymentDate = Timestamp.now();
        if (input.deliveryAddress) saleData.deliveryAddress = input.deliveryAddress;
        if (input.deliveryDate) saleData.deliveryDate = input.deliveryDate;
        if (input.deliveryFee !== undefined && input.deliveryFee !== null) saleData.deliveryFee = input.deliveryFee;
        if (input.notes) saleData.notes = input.notes;
        if (input.invoiceNumber) saleData.invoiceNumber = input.invoiceNumber;

        // Remover quaisquer campos undefined recursivamente
        const sale = this.removeUndefinedFields(saleData) as Omit<Sale, 'id'>;

        // 9. Criar a venda e confirmar alocações
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
          if (!goal.id) {
            throw new Error('Goal ID não encontrado');
          }
          const newValue = goal.currentValue + saleAmount;
          const isCompleted = newValue >= goal.targetValue;

          return this.goalFacade.update(goal.id, {
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

  /**
   * Remove campos undefined de um objeto recursivamente
   * Necessário para evitar erros do Firestore com campos undefined
   */
  private removeUndefinedFields(obj: unknown): unknown {
    if (obj === null || obj === undefined) {
      return obj;
    }

    if (Array.isArray(obj)) {
      return obj.map(item => this.removeUndefinedFields(item));
    }

    if (typeof obj === 'object' && !(obj instanceof Timestamp) && !(obj instanceof Date)) {
      const cleaned: Record<string, unknown> = {};
      Object.keys(obj).forEach(key => {
        const value = (obj as Record<string, unknown>)[key];
        if (value !== undefined) {
          cleaned[key] = this.removeUndefinedFields(value);
        }
      });
      return cleaned;
    }

    return obj;
  }
}
