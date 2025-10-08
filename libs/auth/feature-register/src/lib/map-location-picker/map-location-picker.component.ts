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

interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

@Component({
  selector: 'fiap-farms-location-picker',
  imports: [CommonModule, ButtonModule],
  template: `
    <div class="mb-4">
      <p class="text-surface-600">
        Clique no mapa para selecionar a localização exata da sua fazenda
      </p>
      @if (selectedLocation(); as location) {
        <div class="mt-2 p-3 bg-primary-50 rounded-lg">
          <p class="text-sm font-medium text-primary-900">
            Localização selecionada:
          </p>
          <p class="text-sm text-primary-700">
            Latitude: {{ location.latitude.toFixed(6) }}°
          </p>
          <p class="text-sm text-primary-700">
            Longitude: {{ location.longitude.toFixed(6) }}°
          </p>
        </div>
      }
    </div>

    <div id="map" style="height: 50vh; width: 100%; border-radius: 8px;"></div>

    <div class="flex gap-2 justify-end mt-4">
      <p-button
        label="Cancelar"
        severity="secondary"
        [outlined]="true"
        (onClick)="onCancel()"
      />
      <p-button
        label="Confirmar Localização"
        icon="pi pi-check"
        [disabled]="!selectedLocation()"
        (onClick)="onConfirm()"
      />
    </div>
  `,
  styles: [`
    #map {
      z-index: 0;
    }
  `],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapLocationPickerComponent implements OnDestroy, AfterViewInit {
  selectedLocation = signal<LocationCoordinates | null>(null);

  private map: L.Map | null = null;
  private marker: L.Marker | null = null;
  private ref = inject(DynamicDialogRef);

  ngAfterViewInit(): void {
    // Initialize map after view is ready
    setTimeout(() => this.initMap(), 0);
  }

  ngOnDestroy(): void {
    this.destroyMap();
  }

  protected onConfirm(): void {
    const location = this.selectedLocation();
    if (location) {
      this.ref.close(location);
    }
  }

  protected onCancel(): void {
    this.ref.close(null);
  }

  private initMap(): void {
    if (this.map) {
      return;
    }

    // Default center: São Paulo, Brazil
    const defaultLat = -23.550520;
    const defaultLng = -46.633308;

    this.map = L.map('map').setView([defaultLat, defaultLng], 13);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors',
      maxZoom: 19,
    }).addTo(this.map);

    // Add click event to map
    this.map.on('click', (e: L.LeafletMouseEvent) => {
      this.onMapClick(e);
    });
  }

  private onMapClick(e: L.LeafletMouseEvent): void {
    const { lat, lng } = e.latlng;

    this.selectedLocation.set({
      latitude: lat,
      longitude: lng,
    });

    // Remove existing marker if any
    if (this.marker) {
      this.marker.remove();
    }

    // Add new marker
    if (this.map) {
      this.marker = L.marker([lat, lng], {
        icon: L.icon({
          iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
          shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
          iconSize: [25, 41],
          iconAnchor: [12, 41],
          popupAnchor: [1, -34],
          shadowSize: [41, 41],
        }),
      }).addTo(this.map);

      this.marker.bindPopup(`Latitude: ${lat.toFixed(6)}<br>Longitude: ${lng.toFixed(6)}`).openPopup();
    }
  }

  private destroyMap(): void {
    if (this.map) {
      this.map.remove();
      this.map = null;
    }
    this.marker = null;
  }
}
