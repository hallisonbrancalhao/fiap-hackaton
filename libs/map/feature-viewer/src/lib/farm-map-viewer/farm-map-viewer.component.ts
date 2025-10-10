import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { BaseMapComponent } from '@fiap-hackaton/map-ui';
import {
  FarmAreaFacade,
  PlantingPlotFacade,
  ProductionAreaFacade,
  FarmAreaRepository,
  PlantingPlotRepository,
  ProductionAreaRepository
} from '@fiap-hackaton/data-access';
import { FarmArea, PlantingPlot, ProductionArea } from '@fiap-hackaton/domain';
import { AuthLoginFacade } from '@fiap-hackaton/auth-data-access';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'lib-farm-map-viewer',
  imports: [CommonModule, BaseMapComponent],
  templateUrl: './farm-map-viewer.component.html',
  styleUrls: ['./farm-map-viewer.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    FarmAreaRepository,
    PlantingPlotRepository,
    ProductionAreaRepository,
    FarmAreaFacade,
    PlantingPlotFacade,
    ProductionAreaFacade
  ]
})
export class FarmMapViewerComponent implements OnInit, OnDestroy {
  private readonly route = inject(ActivatedRoute);
  private readonly authFacade = inject(AuthLoginFacade);
  private readonly farmAreaFacade = inject(FarmAreaFacade);
  private readonly plantingPlotFacade = inject(PlantingPlotFacade);
  private readonly productionAreaFacade = inject(ProductionAreaFacade);
  private readonly destroy$ = new Subject<void>();

  baseMap = viewChild(BaseMapComponent);

  farmArea$ = this.farmAreaFacade.farmArea$;
  plantingPlots$ = this.plantingPlotFacade.plantingPlots$;
  productionAreas$ = this.productionAreaFacade.productionAreas$;
  loading$ = this.farmAreaFacade.loading$;

  ngOnInit(): void {
    this.route.params.pipe(takeUntil(this.destroy$)).subscribe(params => {
      const userId = params['userId'] || this.authFacade.currentUser()?.id;

      if (userId) {
        this.loadUserFarmData(userId);
      }
    });
  }

  private loadUserFarmData(userId: string): void {
    this.farmAreaFacade.loadFarmAreaByUserId(userId);
    this.plantingPlotFacade.loadPlantingPlotsByUserId(userId);
    this.productionAreaFacade.loadActiveProductionAreas(userId);

    this.farmArea$.pipe(takeUntil(this.destroy$)).subscribe(farmArea => {
      if (farmArea && this.baseMap()) {
        this.renderFarmArea(farmArea);
      }
    });

    this.plantingPlots$.pipe(takeUntil(this.destroy$)).subscribe(plots => {
      if (plots.length > 0 && this.baseMap()) {
        this.renderPlantingPlots(plots);
      }
    });

    this.productionAreas$.pipe(takeUntil(this.destroy$)).subscribe(areas => {
      if (areas.length > 0 && this.baseMap()) {
        this.renderProductionAreas(areas);
      }
    });
  }

  private renderFarmArea(farmArea: FarmArea): void {
    const map = this.baseMap();
    if (!map || !farmArea.coordinates || farmArea.coordinates.length === 0) return;

    map.addPolygon(farmArea.coordinates, {
      color: farmArea.properties.color || '#10B981',
      fillColor: farmArea.properties.fillColor || '#10B981',
      fillOpacity: 0.2,
      weight: 2
    });

    map.fitBounds(farmArea.coordinates);
  }

  private renderPlantingPlots(plots: PlantingPlot[]): void {
    const map = this.baseMap();
    if (!map) return;

    plots.forEach(plot => {
      if (plot.coordinates[0]) {
        map.addPolygon(plot.coordinates[0], {
          color: plot.properties.color || '#3B82F6',
          fillColor: plot.properties.fillColor || '#3B82F6',
          fillOpacity: 0.4,
          weight: 2
        });
      }
    });
  }

  private renderProductionAreas(areas: ProductionArea[]): void {
    const map = this.baseMap();
    if (!map) return;

    areas.forEach(area => {
      if (area.coordinates && area.coordinates.length >= 3) {
        const polygon = map.addPolygon(area.coordinates, {
          color: area.properties.color || '#3B82F6',
          fillColor: area.properties.fillColor || '#3B82F6',
          fillOpacity: 0.3,
          weight: 2
        });

        // Adicionar popup com informações do plantio
        const plantingDate = area.properties.plantingDate
          ? new Date(area.properties.plantingDate).toLocaleDateString('pt-BR')
          : 'N/A';

        const expectedHarvestDate = area.properties.expectedHarvestDate
          ? new Date(area.properties.expectedHarvestDate).toLocaleDateString('pt-BR')
          : 'N/A';

        const popupContent = `
          <div style="min-width: 200px;">
            <h3 style="margin: 0 0 8px 0; font-weight: bold; color: #1e40af;">
              ${area.properties.productName}
            </h3>
            <div style="font-size: 14px; line-height: 1.5;">
              <p style="margin: 4px 0;">
                <strong>Área:</strong> ${area.properties.areaHectares.toFixed(2)} ha
              </p>
              <p style="margin: 4px 0; font-size: 12px; color: #6b7280;">
                (${area.properties.areaM2.toFixed(0)} m²)
              </p>
              <p style="margin: 4px 0;">
                <strong>Plantio:</strong> ${plantingDate}
              </p>
              <p style="margin: 4px 0;">
                <strong>Colheita prevista:</strong> ${expectedHarvestDate}
              </p>
            </div>
          </div>
        `;

        polygon.bindPopup(popupContent);

        // Adicionar label no centro do polígono
        const labelText = this.buildLabelText(area);
        if (labelText) {
          map.addPolygonLabel(area.coordinates, labelText);
        }
      }
    });
  }

  private buildLabelText(area: ProductionArea): string {
    const productName = area.properties.productName;
    const quantity = area.properties.quantityPlanted;
    const unit = area.properties.unit;
    const expectedHarvestDate = area.properties.expectedHarvestDate;

    let labelHtml = `
      <div style="font-size: 16px; font-weight: 700; color: #1e40af; margin-bottom: 2px;">
        ${productName}
      </div>
    `;

    if (quantity && unit) {
      // Formatar quantidade (ex: 1000 -> 1.000 ou 1500.5 -> 1.500,5)
      const formattedQuantity = new Intl.NumberFormat('pt-BR', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 2
      }).format(quantity);

      labelHtml += `
        <div style="font-size: 12px; font-weight: 500; color: #4b5563; margin-bottom: 1px;">
          ${formattedQuantity} ${unit}
        </div>
      `;
    }

    if (expectedHarvestDate) {
      const formattedDate = new Date(expectedHarvestDate).toLocaleDateString('pt-BR');
      labelHtml += `
        <div style="font-size: 11px; font-weight: 400; color: #6b7280;">
          Colheita: ${formattedDate}
        </div>
      `;
    }

    return labelHtml;
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.farmAreaFacade.clear();
    this.plantingPlotFacade.clear();
    this.productionAreaFacade.clear();
  }
}
