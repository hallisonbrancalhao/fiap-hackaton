import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy, viewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMapComponent } from '@fiap-hackaton/map-ui';
import {
  FarmAreaFacade,
  PlantingPlotFacade,
  FarmAreaRepository,
  PlantingPlotRepository
} from '@fiap-hackaton/data-access';
import { FarmArea, PlantingPlot } from '@fiap-hackaton/domain';
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
    FarmAreaFacade,
    PlantingPlotFacade
  ]
})
export class FarmMapViewerComponent implements OnInit, OnDestroy {
  private readonly farmAreaFacade = inject(FarmAreaFacade);
  private readonly plantingPlotFacade = inject(PlantingPlotFacade);
  private readonly destroy$ = new Subject<void>();

  baseMap = viewChild(BaseMapComponent);

  // Observables públicos para o template
  farmArea$ = this.farmAreaFacade.farmArea$;
  plantingPlots$ = this.plantingPlotFacade.plantingPlots$;
  loading$ = this.farmAreaFacade.loading$;

  ngOnInit(): void {
    // Mock user ID - em produção virá do AuthService
    const mockUserId = 'user-123';

    // Carregar dados
    this.farmAreaFacade.loadFarmAreaByUserId(mockUserId);
    this.plantingPlotFacade.loadPlantingPlotsByUserId(mockUserId);

    // Renderizar área da fazenda quando carregada
    this.farmArea$.pipe(takeUntil(this.destroy$)).subscribe(farmArea => {
      if (farmArea && this.baseMap()) {
        this.renderFarmArea(farmArea);
      }
    });

    // Renderizar talhões quando carregados
    this.plantingPlots$.pipe(takeUntil(this.destroy$)).subscribe(plots => {
      if (plots.length > 0 && this.baseMap()) {
        this.renderPlantingPlots(plots);
      }
    });
  }

  private renderFarmArea(farmArea: FarmArea): void {
    const map = this.baseMap();
    if (!map || !farmArea.coordinates || farmArea.coordinates.length === 0) return;

    // Adicionar polígono da fazenda
    map.addPolygon(farmArea.coordinates, {
      color: farmArea.properties.color || '#10B981',
      fillColor: farmArea.properties.fillColor || '#10B981',
      fillOpacity: 0.2,
      weight: 2
    });

    // Ajustar visualização
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

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.farmAreaFacade.clear();
    this.plantingPlotFacade.clear();
  }
}
