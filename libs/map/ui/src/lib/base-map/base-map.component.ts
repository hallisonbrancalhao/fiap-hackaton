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

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initMap();
    }, 0);
  }

  protected initMap(): void {
    const container = this.mapContainer()?.nativeElement;
    if (!container) return;

    // Fix para ícones padrão do Leaflet
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

  /**
   * Adiciona um marcador ao mapa
   */
  addMarker(coordinate: GeoCoordinate, popup?: string): L.Marker {
    if (!this.map) throw new Error('Map not initialized');

    const marker = L.marker([coordinate.latitude, coordinate.longitude]).addTo(this.map);

    if (popup) {
      marker.bindPopup(popup);
    }

    return marker;
  }

  /**
   * Adiciona um polígono ao mapa
   */
  addPolygon(coordinates: GeoCoordinate[], options?: L.PolylineOptions): L.Polygon {
    if (!this.map) throw new Error('Map not initialized');

    const latLngs: L.LatLngExpression[] = coordinates.map(coord => [coord.latitude, coord.longitude]);
    const polygon = L.polygon(latLngs, options).addTo(this.map);

    return polygon;
  }

  /**
   * Centraliza o mapa em uma coordenada
   */
  setCenter(coordinate: GeoCoordinate, zoom?: number): void {
    if (!this.map) return;
    this.map.setView([coordinate.latitude, coordinate.longitude], zoom || this.map.getZoom());
  }

  /**
   * Ajusta o mapa para mostrar todos os bounds
   */
  fitBounds(coordinates: GeoCoordinate[]): void {
    if (!this.map || coordinates.length === 0) return;

    const latLngs: L.LatLngExpression[] = coordinates.map(coord => [coord.latitude, coord.longitude]);
    const bounds = L.latLngBounds(latLngs);
    this.map.fitBounds(bounds, { padding: [50, 50] });
  }

  /**
   * Remove todas as layers do mapa (exceto tile layer)
   */
  clearLayers(): void {
    if (!this.map) return;

    this.map.eachLayer((layer) => {
      if (layer instanceof L.TileLayer) return;
      this.map?.removeLayer(layer);
    });
  }

  ngOnDestroy(): void {
    if (this.map) {
      this.map.remove();
    }
  }
}
