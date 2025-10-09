import { Injectable, inject } from '@angular/core';
import { Observable, switchMap, map, catchError } from 'rxjs';
import { Production, PRODUCTION_STATUS } from '@fiap-hackaton/dashboard-domain';
import { ProductionRepository } from '../infrastructure/production.repository';
import { ProductRepository } from '../infrastructure/product.repository';
import { Timestamp } from '@angular/fire/firestore';

export interface PlantingInput {
  userId: string;
  productId: string;
  quantityPlanted: number;
  plantingUnit: string;
  expectedHarvestDate: Timestamp;

  // Custos
  seedCost?: number;
  laborCost?: number;
  fertilizerCost?: number;
  irrigationCost?: number;
  otherCosts?: number;

  // Área
  areaPlanted?: number;
  areaUnit?: 'hectare' | 'm2';
  plotLocation?: string;

  // Informações agronômicas
  varietyName?: string;
  sowingMethod?: 'direct' | 'transplant' | 'seed';
  expectedYieldPerArea?: number;

  notes?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductionFacade {
  private productionRepository = inject(ProductionRepository);
  private productRepository = inject(ProductRepository);

  create(production: Omit<Production, 'id'>): Observable<string> {
    return this.productionRepository.create(production);
  }

  update(id: string, production: Partial<Production>): Observable<void> {
    return this.productionRepository.update(id, production);
  }

  delete(id: string): Observable<void> {
    return this.productionRepository.delete(id);
  }

  getById(id: string): Observable<Production | null> {
    return this.productionRepository.getById(id);
  }

  getByUserId(userId: string): Observable<Production[]> {
    return this.productionRepository.getByUserId(userId);
  }

  getByStatus(userId: string, status: PRODUCTION_STATUS): Observable<Production[]> {
    return this.productionRepository.getByStatus(userId, status);
  }

  getByProduct(userId: string, productId: string): Observable<Production[]> {
    return this.productionRepository.getByProduct(userId, productId);
  }

  getUpcomingHarvests(userId: string, beforeDate: Timestamp): Observable<Production[]> {
    return this.productionRepository.getUpcomingHarvests(userId, beforeDate);
  }

  /**
   * Retorna apenas produções ativas (plantadas ou em produção) prontas para colheita
   */
  getActiveProductions(userId: string): Observable<Production[]> {
    return this.productionRepository.getByUserId(userId).pipe(
      map(productions =>
        productions.filter(p =>
          p.status === PRODUCTION_STATUS.IN_PRODUCTION ||
          p.status === PRODUCTION_STATUS.WAITING
        )
      )
    );
  }

  updateStatus(id: string, status: PRODUCTION_STATUS): Observable<void> {
    return this.productionRepository.update(id, { status, updatedAt: Timestamp.now() });
  }

  completeHarvest(id: string): Observable<void> {
    return this.productionRepository.update(id, {
      status: PRODUCTION_STATUS.HARVESTED,
      actualHarvestDate: Timestamp.now(),
      updatedAt: Timestamp.now()
    });
  }

  /**
   * Registra um novo plantio com todos os cálculos de custo
   */
  registerPlanting(input: PlantingInput): Observable<string> {
    return this.productRepository.getById(input.productId).pipe(
      switchMap(product => {
        if (!product) {
          throw new Error('Produto não encontrado');
        }

        // Calcular custos totais
        const totalCost =
          (input.seedCost || 0) +
          (input.laborCost || 0) +
          (input.fertilizerCost || 0) +
          (input.irrigationCost || 0) +
          (input.otherCosts || 0);

        // Calcular custo por unidade
        const costPerUnit = input.quantityPlanted > 0
          ? totalCost / input.quantityPlanted
          : 0;

        // Criar objeto de produção (removendo campos undefined para evitar erro do Firestore)
        const production: Omit<Production, 'id'> = {
          userId: input.userId,
          productId: input.productId,
          productName: product.name,
          quantityPlanted: input.quantityPlanted,
          plantingUnit: input.plantingUnit,
          unit: product.unit,
          status: PRODUCTION_STATUS.IN_PRODUCTION,
          plantingDate: Timestamp.now(),
          expectedHarvestDate: input.expectedHarvestDate,

          // Custos
          costPerUnit,
          totalCost,
          ...(input.seedCost !== undefined && { seedCost: input.seedCost }),
          ...(input.laborCost !== undefined && { laborCost: input.laborCost }),
          ...(input.fertilizerCost !== undefined && { fertilizerCost: input.fertilizerCost }),
          ...(input.irrigationCost !== undefined && { irrigationCost: input.irrigationCost }),
          ...(input.otherCosts !== undefined && { otherCosts: input.otherCosts }),

          // Área
          ...(input.areaPlanted !== undefined && { areaPlanted: input.areaPlanted }),
          ...(input.areaUnit && { areaUnit: input.areaUnit }),
          ...(input.plotLocation && { plotLocation: input.plotLocation }),

          // Informações agronômicas
          ...(input.varietyName && { varietyName: input.varietyName }),
          ...(input.sowingMethod && { sowingMethod: input.sowingMethod }),
          ...(input.expectedYieldPerArea !== undefined && { expectedYieldPerArea: input.expectedYieldPerArea }),

          ...(input.notes && { notes: input.notes }),
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now()
        };

        return this.productionRepository.create(production);
      }),
      catchError(error => {
        throw error;
      })
    );
  }

  /**
   * Calcula estatísticas de produção para um usuário
   */
  getProductionStatistics(userId: string): Observable<{
    totalPlantings: number;
    activeProductions: number;
    completedHarvests: number;
    cancelledProductions: number;
    totalAreaPlanted: number;
    totalCostInvested: number;
    averageCostPerUnit: number;
  }> {
    return this.getByUserId(userId).pipe(
      map(productions => {
        const stats = {
          totalPlantings: productions.length,
          activeProductions: 0,
          completedHarvests: 0,
          cancelledProductions: 0,
          totalAreaPlanted: 0,
          totalCostInvested: 0,
          averageCostPerUnit: 0
        };

        let totalCostPerUnit = 0;
        let countWithCost = 0;

        productions.forEach(prod => {
          switch (prod.status) {
            case PRODUCTION_STATUS.IN_PRODUCTION:
            case PRODUCTION_STATUS.WAITING:
              stats.activeProductions++;
              break;
            case PRODUCTION_STATUS.HARVESTED:
              stats.completedHarvests++;
              break;
            case PRODUCTION_STATUS.CANCELLED:
              stats.cancelledProductions++;
              break;
          }

          stats.totalAreaPlanted += prod.areaPlanted || 0;
          stats.totalCostInvested += prod.totalCost || 0;

          if (prod.costPerUnit) {
            totalCostPerUnit += prod.costPerUnit;
            countWithCost++;
          }
        });

        stats.averageCostPerUnit = countWithCost > 0
          ? totalCostPerUnit / countWithCost
          : 0;

        return stats;
      })
    );
  }

  /**
   * Obtém produções prontas para colheita (data esperada já passou)
   */
  getReadyForHarvest(userId: string): Observable<Production[]> {
    return this.getByStatus(userId, PRODUCTION_STATUS.IN_PRODUCTION).pipe(
      map(productions => {
        const now = Timestamp.now();
        return productions.filter(prod =>
          prod.expectedHarvestDate &&
          prod.expectedHarvestDate.toMillis() <= now.toMillis()
        );
      })
    );
  }

  /**
   * Cancela um plantio
   */
  cancelProduction(id: string, reason?: string): Observable<void> {
    const updates: Partial<Production> = {
      status: PRODUCTION_STATUS.CANCELLED,
      updatedAt: Timestamp.now()
    };

    if (reason) {
      updates.notes = reason;
    }

    return this.productionRepository.update(id, updates);
  }
}
