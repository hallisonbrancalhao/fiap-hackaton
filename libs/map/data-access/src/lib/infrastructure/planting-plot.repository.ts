import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { BaseRepository } from '@fiap-hackaton/shared-data-access';
import {
  PlantingPlot,
  CreatePlantingPlotDto,
  UpdatePlantingPlotDto,
  GEO_FEATURE_TYPE,
  PLANTING_PLOT_STATUS
} from '@fiap-hackaton/domain';
import { where, QueryConstraint } from '@angular/fire/firestore';

@Injectable()
export class PlantingPlotRepository extends BaseRepository<PlantingPlot> {
  protected override collectionName = 'plantingPlots';

  /**
   * Busca todos os talhões de plantio de um usuário
   */
  override getByUserId(userId: string): Observable<PlantingPlot[]> {
    const constraints: QueryConstraint[] = [where('userId', '==', userId)];
    return super.getAll(constraints);
  }

  /**
   * Busca todos os talhões de plantio de uma fazenda específica
   */
  getByFarmAreaId(farmAreaId: string): Observable<PlantingPlot[]> {
    const constraints: QueryConstraint[] = [where('farmAreaId', '==', farmAreaId)];
    return super.getAll(constraints);
  }

  /**
   * Busca talhões por ID de produção (Production)
   */
  getByProductionId(productionId: string): Observable<PlantingPlot[]> {
    const constraints: QueryConstraint[] = [where('productionId', '==', productionId)];
    return super.getAll(constraints);
  }

  /**
   * Cria um novo talhão de plantio
   */
  createPlantingPlot(dto: CreatePlantingPlotDto & { userId: string }): Observable<string> {
    const { userId, farmAreaId, plotName, coordinates, plotNumber, soilType, irrigation, notes, color, fillColor } = dto;

    const plantingPlot: Omit<PlantingPlot, 'id' | 'createdAt' | 'updatedAt'> = {
      userId,
      farmAreaId,
      type: GEO_FEATURE_TYPE.POLYGON,
      coordinates: [coordinates],
      properties: {
        plotName,
        plotNumber,
        areaM2: 0, // Será calculado no facade
        areaHectares: 0, // Será calculado no facade
        status: PLANTING_PLOT_STATUS.AVAILABLE,
        soilType,
        irrigation,
        notes,
        color,
        fillColor
      }
    };

    return this.create(plantingPlot as Omit<PlantingPlot, 'id'>);
  }

  /**
   * Atualiza um talhão de plantio
   */
  updatePlantingPlot(id: string, dto: UpdatePlantingPlotDto): Observable<void> {
    const updateData: Partial<PlantingPlot> = {};
    const properties: Partial<PlantingPlot['properties']> = {};

    if (dto.plotName !== undefined) {
      properties.plotName = dto.plotName;
    }
    if (dto.plotNumber !== undefined) {
      properties.plotNumber = dto.plotNumber;
    }
    if (dto.status !== undefined) {
      properties.status = dto.status;
    }
    if (dto.soilType !== undefined) {
      properties.soilType = dto.soilType;
    }
    if (dto.irrigation !== undefined) {
      properties.irrigation = dto.irrigation;
    }
    if (dto.notes !== undefined) {
      properties.notes = dto.notes;
    }
    if (dto.color !== undefined) {
      properties.color = dto.color;
    }
    if (dto.fillColor !== undefined) {
      properties.fillColor = dto.fillColor;
    }

    if (Object.keys(properties).length > 0) {
      updateData.properties = properties as PlantingPlot['properties'];
    }

    if (dto.productionId !== undefined) {
      updateData.productionId = dto.productionId;
    }

    return this.update(id, updateData);
  }

  /**
   * Deleta um talhão de plantio
   */
  deletePlantingPlot(id: string): Observable<void> {
    return this.delete(id);
  }
}
