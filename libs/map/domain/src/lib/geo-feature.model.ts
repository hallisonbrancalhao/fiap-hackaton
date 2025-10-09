import { Timestamp } from '@angular/fire/firestore';

/**
 * Representa uma coordenada geográfica (latitude, longitude)
 */
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
}

/**
 * Tipos de geometria suportados (baseado em GeoJSON)
 */
export enum GEO_FEATURE_TYPE {
  POINT = 'Point',
  POLYGON = 'Polygon',
  MULTI_POLYGON = 'MultiPolygon',
  LINE_STRING = 'LineString'
}

/**
 * Propriedades comuns para features geográficas
 */
export interface GeoFeatureProperties {
  name?: string;
  description?: string;
  color?: string;
  fillColor?: string;
  fillOpacity?: number;
  strokeWeight?: number;
  [key: string]: unknown;
}

/**
 * Feature geográfica genérica (compatível com GeoJSON)
 */
export interface GeoFeature<T extends GeoFeatureProperties = GeoFeatureProperties> {
  id?: string;
  type: GEO_FEATURE_TYPE;
  coordinates: GeoCoordinate[] | GeoCoordinate[][];
  properties: T;
  createdAt?: Timestamp;
  updatedAt?: Timestamp;
}

/**
 * Calcula a área de um polígono em metros quadrados
 * Usando a fórmula de Shoelace (aproximação plana)
 */
export function calculatePolygonArea(coordinates: GeoCoordinate[]): number {
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

/**
 * Converte área de metros quadrados para hectares
 */
export function convertM2ToHectares(areaM2: number): number {
  return areaM2 / 10000;
}

/**
 * Calcula o centro (centroid) de um polígono
 */
export function calculateCentroid(coordinates: GeoCoordinate[]): GeoCoordinate {
  if (coordinates.length === 0) {
    return { latitude: 0, longitude: 0 };
  }

  let sumLat = 0;
  let sumLng = 0;

  coordinates.forEach(coord => {
    sumLat += coord.latitude;
    sumLng += coord.longitude;
  });

  return {
    latitude: sumLat / coordinates.length,
    longitude: sumLng / coordinates.length
  };
}

/**
 * Verifica se um ponto está dentro de um polígono (Ray Casting Algorithm)
 */
export function isPointInPolygon(point: GeoCoordinate, polygon: GeoCoordinate[]): boolean {
  let inside = false;
  const { latitude: x, longitude: y } = point;

  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].latitude;
    const yi = polygon[i].longitude;
    const xj = polygon[j].latitude;
    const yj = polygon[j].longitude;

    const intersect = yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;
    if (intersect) inside = !inside;
  }

  return inside;
}
