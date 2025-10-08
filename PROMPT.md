## Proposta de modelagem de banco de dados

### Entidades e Atributos

1. Farm/User

- uid: documentId (mesmo do firebase auth)
- farmName: string
- ownerName: string
- email: string
- location: geopoint
- createdAt: timestamp

2. Goal

- goalId: documentId
- farmId: string
- productId: string
- type: string (sale, production)
- description: string
- targetValue: number
- currentValue: number
- startDate: timestamp
- endDate: timestamp
- status: string (active, expired)

3. Product

- productId: documentId
- farmId: string
- name: string
- unitOfMeasure: string
- quantity: number

4. Production

- productionId: documentId
- farmId: string
- productId: string
- status: string (pending, in production, harvested, canceled)
- quantityPlanted: number
- quantityHarvested: number
- startDate: timestamp
- harvestDate: timestamp

5. ProductAnalytics

- analyticsId: documentId (farmId_productId)
- farmId: string
- productId: string
- productName: string
- totalSoldQuantity: number
- totalRevenue (quantity x unitPrice): number
- totalProfit: number
- lastSaleDate: timestamp

## Regra de negócio

- Cada fazenda pode ter múltiplos produtos, metas e produções.
- As metas podem ser de venda ou produção, e cada meta está associada a um produto
- A produção acompanha o status do ciclo de vida do cultivo, desde o plantio até a colheita.
- A análise de produtos agrega dados de vendas.
- As metas expiram após a data de término, mas permanecem no histórico.
- A quantidade atual de um produto deve ser atualizada após cada venda ou produção.
- A análise de produtos deve ser atualizada periodicamente para refletir as vendas recentes.
- A autenticação e autorização são gerenciadas pelo Firebase Auth, garantindo que apenas usuários autorizados possam acessar ou modificar os dados da fazenda.
- As operações de leitura e escrita no banco de dados devem ser otimizadas para minimizar custos e latência, utilizando índices e consultas eficientes.

### Considerações Finais
• Dashboard de vendas (visão dos produtos por maior lucro);
• Dashboard de produção (visão do que está aguardando, em produção,
já colhido);
• Controle de Estoque e Vendas (Input dos dados para análise, dados
de venda e dados de produção);
• Metas de vendas e de produção (Sistema de notificações quando
bater a meta);
