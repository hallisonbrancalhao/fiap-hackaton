# Production Areas - Áreas de Produção

## Visão Geral

A collection `productionAreas` foi criada para vincular áreas geográficas demarcadas no mapa aos plantios (productions). Isso permite que os usuários visualizem seus plantios ativos no mapa.

## Estrutura de Dados

### ProductionArea Model

```typescript
interface ProductionArea {
  id: string;
  userId: string; // ID do usuário proprietário
  type: GEO_FEATURE_TYPE.POLYGON;
  coordinates: GeoCoordinate[]; // Array de coordenadas do polígono
  farmAreaId?: string; // ID da fazenda (opcional)
  isActive: boolean; // Se o plantio está ativo
  properties: {
    productionId: string; // ID do plantio vinculado
    productName: string; // Nome do produto
    areaM2: number; // Área em metros quadrados
    areaHectares: number; // Área em hectares
    plantingDate?: string; // Data do plantio (ISO)
    expectedHarvestDate?: string; // Data esperada de colheita (ISO)
    name?: string;
    description?: string;
    color?: string;
    fillColor?: string;
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

## Como Usar

### 1. Criar uma Production Area

```typescript
import { ProductionAreaRepository } from '@fiap-hackaton/map-data-access';
import { ProductionArea, GEO_FEATURE_TYPE } from '@fiap-hackaton/domain';

// Inject o repository
constructor(private productionAreaRepo: ProductionAreaRepository) {}

// Criar área de produção
createProductionArea(
  userId: string,
  productionId: string,
  productName: string,
  coordinates: GeoCoordinate[],
  areaM2: number,
  areaHectares: number
) {
  const productionArea: Omit<ProductionArea, 'id' | 'createdAt' | 'updatedAt'> = {
    userId,
    type: GEO_FEATURE_TYPE.POLYGON,
    coordinates,
    isActive: true,
    properties: {
      productionId,
      productName,
      areaM2,
      areaHectares,
      color: '#3B82F6',
      fillColor: '#3B82F6'
    }
  };

  return this.productionAreaRepo.createProductionArea(productionArea);
}
```

### 2. Buscar Production Areas Ativas

```typescript
// Buscar todas as áreas ativas do usuário
getActiveProductionAreas(userId: string): Observable<ProductionArea[]> {
  return this.productionAreaRepo.getActiveProductionAreasByUserId(userId);
}

