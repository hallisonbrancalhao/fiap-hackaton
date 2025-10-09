import {
  Component,
  ChangeDetectionStrategy,
  signal,
  OnDestroy,
  AfterViewInit,
  inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { DynamicDialogRef } from 'primeng/dynamicdialog';
import * as L from 'leaflet';
import 'leaflet-draw';
import { GeoCoordinate } from '@fiap-hackaton/map-domain';

export interface FarmAreaDrawResult {
  coordinates: GeoCoordinate[];
  centerPoint: { latitude: number; longitude: number };
  areaM2: number;
  areaHectares: number;
}

interface DrawCreatedEvent {
  layer: L.Polygon;
  layerType: string;
}

interface DrawEditedEvent {
  layers: L.FeatureGroup;
}

@Component({
  selector: 'fiap-farms-area-draw',
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="mb-4">
      <h3 class="text-lg font-semibold mb-2">Demarque a área da sua fazenda</h3>
      <p class="text-surface-600 mb-2">
        Use a ferramenta de desenho para criar um polígono delimitando toda a área da sua fazenda.
      </p>

      @if (drawnArea(); as area) {
        <div class="mt-2 p-3 bg-primary-50 rounded-lg">
          <p class="text-sm font-medium text-primary-900">Área demarcada:</p>
          <p class="text-sm text-primary-700">
            <strong>{{ area.areaHectares.toFixed(2) }}</strong> hectares
            ({{ area.areaM2.toFixed(0) }} m²)
          </p>
          <p class="text-sm text-primary-700">
            <strong>{{ area.coordinates.length }}</strong> pontos no perímetro
          </p>
        </div>
      } @else {
        <div class="mt-2 p-3 bg-orange-50 rounded-lg">
          <p class="text-sm text-orange-700">
            ⚠️ Clique no ícone de polígono <span class="font-mono bg-orange-100 px-1">▱</span>
            no canto superior esquerdo do mapa e desenhe a área da fazenda
          </p>
        </div>
      }
    </div>

    <div id="farm-area-map" style="height: 60vh; width: 100%; border-radius: 8px;"></div>

    <div class="flex gap-2 justify-end mt-4">
      <p-button
        label="Cancelar"
        severity="secondary"
        [outlined]="true"
        (onClick)="onCancel()"
      />
      <p-button
        label="Confirmar Demarcação"
        icon="pi pi-check"
        [disabled]="!drawnArea()"
        (onClick)="onConfirm()"
      />
    </div>
  `,
  styles: [`
    #farm-area-map {
      z-index: 0;
    }

    :host ::ng-deep .leaflet-draw-toolbar {
      margin-top: 10px !important;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapAreaDrawComponent implements OnDestroy, AfterViewInit {
  drawnArea = signal<FarmAreaDrawResult | null>(null);

  private map: L.Map | null = null;
  private drawnItems: L.FeatureGroup | null = null;
  private drawControl: L.Control.Draw | null = null;
  private ref = inject(DynamicDialogRef);

  ngAfterViewInit(): void {
    setTimeout(() => this.initMap(), 0);
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  protected onConfirm(): void {
    const area = this.drawnArea();
    if (area) {
      this.ref.close(area);
    }
  }

  protected onCancel(): void {
    this.ref.close(null);
  }

  private initMap(): void {
    if (this.map) return;

    // Default center: São Paulo, Brazil
    const defaultLat = -23.550520;
    const defaultLng = -46.633308;

    this.map = L.map('farm-area-map').setView([defaultLat, defaultLng], 12);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Initialize FeatureGroup to store drawn items
    this.drawnItems = new L.FeatureGroup();
    this.map.addLayer(this.drawnItems);

    // Initialize draw control with only polygon tool
    this.drawControl = new L.Control.Draw({
      position: 'topleft',
      draw: {
        polygon: {
          allowIntersection: false,
          showArea: false, // Desabilitado para evitar erro do leaflet-draw
          metric: false, // Desabilitado para evitar erro do leaflet-draw
          shapeOptions: {
            color: '#10B981',
            fillColor: '#10B981',
            fillOpacity: 0.2,
            weight: 2,
          },
        },
        polyline: false,
        circle: false,
        rectangle: false,
        marker: false,
        circlemarker: false,
      },
      edit: {
        featureGroup: this.drawnItems,
        remove: true,
      },
    });

    this.map.addControl(this.drawControl);

    // Handle draw created event
    this.map.on(L.Draw.Event.CREATED, (event: L.LeafletEvent) => {
      const layer = (event as unknown as DrawCreatedEvent).layer;

      if (this.drawnItems) {
        // Remove previous polygon if exists
        this.drawnItems.clearLayers();
        // Add new polygon
        this.drawnItems.addLayer(layer);
      }

      this.processDrawnPolygon(layer);
    });

    // Handle edit event
    this.map.on(L.Draw.Event.EDITED, (event: L.LeafletEvent) => {
      const layers = (event as unknown as DrawEditedEvent).layers;
      layers.eachLayer((layer: L.Layer) => {
        this.processDrawnPolygon(layer as L.Polygon);
      });
    });

    // Handle delete event
    this.map.on(L.Draw.Event.DELETED, () => {
      this.drawnArea.set(null);
    });
  }

  private processDrawnPolygon(layer: L.Polygon): void {
    const latLngs = layer.getLatLngs()[0] as L.LatLng[];

    // Convert Leaflet LatLng to GeoCoordinate
    const coordinates: GeoCoordinate[] = latLngs.map(latlng => ({
      latitude: latlng.lat,
      longitude: latlng.lng,
    }));

    // Calculate area using spherical earth projection (Haversine formula)
    const areaM2 = this.calculatePolygonArea(coordinates);
    const areaHectares = areaM2 / 10000;

    // Calculate center point
    const bounds = layer.getBounds();
    const center = bounds.getCenter();

    this.drawnArea.set({
      coordinates,
      centerPoint: {
        latitude: center.lat,
        longitude: center.lng,
      },
      areaM2,
      areaHectares,
    });
  }

  /**
   * Calcula a área de um polígono em metros quadrados
   * Usando a fórmula de Shoelace com projeção esférica
   */
  private calculatePolygonArea(coordinates: GeoCoordinate[]): number {
    if (coordinates.length < 3) return 0;

    let area = 0;
    const earthRadius = 6371000; // metros

    for (let i = 0; i < coordinates.length; i++) {
      const j = (i + 1) % coordinates.length;
      const lat1 = coordinates[i].latitude * (Math.PI / 180);
      const lat2 = coordinates[j].latitude * (Math.PI / 180);
      const lng1 = coordinates[i].longitude * (Math.PI / 180);
      const lng2 = coordinates[j].longitude * (Math.PI / 180);

      area += (lng2 - lng1) * (2 + Math.sin(lat1) + Math.sin(lat2));
    }

    area = Math.abs((area * earthRadius * earthRadius) / 2);
    return area;
  }

  private destroyMap(): void {
    if (this.drawControl && this.map) {
      this.map.removeControl(this.drawControl);
    }

    if (this.drawnItems && this.map) {
      this.map.removeLayer(this.drawnItems);
    }

    if (this.map) {
      this.map.remove();
      this.map = null;
    }

    this.drawnItems = null;
    this.drawControl = null;
  }
}
