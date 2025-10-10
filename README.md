# 🌾 Farm Manager - Sistema de Gestão para Fazendas

[![Angular](https://img.shields.io/badge/Angular-20.2.0-red)](https://angular.dev)
[![Nx](https://img.shields.io/badge/Nx-21.5.3-blue)](https://nx.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-20.2.0-orange)](https://primeng.org/)

Sistema completo de gestão para fazendas construído com **Angular 20**, **Nx Monorepo**, **Firebase/Firestore**, **PrimeNG** e **TailwindCSS**.

Suporta **Web** e **Mobile** (via WebView) com comunicação bidirecional para funcionalidades de mapeamento.

---

## 📋 Índice

- [Features](#-features)
- [Quick Start](#-quick-start)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Rotas](#️-rotas)
- [Tech Stack](#️-tech-stack)
- [Scripts Disponíveis](#-scripts-disponíveis)
- [Arquitetura](#️-arquitetura)
- [Integração Mobile (WebView)](#-integração-mobile-webview)
- [Documentação](#-documentação)
- [Status do Projeto](#-status-do-projeto)
- [Contribuindo](#-contribuindo)

---

## ✨ Features

### 🔐 Autenticação
- ✅ Login com email e senha
- ✅ Registro de usuário e fazenda
- ✅ Validações completas
- ✅ Dark mode support

### 🌱 Gestão de Plantios
- ✅ Registro de plantios com seleção de área no mapa
- ✅ Cálculo automático de área (m² e hectares)
- ✅ Previsão de colheita
- ✅ Custos de produção detalhados
- ✅ Visualização de áreas plantadas no mapa

### 📦 Gestão de Produtos
- ✅ CRUD completo de produtos
- ✅ Categorias: Vegetables, Fruits, Grains, Dairy, Meat, Other
- ✅ Preços e unidades de medida
- ✅ Lista com paginação

### 💰 Gestão de Vendas
- ✅ Registro de vendas
- ✅ Filtros por status (All, Completed, Pending)
- ✅ Dashboard de resumo financeiro
- ✅ Ações: Completar, Visualizar, Deletar

### 🗺️ Mapas Interativos
- ✅ Visualização de áreas de fazenda
- ✅ Demarcação de áreas de plantio
- ✅ Labels com informações do plantio
- ✅ Integração com Leaflet.js
- ✅ Suporte a WebView mobile (Flutter/React Native)

### 📊 Analytics
- ✅ Dashboard de métricas
- ✅ Top produtos mais lucrativos
- ✅ Receita, Custo, Lucro, Margem
- ✅ Cards de resumo (Revenue, Profit, Margin)

---

## 🚀 Quick Start

### 1. Instalar dependências
```bash
npm install
```

### 2. Configurar Firebase
Siga as instruções em [FIREBASE_SETUP.md](./FIREBASE_SETUP.md)

Edite `libs/shared/environments/firebase.config.ts` com suas credenciais.

### 3. Iniciar aplicação
```bash
npm start
```

Acesse: http://localhost:4200

---

## 📁 Estrutura do Projeto

```
fiap-hackaton/
├── apps/
│   ├── shell/              # Aplicação principal (host)
│   └── map/                # Micro-frontend de mapas
│
├── libs/
│   ├── auth/               # Autenticação
│   │   ├── domain/         # Models (FarmUser)
│   │   ├── data-access/    # Facades e Repositories
│   │   ├── feature-login/  # Login screen
│   │   └── feature-register/ # Register screen
│   │
│   ├── dashboard/          # Dashboard
│   │   ├── domain/         # Models (Product, Sale, Production)
│   │   ├── data-access/    # Facades e Repositories
│   │   ├── feature-products/  # Products CRUD
│   │   ├── feature-sales/     # Sales management
│   │   ├── feature-plantings/ # Planting management
│   │   └── feature-analytics/ # Analytics dashboard
│   │
│   ├── map/                # Sistema de Mapas
│   │   ├── domain/         # Models (GeoFeature, ProductionArea)
│   │   ├── data-access/    # Facades e Repositories
│   │   ├── ui/             # Componentes de mapa (BaseMap, AreaSelector)
│   │   ├── feature-viewer/ # Visualização de mapas
│   │   └── util/           # MobileBridgeService (Web ↔ Mobile)
│   │
│   └── shared/
│       ├── ui/             # Componentes reutilizáveis
│       └── environments/   # Firebase config
```

---

## 🗺️ Rotas

```
/                          → Redirect to /auth/login
/auth/login               → Login page
/auth/register            → Register page
/dashboard                → Dashboard home
/dashboard/products       → Products management
/dashboard/sales          → Sales tracking
/dashboard/plantings      → Planting management
/dashboard/plantings/new  → New planting with map selection
/dashboard/analytics      → Analytics & Reports
/map/viewer/:userId       → Farm map viewer
```

---

## 🛠️ Tech Stack

- **Angular 20** - Framework
- **Nx 21** - Monorepo tooling
- **TypeScript 5.9** - Language
- **Firebase/Firestore** - Backend & Database
- **Leaflet.js** - Interactive maps
- **PrimeNG 20** - UI Components
- **TailwindCSS 4** - Styling
- **Module Federation** - Micro-frontend architecture
- **Jest 29** - Testing
- **ESLint + Prettier** - Code quality

---

## 📋 Scripts Disponíveis

### Development
```bash
npm start                # Start shell + map (dev mode)
npm run build           # Build all projects
```

### Testing
```bash
npm test                # Run all tests
nx test map-util        # Test specific library
```

### Linting
```bash
npm run lint            # Lint all projects
npm run lint:fix        # Fix lint issues
```

---

## 🏗️ Arquitetura

### Padrões Implementados
- ✅ **Facade Pattern** - Business logic layer
- ✅ **Repository Pattern** - Data access layer
- ✅ **DDD** - Domain-driven design structure
- ✅ **Module Federation** - Micro-frontend architecture
- ✅ **Lazy Loading** - Route-based code splitting
- ✅ **Standalone Components** - Modern Angular
- ✅ **Signals** - Reactive state management
- ✅ **Mobile Bridge Pattern** - Web ↔ Mobile communication

### Camadas
1. **Domain** - Models e interfaces
2. **Infrastructure** - Repositories (Firestore access)
3. **Application** - Facades (Business logic)
4. **Feature** - Components (UI)
5. **Util** - Services utilitários (MobileBridge)

### Micro-frontend: Map Module

O módulo de mapas é um microfrontend independente que:
- Roda como aplicação standalone na porta **4201**
- É consumido pelo shell via **Module Federation**
- Pode ser desenvolvido e deployado separadamente
- Suporta integração com aplicações mobile via WebView

---

## 📱 Integração Mobile (WebView)

### Visão Geral

O sistema suporta aplicações mobile (Flutter/React Native) através de comunicação bidirecional via WebView.

```
┌──────────────────────────────────────────┐
│     Mobile App (Flutter/React Native)    │
│  ┌────────────────────────────────────┐  │
│  │         WebView Container          │  │
│  │  ┌──────────────────────────────┐  │  │
│  │  │  Angular Microfrontend (Map) │  │  │
│  │  │                              │  │  │
│  │  │    MobileBridgeService       │  │  │
│  │  │    • sendToNative()          │  │  │
│  │  │    • onMessageFromNative()   │  │  │
│  │  │    • sendAreaSelection()     │  │  │
│  │  │    • notifyMapReady()        │  │  │
│  │  └──────────────────────────────┘  │  │
│  │          ↕ postMessage              │  │
│  └────────────────────────────────────┘  │
│           ↕ JavaScript Channel           │
│  ┌────────────────────────────────────┐  │
│  │   Flutter WebView Controller       │  │
│  │   • JavaScriptChannel handler      │  │
│  │   • evaluateJavascript()           │  │
│  └────────────────────────────────────┘  │
└──────────────────────────────────────────┘
```

### MobileBridgeService

Localização: `libs/map/util/src/lib/mobile-bridge.service.ts`

**Funcionalidades:**
- Detecta se está rodando em WebView mobile
- Envia dados do web para o mobile (ex: área selecionada)
- Recebe comandos do mobile (ex: centralizar mapa)
- Comunicação bidirecional segura via `window.ReactNativeWebView`

### Mensagens Suportadas

#### Web → Mobile
| Action | Data | Descrição |
|--------|------|-----------|
| `mapReady` | - | Notifica que o mapa foi inicializado |
| `areaSelected` | `PlantingAreaSelection` | Envia área selecionada pelo usuário |

#### Mobile → Web
| Action | Data | Descrição |
|--------|------|-----------|
| `clearSelection` | - | Limpa a seleção atual no mapa |
| `setCenter` | `{ latitude, longitude }` | Centraliza o mapa |
| `resetMap` | - | Reseta o mapa para estado inicial |

### Exemplo de Uso (Angular)

```typescript
import { MobileBridgeService } from '@fiap-hackaton/map-util';

export class MapComponent implements OnInit {
  private mobileBridge = inject(MobileBridgeService);

  ngOnInit() {
    // Notificar mobile que está pronto
    this.mobileBridge.notifyMapReady();

    // Escutar comandos do mobile
    this.mobileBridge.onMessageFromNative((message) => {
      if (message.action === 'clearSelection') {
        this.clearMap();
      }
    });
  }

  onAreaSelected(selection: PlantingAreaSelection) {
    // Enviar para o mobile
    this.mobileBridge.sendAreaSelection(selection);
  }
}
```

### Exemplo de Uso (Flutter)

```dart
import 'package:webview_flutter/webview_flutter.dart';

class MapWebViewScreen extends StatefulWidget {
  @override
  _MapWebViewScreenState createState() => _MapWebViewScreenState();
}

class _MapWebViewScreenState extends State<MapWebViewScreen> {
  late final WebViewController _controller;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..addJavaScriptChannel(
        'ReactNativeWebView',
        onMessageReceived: (message) {
          final data = jsonDecode(message.message);

          if (data['action'] == 'areaSelected') {
            final area = PlantingAreaSelection.fromJson(data['data']);
            setState(() {
              selectedArea = area;
            });
          }
        },
      )
      ..loadRequest(Uri.parse('https://your-app.com/map'));
  }

  void _sendToWeb(Map<String, dynamic> message) {
    final messageJson = jsonEncode(message);
    final jsCode = """
      window.dispatchEvent(new MessageEvent('message', {
        data: '$messageJson'
      }));
    """;
    _controller.runJavaScript(jsCode);
  }
}
```

### 📚 Documentação Completa Mobile Bridge

Para documentação detalhada sobre integração mobile, incluindo:
- Setup completo do WebView
- Diagramas de fluxo de dados
- Troubleshooting
- Exemplos completos
- Validação e segurança

Consulte: **[libs/map/util/README.md](./libs/map/util/README.md)**

---

## 📚 Documentação

### Documentação Geral
- 📖 [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Documentação completa do sistema
- 🔥 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Setup do Firebase
- 📊 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Resumo arquitetural
- 🧪 [CLAUDE.md](./CLAUDE.md) - Guidelines de código e testes
- 📋 [GIT_COMMIT_INSTRUCTIONS.md](./GIT_COMMIT_INSTRUCTIONS.md) - Padrões de commit

### Documentação Específica
- 🗺️ **[libs/map/util/README.md](./libs/map/util/README.md)** - Mobile Bridge (Web ↔ Mobile)
- 🌐 **[.ruler/MAPS.md](./.ruler/MAPS.md)** - Guia completo Leaflet.js
- 🧪 **[.ruler/ANGULAR_UNIT_TESTING_GUIDE.md](./.ruler/ANGULAR_UNIT_TESTING_GUIDE.md)** - Testes Angular

---

## ✅ Status do Projeto

### Concluído ✅
- ✅ Autenticação (Login + Register)
- ✅ CRUD de Produtos
- ✅ Gestão de Vendas
- ✅ Gestão de Plantios com Mapa
- ✅ Visualização de Mapas com Labels
- ✅ Dashboard de Analytics
- ✅ Integração Mobile (MobileBridgeService)
- ✅ Rotas configuradas
- ✅ Firebase integrado
- ✅ UI responsiva com dark mode
- ✅ Module Federation (Micro-frontends)
- ✅ 100% Lint passing
- ✅ Documentação completa

### Em Desenvolvimento 🚧
- 🚧 Harvest Management
- 🚧 Stock Batches
- 🚧 Goals Tracking
- 🚧 Mobile App (Flutter)

---

## 🎯 Roadmap

### Próximas Features
1. **Mobile App (Flutter)**
   - Implementar WebView com MobileBridgeService
   - Integração completa com microfrontend de mapas
   - Notificações push

2. **Harvest Management**
   - Registro de colheitas
   - Vinculação com plantios
   - Análise de produtividade

3. **Advanced Analytics**
   - Previsões baseadas em histórico
   - Comparativos entre safras
   - Exportação de relatórios

4. **Offline Support**
   - Cache de dados essenciais
   - Sincronização automática
   - Progressive Web App (PWA)

---

## 🤝 Contribuindo

Este projeto segue o [Conventional Commits](https://www.conventionalcommits.org/).

### Adicionando Nova Funcionalidade

1. **Criar branch** seguindo padrão: `feat/nome-da-feature`
2. **Implementar** seguindo as guidelines em [CLAUDE.md](./CLAUDE.md)
3. **Testar** usando `npm test`
4. **Lint** usando `npm run lint`
5. **Commit** seguindo [Conventional Commits](./GIT_COMMIT_INSTRUCTIONS.md)
6. **Pull Request** com descrição detalhada

### Estrutura de Libs

- **domain** - Models e validações
- **data-access** - Facades e Repositories
- **feature-*** - Componentes de UI
- **ui** - Componentes compartilhados
- **util** - Services utilitários

### Dependency Rules

- Shell → Feature → Data-access → Domain → Util
- UI → Util
- Libs não podem ter dependências circulares

---

## 📄 Licença

MIT

---

**Suporte Web + Mobile via WebView** 📱🌐