// Buscar área de produção de um plantio específico
getProductionAreaByPlanting(userId: string, productionId: string): Observable<ProductionArea | null> {
  return this.productionAreaRepo.getProductionAreaByProductionId(userId, productionId);
}
```

### 3. Atualizar Status

```typescript
// Desativar área quando plantio for colhido
deactivateProductionArea(areaId: string): Observable<void> {
  return this.productionAreaRepo.deactivateProductionArea(areaId);
}
```

## Integração com o Fluxo de Plantio

### Ao criar um novo plantio:

1. Usuário preenche dados do plantio no formulário
2. Usuário demarca a área no mapa (PlantingAreaSelectorComponent)
3. Ao confirmar:
   - Cria o documento `production` na collection `productions`
   - Cria o documento `productionArea` na collection `productionAreas` vinculando:
     - `properties.productionId` → ID do plantio criado
     - `userId` → ID do usuário
     - `coordinates` → Coordenadas demarcadas
     - `isActive: true`

### Ao colher um plantio:

1. Atualizar status do plantio: `production.status = HARVESTED`
2. Desativar área: `productionArea.isActive = false`

### Visualizar no Mapa:

1. Buscar todas as áreas ativas: `getActiveProductionAreasByUserId(userId)`
2. Renderizar polígonos no mapa para cada área
3. Adicionar popups/tooltips com informações do plantio

## Índices Firestore

Os seguintes índices compostos foram criados para otimizar as queries:

```json
[
  {
    "collectionGroup": "productionAreas",
    "fields": [
      { "fieldPath": "userId", "order": "ASCENDING" },
      { "fieldPath": "isActive", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  },
  {
    "collectionGroup": "productionAreas",
    "fields": [
      { "fieldPath": "userId", "order": "ASCENDING" },
      { "fieldPath": "properties.productionId", "order": "ASCENDING" }
    ]
  },
  {
    "collectionGroup": "productionAreas",
    "fields": [
      { "fieldPath": "userId", "order": "ASCENDING" },
      { "fieldPath": "farmAreaId", "order": "ASCENDING" },
      { "fieldPath": "createdAt", "order": "DESCENDING" }
    ]
  }
]
```

## Funções Utilitárias

### Validação

```typescript
import { isValidProductionArea } from '@fiap-hackaton/domain';

const isValid = isValidProductionArea(productionArea);
// Valida:
// - Coordenadas (mínimo 3 pontos, lat/lng válidos)
// - userId obrigatório
// - properties.productionId obrigatório
```

### Verificar se está dentro da fazenda

```typescript
import { isProductionAreaInsideFarmArea } from '@fiap-hackaton/domain';

const isInside = isProductionAreaInsideFarmArea(
  productionCoordinates,
  farmCoordinates
);
```

## Exemplo Completo - Componente de Plantio

```typescript
import { Component } from '@angular/core';
import { ProductionAreaRepository } from '@fiap-hackaton/map-data-access';
import { ProductionRepository } from '@fiap-hackaton/dashboard-data-access';
import { PlantingAreaSelection } from '@fiap-hackaton/map-ui';
import { forkJoin } from 'rxjs';
import { switchMap } from 'rxjs/operators';

@Component({...})
export class PlantingFormComponent {
  constructor(
    private productionRepo: ProductionRepository,
    private productionAreaRepo: ProductionAreaRepository,
    private authService: AuthService
  ) {}

  onAreaSelected(selection: PlantingAreaSelection) {
    const userId = this.authService.currentUserId();
    const productionData = this.getProductionFormData(); // Dados do formulário

    // 1. Criar plantio
    this.productionRepo.create(productionData).pipe(
      switchMap(productionId => {
        // 2. Criar área de produção vinculada
        const productionArea = {
          userId,
          type: GEO_FEATURE_TYPE.POLYGON,
          coordinates: selection.coordinates,
          isActive: true,
          properties: {
            productionId,
            productName: productionData.productName,
            areaM2: selection.areaM2,
            areaHectares: selection.areaHectares,
            plantingDate: productionData.plantingDate.toISOString(),
            expectedHarvestDate: productionData.expectedHarvestDate.toISOString()
          }
        };

        return this.productionAreaRepo.createProductionArea(productionArea);
      })
    ).subscribe({
      next: () => {
        this.showSuccessMessage('Plantio criado com sucesso!');
        this.navigateToPlantings();
      },
      error: (error) => {
        console.error('Erro ao criar plantio:', error);
        this.showErrorMessage('Erro ao criar plantio. Tente novamente.');
      }
    });
  }
}
```

## Visualização no Mapa

```typescript
@Component({...})
export class FarmMapViewerComponent implements OnInit {
  constructor(
    private productionAreaRepo: ProductionAreaRepository,
    private authService: AuthService
  ) {}

  ngOnInit() {
    const userId = this.authService.currentUserId();

    // Buscar áreas de produção ativas
    this.productionAreaRepo.getActiveProductionAreasByUserId(userId)
      .subscribe(areas => {
        areas.forEach(area => {
          // Renderizar polígono no mapa
          this.map.addPolygon(area.coordinates, {
            color: area.properties.color || '#3B82F6',
            fillColor: area.properties.fillColor || '#3B82F6',
            fillOpacity: 0.3,
            weight: 2
          }).bindPopup(`
            <strong>${area.properties.productName}</strong><br>
            Área: ${area.properties.areaHectares.toFixed(2)} ha<br>
            Plantio: ${area.properties.plantingDate}
          `);
        });

        // Ajustar visualização para incluir todas as áreas
        if (areas.length > 0) {
          const allCoords = areas.flatMap(a => a.coordinates);
          this.map.fitBounds(allCoords);
        }
      });
  }
}
```

## Deploy dos Índices

Para aplicar os novos índices no Firestore:

```bash
# Deploy apenas dos índices
firebase deploy --only firestore:indexes

# Verificar índices existentes
firebase firestore:indexes

# Listar projetos (se necessário selecionar o projeto)
firebase projects:list
firebase use <project-id>
```

## Próximos Passos

1. ✅ Domain model criado (`production-area.model.ts`)
2. ✅ Repository criado (`production-area.repository.ts`)
3. ✅ Exports atualizados nos módulos
4. ✅ Índices do Firestore atualizados
5. ⏳ Criar facade para ProductionArea (se necessário)
6. ⏳ Integrar com formulário de criação de plantio
7. ⏳ Atualizar visualizador de mapa para exibir áreas de produção
8. ⏳ Deploy dos índices no Firestore
