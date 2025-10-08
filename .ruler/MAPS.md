# Documentação para Agentes de IA: Uso da Biblioteca Leaflet.js

## Referência Oficial
- [Leaflet API Reference](https://leafletjs.com/reference.html)
- [Leaflet Tutorials](https://leafletjs.com/examples.html)
- [Leaflet Plugins](https://leafletjs.com/plugins.html)


### Correção de Ícones Padrão (Angular/Webpack)
```typescript
import * as L from 'leaflet';

// Fix para ícones padrão não carregarem
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'assets/marker-icon-2x.png',
  iconUrl: 'assets/marker-icon.png',
  shadowUrl: 'assets/marker-shadow.png',
});
```

## Boas Práticas para Agentes de IA

### 1. Sempre Consulte a Documentação Oficial
- Utilize a [referência oficial](https://leafletjs.com/reference.html) para detalhes de métodos, propriedades e opções de configuração.
- Mantenha-se atualizado com as versões e mudanças da API.
- Consulte os [exemplos oficiais](https://leafletjs.com/examples.html) antes de implementar funcionalidades complexas.

### 2. Inicialização Segura do Mapa

#### Angular (Recomendado)
```typescript
import { Component, OnInit, OnDestroy, AfterViewInit } from '@angular/core';
import * as L from 'leaflet';

@Component({
  selector: 'app-map',
  template: '<div id="map" style="height: 500px;"></div>'
})
export class MapComponent implements AfterViewInit, OnDestroy {
  private map!: L.Map;

  ngAfterViewInit(): void {
    // Inicializar após o DOM estar pronto
    setTimeout(() => {
      this.initMap();
    }, 0);
  }

  private initMap(): void {
    this.map = L.map('map', {
      center: [-23.5505, -46.6333],
      zoom: 13,
      zoomControl: true,
      attributionControl: true
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors'
    }).addTo(this.map);
  }

  ngOnDestroy(): void {
    // Limpar recursos
    if (this.map) {
      this.map.remove();
    }
  }
}
```

#### React
```typescript
import { useEffect, useRef } from 'react';
import * as L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export function MapComponent() {
  const mapRef = useRef<L.Map | null>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    mapRef.current = L.map(mapContainerRef.current).setView([51.505, -0.09], 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(mapRef.current);

    return () => {
      mapRef.current?.remove();
    };
  }, []);

  return <div ref={mapContainerRef} style={{ height: '500px' }} />;
}
```

### 3. Gerenciamento de Recursos

#### Sempre Remova Layers e Markers
```typescript
// Armazenar referências
private markers: L.Marker[] = [];
private layers: L.Layer[] = [];

// Adicionar com rastreamento
addMarker(lat: number, lng: number): void {
  const marker = L.marker([lat, lng]).addTo(this.map);
  this.markers.push(marker);
}

// Limpar recursos
clearMarkers(): void {
  this.markers.forEach(marker => this.map.removeLayer(marker));
  this.markers = [];
}

// No OnDestroy
ngOnDestroy(): void {
  this.clearMarkers();
  this.map?.remove();
}
```

#### Usar Layer Groups
```typescript
// Organizar marcadores em grupos
private markersGroup = L.layerGroup();

ngAfterViewInit(): void {
  this.initMap();
  this.markersGroup.addTo(this.map);
}

addMarker(lat: number, lng: number): void {
  L.marker([lat, lng]).addTo(this.markersGroup);
}

clearMarkers(): void {
  this.markersGroup.clearLayers();
}
```

### 4. Manipulação de Eventos

```typescript
// Eventos do mapa
this.map.on('click', (e: L.LeafletMouseEvent) => {
  console.log('Clicked at:', e.latlng);
});

this.map.on('moveend', () => {
  const center = this.map.getCenter();
  const zoom = this.map.getZoom();
  console.log('Map moved to:', center, 'zoom:', zoom);
});

// Eventos de marcadores
const marker = L.marker([lat, lng])
  .on('click', () => console.log('Marker clicked'))
  .on('dragend', (e) => console.log('Marker moved to:', e.target.getLatLng()))
  .addTo(this.map);

// Remover event listeners
this.map.off('click');
marker.off('click');
```

### 5. Responsividade e Performance

```typescript
// Invalidar tamanho ao redimensionar
window.addEventListener('resize', () => {
  this.map.invalidateSize();
});

// Ou em Angular com HostListener
@HostListener('window:resize')
onResize(): void {
  this.map?.invalidateSize();
}

// Limitar zoom
this.map.setMaxZoom(18);
this.map.setMinZoom(5);

// Desabilitar interações para mapas estáticos
L.map('map', {
  dragging: false,
  touchZoom: false,
  scrollWheelZoom: false,
  doubleClickZoom: false,
  boxZoom: false,
  keyboard: false,
  zoomControl: false
});
```

### 6. Acessibilidade e Usabilidade

```typescript
// Popups informativos
const marker = L.marker([lat, lng])
  .bindPopup('<b>Título</b><br>Descrição detalhada')
  .openPopup();

// Tooltips permanentes
marker.bindTooltip('Label', {
  permanent: true,
  direction: 'top'
});

// Customizar ícones
const customIcon = L.icon({
  iconUrl: 'assets/custom-icon.png',
  iconSize: [32, 32],
  iconAnchor: [16, 32],
  popupAnchor: [0, -32]
});

L.marker([lat, lng], { icon: customIcon }).addTo(this.map);
```

### 7. Integração com Dados Externos

```typescript
// Carregar dados de API
async loadMarkers(): Promise<void> {
  try {
    const response = await fetch('/api/locations');
    const locations = await response.json();
    
    locations.forEach((loc: any) => {
      if (this.isValidCoordinate(loc.lat, loc.lng)) {
        L.marker([loc.lat, loc.lng])
          .bindPopup(loc.name)
          .addTo(this.markersGroup);
      }
    });
    
    // Ajustar visualização para incluir todos os marcadores
    const bounds = this.markersGroup.getBounds();
    if (bounds.isValid()) {
      this.map.fitBounds(bounds, { padding: [50, 50] });
    }
  } catch (error) {
    console.error('Erro ao carregar marcadores:', error);
  }
}

private isValidCoordinate(lat: number, lng: number): boolean {
  return !isNaN(lat) && !isNaN(lng) && 
         lat >= -90 && lat <= 90 && 
         lng >= -180 && lng <= 180;
}
```

### 8. Segurança

```typescript
// NUNCA exponha chaves de API no código
// Use variáveis de ambiente
const MAPBOX_TOKEN = process.env['NX_MAPBOX_TOKEN'] || '';

// Sanitize dados do usuário
function sanitizePopupContent(content: string): string {
  const div = document.createElement('div');
  div.textContent = content;
  return div.innerHTML;
}

const safeContent = sanitizePopupContent(userInput);
marker.bindPopup(safeContent);

// Validar coordenadas antes de usar
function isValidLatLng(lat: number, lng: number): boolean {
  return typeof lat === 'number' && 
         typeof lng === 'number' &&
         !isNaN(lat) && !isNaN(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
}
```

### 9. Tratamento de Erros

```typescript
class MapService {
  private map?: L.Map;

  initMap(elementId: string): void {
    try {
      const element = document.getElementById(elementId);
      if (!element) {
        throw new Error(`Element with id '${elementId}' not found`);
      }

      this.map = L.map(elementId).setView([51.505, -0.09], 13);
      
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
      })
      .addTo(this.map)
      .on('tileerror', (error) => {
        console.error('Erro ao carregar tiles:', error);
      });

    } catch (error) {
      console.error('Erro ao inicializar mapa:', error);
      throw error;
    }
  }

  addMarker(lat: number, lng: number): L.Marker | null {
    if (!this.map) {
      console.error('Mapa não inicializado');
      return null;
    }

    if (!isValidLatLng(lat, lng)) {
      console.error('Coordenadas inválidas:', lat, lng);
      return null;
    }

    return L.marker([lat, lng]).addTo(this.map);
  }
}
```

### 10. Testes Unitários

```typescript
// map.component.spec.ts
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map.component';
import * as L from 'leaflet';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [MapComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize map after view init', () => {
    spyOn<any>(component, 'initMap');
    fixture.detectChanges();
    
    setTimeout(() => {
      expect(component['initMap']).toHaveBeenCalled();
    }, 0);
  });

  it('should clean up map on destroy', () => {
    fixture.detectChanges();
    const removeSpy = jasmine.createSpy('remove');
    component['map'] = { remove: removeSpy } as any;
    
    component.ngOnDestroy();
    expect(removeSpy).toHaveBeenCalled();
  });
});
```

## Padrões Comuns de Uso

### Centralizar Mapa em Marcador
```typescript
const marker = L.marker([lat, lng]).addTo(this.map);
this.map.setView([lat, lng], 15);
```

### Ajustar Visualização para Múltiplos Marcadores
```typescript
const bounds = L.latLngBounds(coordinates);
this.map.fitBounds(bounds, { padding: [50, 50] });
```

### Desenhar Polígonos e Formas
```typescript
// Círculo
L.circle([lat, lng], {
  color: 'red',
  fillColor: '#f03',
  fillOpacity: 0.5,
  radius: 500
}).addTo(this.map);

// Polígono
const polygon = L.polygon([
  [51.509, -0.08],
  [51.503, -0.06],
  [51.51, -0.047]
], { color: 'blue' }).addTo(this.map);
```

### GeoJSON
```typescript
const geojsonFeature = {
  type: "Feature",
  properties: {
    name: "Local",
    popupContent: "Descrição"
  },
  geometry: {
    type: "Point",
    coordinates: [-46.6333, -23.5505]
  }
};

L.geoJSON(geojsonFeature, {
  onEachFeature: (feature, layer) => {
    if (feature.properties?.popupContent) {
      layer.bindPopup(feature.properties.popupContent);
    }
  }
}).addTo(this.map);
```

## Provedores de Tiles Populares

### OpenStreetMap (Gratuito)
```typescript
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© OpenStreetMap contributors'
});
```

### Mapbox (Requer API Key)
```typescript
L.tileLayer('https://api.mapbox.com/styles/v1/{id}/tiles/{z}/{x}/{y}?access_token={accessToken}', {
  attribution: '© Mapbox © OpenStreetMap',
  maxZoom: 18,
  id: 'mapbox/streets-v11',
  accessToken: 'YOUR_MAPBOX_TOKEN'
});
```

### Google Maps Style (OpenStreetMap)
```typescript
L.tileLayer('https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}', {
  maxZoom: 20,
  attribution: '© Google Maps'
});
```

## Plugins Úteis

- **Leaflet.markercluster**: Agrupar marcadores próximos
- **Leaflet.draw**: Ferramentas de desenho
- **Leaflet.heat**: Mapas de calor
- **Leaflet.routing**: Rotas e navegação
- **Leaflet.fullscreen**: Modo tela cheia

## Checklist para Implementação

- [ ] CSS do Leaflet importado
- [ ] Ícones padrão corrigidos (Angular/Webpack)
- [ ] Inicialização no `AfterViewInit` ou `useEffect`
- [ ] Cleanup no `OnDestroy` ou return do `useEffect`
- [ ] Validação de coordenadas
- [ ] Tratamento de erros de tiles
- [ ] Responsividade (`invalidateSize`)
- [ ] Acessibilidade (popups/tooltips)
- [ ] Gerenciamento de memória (remover layers)
- [ ] Testes unitários

## Recursos Adicionais

- [Leaflet API Reference](https://leafletjs.com/reference.html)
- [Leaflet Examples](https://leafletjs.com/examples.html)
- [Leaflet Plugins Directory](https://leafletjs.com/plugins.html)
- [OpenStreetMap Tile Usage Policy](https://operations.osmfoundation.org/policies/tiles/)

## Observações Finais

- Sempre consulte a [referência oficial](https://leafletjs.com/reference.html) para detalhes avançados
- Siga as políticas de uso dos provedores de tiles
- Implemente rate limiting ao fazer geocoding ou consultas pesadas
- Considere cache local para melhorar performance
- Use Web Workers para processamento pesado de dados geoespaciais
- Monitore o uso de memória em aplicações com muitos marcadores
