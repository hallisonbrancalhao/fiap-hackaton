import { Component, output, input, viewChild, OnInit, ChangeDetectionStrategy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { BaseMapComponent } from '../base-map/base-map.component';
import { GeoCoordinate, calculatePolygonArea, convertM2ToHectares } from '@fiap-hackaton/domain';
import { Button } from 'primeng/button';

export interface PlantingAreaSelection {
  coordinates: GeoCoordinate[];
  areaM2: number;
  areaHectares: number;
}

@Component({
  selector: 'lib-planting-area-selector',
  imports: [CommonModule, BaseMapComponent, Button],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './planting-area-selector.component.html',
  styles: [`
    .planting-area-selector {
      width: 100%;
    }
  `]
})
export class PlantingAreaSelectorComponent implements OnInit {
  farmAreaCoordinates = input<GeoCoordinate[]>([]);

  areaSelected = output<PlantingAreaSelection>();

  baseMap = viewChild(BaseMapComponent);

  isDrawing = signal(false);
  currentSelection = signal<PlantingAreaSelection | null>(null);

  private drawnCoordinates: GeoCoordinate[] = [];

  ngOnInit(): void {
    const coords = this.farmAreaCoordinates();
    if (coords && coords.length > 0) {
      setTimeout(() => this.renderFarmArea(), 200);
    }
  }

  protected toggleDrawing(): void {
    const map = this.baseMap();
    if (!map) return;

    if (this.isDrawing()) {
      this.isDrawing.set(false);
      this.drawnCoordinates = [];
      map.clearDrawing();
    } else {
      this.isDrawing.set(true);
      map.startDrawingPolygon((coords: GeoCoordinate[]) => {
        this.drawnCoordinates = coords;
        this.updateSelection(coords);
      });
    }
  }

  protected confirmSelection(): void {
    const selection = this.currentSelection();
    if (selection) {
      this.areaSelected.emit(selection);
      this.isDrawing.set(false);
    }
  }

  // Clear all markers and reset selection
  protected onClearMarkers(): void {
    const map = this.baseMap();
    if (!map) return;

    if (this.isDrawing()) {
      this.isDrawing.set(false);
    }

    this.drawnCoordinates = [];
    this.currentSelection.set(null);
    map.clearDrawing();
  }

  private renderFarmArea(): void {
    const map = this.baseMap();
    const farmCoords = this.farmAreaCoordinates();

    if (!map || !farmCoords || farmCoords.length === 0) return;

    map.addPolygon(farmCoords, {
      color: '#10B981',
      fillColor: '#10B981',
      fillOpacity: 0.1,
      weight: 2
    });

    map.fitBounds(farmCoords);
  }

  private updateSelection(coords: GeoCoordinate[]): void {
    if (coords.length < 3) {
      this.currentSelection.set(null);
      return;
    }

    const areaM2 = calculatePolygonArea(coords);
    const areaHectares = convertM2ToHectares(areaM2);

    this.currentSelection.set({
      coordinates: coords,
      areaM2,
      areaHectares
    });
  }
}
