import { GeoCoordinate, GeoFeature, GeoFeatureProperties, GEO_FEATURE_TYPE } from './geo-feature.model';

/**
 * Propriedades específicas da área de produção (plantio)
 */
export interface ProductionAreaProperties extends GeoFeatureProperties {
  productionId: string; // ID do plantio vinculado
  productName: string; // Nome do produto plantado
  areaM2: number; // Área em metros quadrados
  areaHectares: number; // Área em hectares
  plantingDate?: string; // Data do plantio (ISO string)
  expectedHarvestDate?: string; // Data esperada de colheita (ISO string)
  quantityPlanted?: number; // Quantidade plantada (opcional, para exibição)
  unit?: string; // Unidade da quantidade (kg, unidades, etc.)
}

/**
 * Área de produção/plantio (polígono demarcado pelo usuário)
 * Vincula uma área geográfica a um plantio específico
 */
export interface ProductionArea extends Omit<GeoFeature<ProductionAreaProperties>, 'type'> {
  userId: string; // ID do usuário proprietário
  type: GEO_FEATURE_TYPE.POLYGON;
  coordinates: GeoCoordinate[]; // Array de coordenadas do polígono
  farmAreaId?: string; // ID da fazenda à qual pertence (opcional)
  isActive: boolean; // Se o plantio está ativo
}

/**
 * Valida se uma área de produção é válida
 */
export function isValidProductionArea(productionArea: Partial<ProductionArea>): boolean {
  // Validação básica de coordenadas
  if (!productionArea.coordinates || productionArea.coordinates.length < 3) {
    return false;
  }

  // Validação de propriedades obrigatórias
  if (!productionArea.userId || !productionArea.properties?.productionId) {
    return false;
  }

  // Validação das coordenadas
  return productionArea.coordinates.every(
    coord =>
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
  );
}

/**
 * Verifica se uma área de produção está dentro de uma área de fazenda
 * Simplificação: verifica se o centro da área de produção está dentro da fazenda
 */
export function isProductionAreaInsideFarmArea(
  productionCoords: GeoCoordinate[],
  farmCoords: GeoCoordinate[]
): boolean {
  if (productionCoords.length === 0 || farmCoords.length === 0) {
    return false;
  }

  // Calcula o centro da área de produção
  const centerLat = productionCoords.reduce((sum, c) => sum + c.latitude, 0) / productionCoords.length;
  const centerLng = productionCoords.reduce((sum, c) => sum + c.longitude, 0) / productionCoords.length;

  // Verifica se o centro está dentro do polígono da fazenda usando Ray Casting
  return isPointInPolygon({ latitude: centerLat, longitude: centerLng }, farmCoords);
}

/**
 * Ray Casting Algorithm - verifica se um ponto está dentro de um polígono
 */
function isPointInPolygon(point: GeoCoordinate, polygon: GeoCoordinate[]): boolean {
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
