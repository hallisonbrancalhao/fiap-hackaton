import { GeoCoordinate, GeoFeature, GeoFeatureProperties, GEO_FEATURE_TYPE } from './geo-feature.model';

/**
 * Propriedades específicas da área da fazenda
 */
export interface FarmAreaProperties extends GeoFeatureProperties {
  farmName: string;
  ownerName: string;
  totalAreaM2: number;
  totalAreaHectares: number;
  address?: string;
  city?: string;
  state?: string;
  zipCode?: string;
  registrationNumber?: string; // CAR (Cadastro Ambiental Rural) ou similar
}

/**
 * Área total da fazenda (polígono delimitado pelo usuário)
 */
export interface FarmArea extends Omit<GeoFeature<FarmAreaProperties>, 'type'> {
  userId: string;
  type: GEO_FEATURE_TYPE.POLYGON;
  coordinates: GeoCoordinate[]; // Array simples para compatibilidade com Firestore
  boundingBox?: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Calcula o bounding box de uma área de fazenda
 */
export function calculateBoundingBox(coordinates: GeoCoordinate[]): FarmArea['boundingBox'] {
  if (coordinates.length === 0) return undefined;

  const lats = coordinates.map(c => c.latitude);
  const lngs = coordinates.map(c => c.longitude);

  return {
    north: Math.max(...lats),
    south: Math.min(...lats),
    east: Math.max(...lngs),
    west: Math.min(...lngs)
  };
}

/**
 * Valida se uma área de fazenda é válida
 */
export function isValidFarmArea(farmArea: Partial<FarmArea>): boolean {
  if (!farmArea.coordinates || farmArea.coordinates.length === 0) {
    return false;
  }

  // Deve ter pelo menos 3 pontos
  if (farmArea.coordinates.length < 3) {
    return false;
  }

  // Verifica se todas as coordenadas são válidas
  return farmArea.coordinates.every(
    coord =>
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
  );
}
