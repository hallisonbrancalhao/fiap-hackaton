import {
  Component,
  input,
  AfterViewInit,
  OnDestroy,
  viewChild,
  ElementRef,
  ChangeDetectionStrategy
} from '@angular/core';
import * as L from 'leaflet';
import { GeoCoordinate } from '@fiap-hackaton/domain';

@Component({
  selector: 'lib-base-map',
  imports: [],
  templateUrl: './base-map.component.html',
  styleUrls: ['./base-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BaseMapComponent implements AfterViewInit, OnDestroy {
  mapContainer = viewChild<ElementRef<HTMLDivElement>>('mapContainer');

  center = input<GeoCoordinate>({ latitude: -23.5505, longitude: -46.6333 });
  zoom = input<number>(13);
  height = input<string>('500px');

  protected map?: L.Map;
  private currentDrawingPolygon: L.Polygon | null = null;
  private drawingCoordinates: GeoCoordinate[] = [];
  private drawingCallback: ((coords: GeoCoordinate[]) => void) | null = null;
  private drawingMarkers: L.Marker[] = [];

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 0);
  }

  protected initMap(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container) return;

    delete (L.Icon.Default.prototype as L.Icon & { _getIconUrl?: () => string })._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconRetinaUrl: 'assets/marker-icon-2x.png',
      iconUrl: 'assets/marker-icon.png',
      shadowUrl: 'assets/marker-shadow.png'
    });

    const centerCoord = this.center();
    this.map = L.map(container).setView([centerCoord.latitude, centerCoord.longitude], this.zoom());

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  addMarker(coordinate: GeoCoordinate, popup?: string): L.Marker {
    if (!this.map) throw new Error('Map not initialized');

    const marker = L.marker([coordinate.latitude, coordinate.longitude]).addTo(this.map);

    if (popup) {
      marker.bindPopup(popup);
    }

    return marker;
  }

  addPolygon(coordinates: GeoCoordinate[], options?: L.PolylineOptions): L.Polygon {
    if (!this.map) throw new Error('Map not initialized');

    const latLngs: L.LatLngExpression[] = coordinates.map(coord => [coord.latitude, coord.longitude]);
    const polygon = L.polygon(latLngs, options).addTo(this.map);

    return polygon;
  }

  setCenter(coordinate: GeoCoordinate, zoom?: number): void {
    if (!this.map) return;
    this.map.setView([coordinate.latitude, coordinate.longitude], zoom || this.map.getZoom());
  }

  fitBounds(coordinates: GeoCoordinate[]): void {
    if (!this.map || coordinates.length === 0) return;

    const latLngs: L.LatLngExpression[] = coordinates.map(coord => [coord.latitude, coord.longitude]);
    const bounds = L.latLngBounds(latLngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  clearLayers(): void {
    if (!this.map) return;

    this.map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      this.map?.removeLayer(layer);
    });
  }

  /**
   * Adiciona um label (texto) no centro de um polígono
   */
  addPolygonLabel(coordinates: GeoCoordinate[], text: string, className?: string): L.Marker {
    if (!this.map) throw new Error('Map not initialized');

    // Calcular o centro do polígono
    const centerLat = coordinates.reduce((sum, c) => sum + c.latitude, 0) / coordinates.length;
    const centerLng = coordinates.reduce((sum, c) => sum + c.longitude, 0) / coordinates.length;

    // Criar ícone customizado com texto
    const icon = L.divIcon({
      className: className || 'polygon-label',
      html: `<div style="
        text-align: center;
        pointer-events: none;
        text-shadow:
          -1px -1px 0 #fff,
          1px -1px 0 #fff,
          -1px 1px 0 #fff,
          1px 1px 0 #fff,
          -2px -2px 3px rgba(255,255,255,0.8),
          2px 2px 3px rgba(255,255,255,0.8);
        font-family: system-ui, -apple-system, sans-serif;
        line-height: 1.3;
        transform: translate(-50%, -50%);
      ">${text}</div>`,
      iconSize: [0, 0],
      iconAnchor: [0, 0]
    });

    // Adicionar marcador com o label
    const marker = L.marker([centerLat, centerLng], { icon }).addTo(this.map);

    return marker;
  }

  startDrawingPolygon(callback: (coords: GeoCoordinate[]) => void): void {
    this.drawingCallback = callback;
    this.drawingCoordinates = [];
    this.drawingMarkers = [];

    if (this.map) {
      this.map.on('click', this.onMapClickForDrawing.bind(this));
    }
  }

  clearDrawing(): void {
    if (this.map) {
      this.map.off('click', this.onMapClickForDrawing);
    }

    if (this.currentDrawingPolygon) {
      this.map?.removeLayer(this.currentDrawingPolygon);
      this.currentDrawingPolygon = null;
    }

    this.drawingMarkers.forEach(marker => {
      this.map?.removeLayer(marker);
    });

    this.drawingCoordinates = [];
    this.drawingMarkers = [];
    this.drawingCallback = null;
  }

  private onMapClickForDrawing(e: L.LeafletMouseEvent): void {
    const coord: GeoCoordinate = {
      latitude: e.latlng.lat,
      longitude: e.latlng.lng
    };

    this.drawingCoordinates.push(coord);

    if (!this.map) return;
    const marker = L.marker(e.latlng).addTo(this.map);
    this.drawingMarkers.push(marker);

    if (this.drawingCoordinates.length >= 3) {
      if (this.currentDrawingPolygon) {
        this.map?.removeLayer(this.currentDrawingPolygon);
      }

      this.currentDrawingPolygon = this.addPolygon(this.drawingCoordinates, {
        color: '#3B82F6',
        fillColor: '#3B82F6',
        fillOpacity: 0.3,
        weight: 2
      });
    }

    if (this.drawingCallback) {
      this.drawingCallback([...this.drawingCoordinates]);
    }
  }

  ngOnDestroy(): void {
    this.clearDrawing();
    if (this.map) {
      this.map.remove();
    }
  }
}
