import { GeoCoordinate, GeoFeature, GeoFeatureProperties, GEO_FEATURE_TYPE } from './geo-feature.model';

/**
 * Status do talhão de plantio
 */
export enum PLANTING_PLOT_STATUS {
  AVAILABLE = 'available', // Disponível para plantio
  PLANTED = 'planted', // Plantado
  HARVESTING = 'harvesting', // Em colheita
  RESTING = 'resting', // Em descanso (pousio)
  MAINTENANCE = 'maintenance' // Em manutenção
}

/**
 * Propriedades específicas do talhão de plantio
 */
export interface PlantingPlotProperties extends GeoFeatureProperties {
  plotNumber?: string; // Número ou código do talhão
  plotName: string;
  areaM2: number;
  areaHectares: number;
  status: PLANTING_PLOT_STATUS;
  soilType?: string;
  irrigation?: boolean;
  notes?: string;
}

/**
 * Talhão de plantio (área específica dentro da fazenda)
 */
export interface PlantingPlot extends Omit<GeoFeature<PlantingPlotProperties>, 'type'> {
  userId: string;
  farmAreaId: string; // Referência à área da fazenda
  productionId?: string; // Referência ao plantio ativo (Production)
  type: GEO_FEATURE_TYPE.POLYGON;
  coordinates: GeoCoordinate[][];
}

/**
 * Dados para criar um novo talhão de plantio
 */
export interface CreatePlantingPlotDto {
  farmAreaId: string;
  plotName: string;
  coordinates: GeoCoordinate[];
  plotNumber?: string;
  soilType?: string;
  irrigation?: boolean;
  notes?: string;
  color?: string;
  fillColor?: string;
}

/**
 * Dados para atualizar um talhão de plantio
 */
export interface UpdatePlantingPlotDto {
  plotName?: string;
  plotNumber?: string;
  status?: PLANTING_PLOT_STATUS;
  productionId?: string;
  soilType?: string;
  irrigation?: boolean;
  notes?: string;
  color?: string;
  fillColor?: string;
}

/**
 * Valida se um talhão de plantio é válido
 */
export function isValidPlantingPlot(plot: Partial<PlantingPlot>): boolean {
  if (!plot.coordinates || plot.coordinates.length === 0) {
    return false;
  }

  const polygon = plot.coordinates[0];

  // Deve ter pelo menos 3 pontos
  if (polygon.length < 3) {
    return false;
  }

  // Verifica se todas as coordenadas são válidas
  return polygon.every(
    coord =>
      coord.latitude >= -90 &&
      coord.latitude <= 90 &&
      coord.longitude >= -180 &&
      coord.longitude <= 180
  );
}

/**
 * Obtém a cor do talhão baseado no status
 */
export function getPlotColorByStatus(status: PLANTING_PLOT_STATUS): string {
  const colors: Record<PLANTING_PLOT_STATUS, string> = {
    [PLANTING_PLOT_STATUS.AVAILABLE]: '#10B981', // Verde
    [PLANTING_PLOT_STATUS.PLANTED]: '#3B82F6', // Azul
    [PLANTING_PLOT_STATUS.HARVESTING]: '#F59E0B', // Laranja
    [PLANTING_PLOT_STATUS.RESTING]: '#6B7280', // Cinza
    [PLANTING_PLOT_STATUS.MAINTENANCE]: '#EF4444' // Vermelho
  };

  return colors[status] || '#6B7280';
}

/**
 * Obtém o label do status em português
 */
export function getPlotStatusLabel(status: PLANTING_PLOT_STATUS): string {
  const labels: Record<PLANTING_PLOT_STATUS, string> = {
    [PLANTING_PLOT_STATUS.AVAILABLE]: 'Disponível',
    [PLANTING_PLOT_STATUS.PLANTED]: 'Plantado',
    [PLANTING_PLOT_STATUS.HARVESTING]: 'Em Colheita',
    [PLANTING_PLOT_STATUS.RESTING]: 'Em Descanso',
    [PLANTING_PLOT_STATUS.MAINTENANCE]: 'Manutenção'
  };

  return labels[status] || 'Desconhecido';
}
