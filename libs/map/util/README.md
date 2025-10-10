# @fiap-hackaton/map-util

Biblioteca de utilitários para o módulo de mapas, incluindo serviços de comunicação entre a aplicação web (microfrontend) e aplicações mobile nativas.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Serviços](#serviços)
- [Arquitetura de Comunicação](#arquitetura-de-comunicação)
- [Guia para Desenvolvedores Web](#guia-para-desenvolvedores-web)
- [Guia para Desenvolvedores Mobile (Flutter)](#guia-para-desenvolvedores-mobile-flutter)
- [Fluxo de Dados](#fluxo-de-dados)
- [Exemplos Práticos](#exemplos-práticos)
- [Mensagens Suportadas](#mensagens-suportadas)
- [Segurança](#segurança)
- [Troubleshooting](#troubleshooting)

---

## 🎯 Visão Geral

Esta biblioteca fornece uma ponte de comunicação bidirecional entre:
- **Web App** (Angular): Microfrontend de mapas rodando em WebView
- **Mobile App** (Flutter/React Native): Aplicação nativa que hospeda o WebView

### Casos de Uso

- Permitir que o usuário selecione áreas no mapa (web) e envie as coordenadas para o app mobile
- Notificar o app mobile quando o mapa estiver pronto para interação
- Receber comandos do app mobile para controlar o mapa web
- Sincronizar dados entre as camadas web e nativa

---

## 🔧 Serviços

### MobileBridgeService

Serviço singleton (`providedIn: 'root'`) responsável pela comunicação com aplicações mobile nativas via WebView.

#### Métodos Públicos

```typescript
// Detecta se está rodando dentro de um WebView mobile
private isMobileApp(): boolean

// Envia mensagem para o app nativo
sendToNative(message: MobileBridgeMessage): void

// Registra callback para receber mensagens do app nativo
onMessageFromNative(callback: (message: MobileBridgeMessage) => void): void

// Envia seleção de área de plantio para o mobile
sendAreaSelection(selection: PlantingAreaSelection): void

// Notifica o mobile que o mapa está pronto
notifyMapReady(): void
```

#### Interfaces

```typescript
interface MobileBridgeMessage {
  action: string;        // Tipo de ação (ex: 'areaSelected', 'mapReady')
  data?: unknown;        // Dados opcionais da mensagem
}

interface PlantingAreaSelection {
  coordinates: GeoCoordinate[];  // Array de coordenadas do polígono
  areaM2: number;                 // Área em metros quadrados
  areaHectares: number;           // Área em hectares
}
```

---

## 🏗️ Arquitetura de Comunicação

### Diagrama de Fluxo

```
┌─────────────────────────────────────────────────────────────┐
│                      Mobile App (Flutter)                   │
│  ┌───────────────────────────────────────────────────────┐  │
│  │                    WebView Container                   │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │          Angular Microfrontend (Map)            │  │  │
│  │  │                                                 │  │  │
│  │  │  ┌─────────────────────────────────────────┐  │  │  │
│  │  │  │      MobileBridgeService               │  │  │  │
│  │  │  │                                         │  │  │  │
│  │  │  │  • sendToNative()                      │  │  │  │
│  │  │  │  • onMessageFromNative()               │  │  │  │
│  │  │  │  • sendAreaSelection()                 │  │  │  │
│  │  │  │  • notifyMapReady()                    │  │  │  │
│  │  │  └─────────────────────────────────────────┘  │  │  │
│  │  │                    ▲  │                        │  │  │
│  │  │                    │  │                        │  │  │
│  │  │              ┌─────┘  └─────┐                 │  │  │
│  │  │              │  postMessage  │                 │  │  │
│  │  │              │  addEventListener                │  │  │
│  │  └──────────────┼───────────────┼─────────────────┘  │  │
│  │                 │               │                     │  │
│  └─────────────────┼───────────────┼─────────────────────┘  │
│                    │               │                         │
│           ┌────────▼───────────────▼────────┐               │
│           │  WebView JavaScript Channel     │               │
│           │  (window.ReactNativeWebView)    │               │
│           └────────▲───────────────┬────────┘               │
│                    │               │                         │
│           ┌────────┴───────────────▼────────┐               │
│           │    Flutter WebView Controller   │               │
│           │  • JavaScriptChannel handler    │               │
│           │  • evaluateJavascript()         │               │
│           └─────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────┘
```

### Camadas de Comunicação

1. **Angular (Web)**: `MobileBridgeService` → `window.ReactNativeWebView.postMessage()`
2. **WebView Channel**: Interface JavaScript exposta pelo container nativo
3. **Flutter (Mobile)**: `JavaScriptChannel` → Controller Flutter → Business Logic

---

## 💻 Guia para Desenvolvedores Web

### Instalação

```typescript
import { MobileBridgeService } from '@fiap-hackaton/map-util';
```

### Uso Básico

#### 1. Injetar o Serviço

```typescript
import { Component, inject, OnInit } from '@angular/core';
import { MobileBridgeService } from '@fiap-hackaton/map-util';

@Component({
  selector: 'app-map-selector',
  template: `...`
})
export class MapSelectorComponent implements OnInit {
  private mobileBridge = inject(MobileBridgeService);

  ngOnInit() {
    // Notificar o mobile que o componente está pronto
    this.mobileBridge.notifyMapReady();
  }
}
```

#### 2. Enviar Dados para o Mobile

```typescript
// Quando o usuário selecionar uma área no mapa
onAreaSelected(coordinates: GeoCoordinate[]) {
  const areaM2 = this.calculateArea(coordinates);
  const areaHectares = areaM2 / 10000;

  // Enviar para o mobile
  this.mobileBridge.sendAreaSelection({
    coordinates,
    areaM2,
    areaHectares
  });
}
```

#### 3. Receber Mensagens do Mobile

```typescript
ngOnInit() {
  // Registrar listener para mensagens do mobile
  this.mobileBridge.onMessageFromNative((message) => {
    switch (message.action) {
      case 'resetMap':
        this.resetMapView();
        break;

      case 'highlightArea':
        const areaId = message.data as string;
        this.highlightArea(areaId);
        break;

      case 'setCenter':
        const { latitude, longitude } = message.data as GeoCoordinate;
        this.mapComponent.setCenter(latitude, longitude);
        break;
    }
  });

  // Notificar que está pronto
  this.mobileBridge.notifyMapReady();
}
```

### Exemplo Completo: Componente de Seleção de Área

```typescript
import { Component, inject, OnInit, OnDestroy, output } from '@angular/core';
import { MobileBridgeService } from '@fiap-hackaton/map-util';
import { PlantingAreaSelection } from '@fiap-hackaton/map-ui';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-planting-area-selector',
  template: `
    <div class="map-container">
      <lib-base-map
        (areaSelected)="onAreaSelected($event)"
        [drawingMode]="true" />

      @if (selectedArea) {
        <div class="area-info">
          <p>Área: {{ selectedArea.areaHectares | number:'1.2-2' }} ha</p>
          <p>({{ selectedArea.areaM2 | number:'1.0-0' }} m²)</p>
          <button (click)="confirmSelection()">Confirmar Área</button>
        </div>
      }
    </div>
  `
})
export class PlantingAreaSelectorComponent implements OnInit, OnDestroy {
  private mobileBridge = inject(MobileBridgeService);
  private destroy$ = new Subject<void>();

  areaConfirmed = output<PlantingAreaSelection>();
  selectedArea: PlantingAreaSelection | null = null;

  ngOnInit() {
    // Escutar comandos do mobile
    this.mobileBridge.onMessageFromNative((message) => {
      if (message.action === 'clearSelection') {
        this.clearSelection();
      }
    });

    // Notificar que o mapa está pronto
    this.mobileBridge.notifyMapReady();
  }

  onAreaSelected(selection: PlantingAreaSelection) {
    this.selectedArea = selection;
  }

  confirmSelection() {
    if (!this.selectedArea) return;

    // Enviar para o componente pai (Angular)
    this.areaConfirmed.emit(this.selectedArea);

    // Enviar para o app mobile
    this.mobileBridge.sendAreaSelection(this.selectedArea);
  }

  clearSelection() {
    this.selectedArea = null;
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

---

## 📱 Guia para Desenvolvedores Mobile (Flutter)

### Configuração do WebView

#### 1. Adicionar Dependências

```yaml
# pubspec.yaml
dependencies:
  webview_flutter: ^4.4.0
```

#### 2. Configurar JavaScript Channel

```dart
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:webview_flutter/webview_flutter.dart';

class MapWebViewScreen extends StatefulWidget {
  @override
  _MapWebViewScreenState createState() => _MapWebViewScreenState();
}

class _MapWebViewScreenState extends State<MapWebViewScreen> {
  late final WebViewController _controller;
  PlantingAreaSelection? selectedArea;

  @override
  void initState() {
    super.initState();
    _initializeWebView();
  }

  void _initializeWebView() {
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))

      // Adicionar canal JavaScript para receber mensagens do web
      ..addJavaScriptChannel(
        'ReactNativeWebView',
        onMessageReceived: (JavaScriptMessage message) {
          _handleWebMessage(message.message);
        },
      )

      // Carregar URL do microfrontend
      ..loadRequest(Uri.parse('https://your-app.com/map'));
  }

  void _handleWebMessage(String messageJson) {
    try {
      final data = jsonDecode(messageJson);
      final action = data['action'] as String;

      switch (action) {
        case 'mapReady':
          print('✅ Mapa está pronto para interação');
          // Opcional: enviar configurações iniciais para o mapa
          _sendToWeb({
            'action': 'setCenter',
            'data': {
              'latitude': -23.5505,
              'longitude': -46.6333,
            }
          });
          break;

        case 'areaSelected':
          final areaData = data['data'] as Map<String, dynamic>;
          setState(() {
            selectedArea = PlantingAreaSelection.fromJson(areaData);
          });
          print('📍 Área selecionada: ${selectedArea!.areaHectares} ha');
          break;
      }
    } catch (e) {
      print('❌ Erro ao processar mensagem do web: $e');
    }
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

  void _clearSelection() {
    _sendToWeb({
      'action': 'clearSelection'
    });

    setState(() {
      selectedArea = null;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text('Selecionar Área de Plantio'),
        actions: [
          if (selectedArea != null)
            IconButton(
              icon: Icon(Icons.clear),
              onPressed: _clearSelection,
              tooltip: 'Limpar Seleção',
            ),
        ],
      ),
      body: Column(
        children: [
          // WebView
          Expanded(
            child: WebViewWidget(controller: _controller),
          ),

          // Informações da área selecionada
          if (selectedArea != null)
            Container(
              padding: EdgeInsets.all(16),
              color: Colors.green.shade50,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Área Selecionada',
                    style: TextStyle(
                      fontSize: 18,
                      fontWeight: FontWeight.bold,
                    ),
                  ),
                  SizedBox(height: 8),
                  Text('Área: ${selectedArea!.areaHectares.toStringAsFixed(2)} ha'),
                  Text('(${selectedArea!.areaM2.toStringAsFixed(0)} m²)'),
                  Text('Coordenadas: ${selectedArea!.coordinates.length} pontos'),
                  SizedBox(height: 16),
                  ElevatedButton(
                    onPressed: _confirmAndSave,
                    child: Text('Confirmar e Salvar'),
                    style: ElevatedButton.styleFrom(
                      minimumSize: Size(double.infinity, 50),
                    ),
                  ),
                ],
              ),
            ),
        ],
      ),
    );
  }

  void _confirmAndSave() async {
    if (selectedArea == null) return;

    // Salvar no banco de dados local ou enviar para API
    await _savePlantingArea(selectedArea!);

    // Navegar de volta
    Navigator.pop(context, selectedArea);
  }

  Future<void> _savePlantingArea(PlantingAreaSelection area) async {
    // Implementar lógica de salvamento
    print('💾 Salvando área: $area');
  }
}

// Model
class PlantingAreaSelection {
  final List<GeoCoordinate> coordinates;
  final double areaM2;
  final double areaHectares;

  PlantingAreaSelection({
    required this.coordinates,
    required this.areaM2,
    required this.areaHectares,
  });

  factory PlantingAreaSelection.fromJson(Map<String, dynamic> json) {
    return PlantingAreaSelection(
      coordinates: (json['coordinates'] as List)
          .map((c) => GeoCoordinate.fromJson(c))
          .toList(),
      areaM2: (json['areaM2'] as num).toDouble(),
      areaHectares: (json['areaHectares'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'coordinates': coordinates.map((c) => c.toJson()).toList(),
    'areaM2': areaM2,
    'areaHectares': areaHectares,
  };
}

class GeoCoordinate {
  final double latitude;
  final double longitude;

  GeoCoordinate({required this.latitude, required this.longitude});

  factory GeoCoordinate.fromJson(Map<String, dynamic> json) {
    return GeoCoordinate(
      latitude: (json['latitude'] as num).toDouble(),
      longitude: (json['longitude'] as num).toDouble(),
    );
  }

  Map<String, dynamic> toJson() => {
    'latitude': latitude,
    'longitude': longitude,
  };
}
```

---

## 🔄 Fluxo de Dados

### 1. Inicialização do Mapa

```
┌─────────┐                    ┌──────────┐                    ┌────────┐
│ Flutter │                    │  WebView │                    │ Angular│
└────┬────┘                    └─────┬────┘                    └───┬────┘
     │                               │                             │
     │ 1. Carrega WebView            │                             │
     ├──────────────────────────────>│                             │
     │                               │                             │
     │                               │ 2. Inicializa Angular       │
     │                               ├────────────────────────────>│
     │                               │                             │
     │                               │                             │ 3. ngOnInit()
     │                               │                             │    notifyMapReady()
     │                               │                             ├──┐
     │                               │                             │  │
     │                               │                             │<─┘
     │                               │                             │
     │                               │ 4. postMessage('mapReady')  │
     │ 5. onMessageReceived          │<────────────────────────────┤
     │<──────────────────────────────┤                             │
     │                               │                             │
     │ 6. Log: "Mapa pronto"         │                             │
     ├──┐                            │                             │
     │  │                            │                             │
     │<─┘                            │                             │
```

### 2. Seleção de Área no Mapa

```
┌─────────┐                    ┌──────────┐                    ┌────────┐
│ Flutter │                    │  WebView │                    │ Angular│
└────┬────┘                    └─────┬────┘                    └───┬────┘
     │                               │                             │
     │                               │                             │ 1. Usuário desenha
     │                               │                             │    polígono no mapa
     │                               │                             ├──┐
     │                               │                             │  │
     │                               │                             │<─┘
     │                               │                             │
     │                               │                             │ 2. Calcula área
     │                               │                             ├──┐
     │                               │                             │  │
     │                               │                             │<─┘
     │                               │                             │
     │                               │                             │ 3. sendAreaSelection()
     │                               │                             ├──┐
     │                               │                             │  │
     │                               │                             │<─┘
     │                               │                             │
     │                               │ 4. postMessage({            │
     │                               │    action: 'areaSelected',  │
     │                               │    data: {...}              │
     │ 5. onMessageReceived          │ })                          │
     │<──────────────────────────────┤<────────────────────────────┤
     │                               │                             │
     │ 6. Atualiza UI                │                             │
     │    mostra área selecionada    │                             │
     ├──┐                            │                             │
     │  │                            │                             │
     │<─┘                            │                             │
```

### 3. Comando do Mobile para o Web

```
┌─────────┐                    ┌──────────┐                    ┌────────┐
│ Flutter │                    │  WebView │                    │ Angular│
└────┬────┘                    └─────┬────┘                    └───┬────┘
     │                               │                             │
     │ 1. Usuário clica "Limpar"     │                             │
     ├──┐                            │                             │
     │  │                            │                             │
     │<─┘                            │                             │
     │                               │                             │
     │ 2. _sendToWeb({               │                             │
     │    action: 'clearSelection'   │                             │
     │ })                            │                             │
     ├──────────────────────────────>│                             │
     │                               │                             │
     │                               │ 3. dispatchEvent('message') │
     │                               ├────────────────────────────>│
     │                               │                             │
     │                               │                             │ 4. onMessageFromNative
     │                               │                             │    callback({
     │                               │                             │      action: 'clearSelection'
     │                               │                             │    })
     │                               │                             ├──┐
     │                               │                             │  │
     │                               │                             │<─┘
     │                               │                             │
     │                               │                             │ 5. clearSelection()
     │                               │                             │    limpa mapa
     │                               │                             ├──┐
     │                               │                             │  │
     │                               │                             │<─┘
```

---

## 📨 Mensagens Suportadas

### Web → Mobile

| Action | Data | Descrição |
|--------|------|-----------|
| `mapReady` | - | Notifica que o mapa foi inicializado |
| `areaSelected` | `PlantingAreaSelection` | Envia área selecionada pelo usuário |

### Mobile → Web

| Action | Data | Descrição |
|--------|------|-----------|
| `clearSelection` | - | Limpa a seleção atual no mapa |
| `setCenter` | `{ latitude: number, longitude: number }` | Centraliza o mapa em coordenadas específicas |
| `resetMap` | - | Reseta o mapa para estado inicial |
| `highlightArea` | `string` (areaId) | Destaca uma área específica no mapa |

### Adicionar Novas Mensagens

#### No Web (Angular):

```typescript
// Enviar nova mensagem
this.mobileBridge.sendToNative({
  action: 'customAction',
  data: { /* seus dados */ }
});

// Receber nova mensagem
this.mobileBridge.onMessageFromNative((message) => {
  if (message.action === 'customAction') {
    // Processar mensagem
  }
});
```

#### No Mobile (Flutter):

```dart
// Receber nova mensagem
void _handleWebMessage(String messageJson) {
  final data = jsonDecode(messageJson);

  if (data['action'] == 'customAction') {
    final customData = data['data'];
    // Processar mensagem
  }
}

// Enviar nova mensagem
_sendToWeb({
  'action': 'customAction',
  'data': { /* seus dados */ }
});
```

---

## 🔒 Segurança

### Validação de Mensagens

#### Web (Angular):

```typescript
ngOnInit() {
  this.mobileBridge.onMessageFromNative((message) => {
    // Validar estrutura da mensagem
    if (!message.action || typeof message.action !== 'string') {
      console.warn('Invalid message format:', message);
      return;
    }

    // Whitelist de ações permitidas
    const allowedActions = ['clearSelection', 'setCenter', 'resetMap'];
    if (!allowedActions.includes(message.action)) {
      console.warn('Unknown action:', message.action);
      return;
    }

    // Processar mensagem validada
    this.handleSecureMessage(message);
  });
}
```

#### Mobile (Flutter):

```dart
void _handleWebMessage(String messageJson) {
  try {
    final data = jsonDecode(messageJson);

    // Validar estrutura
    if (!data.containsKey('action')) {
      print('⚠️ Invalid message structure');
      return;
    }

    final action = data['action'] as String;

    // Whitelist de ações
    const allowedActions = ['mapReady', 'areaSelected'];
    if (!allowedActions.contains(action)) {
      print('⚠️ Unknown action: $action');
      return;
    }

    // Processar mensagem validada
    _processSecureMessage(action, data['data']);

  } catch (e) {
    print('❌ Error parsing message: $e');
  }
}
```

### Sanitização de Dados

```typescript
// Angular - Antes de enviar dados para o mobile
sendAreaSelection(selection: PlantingAreaSelection) {
  // Validar coordenadas
  const validCoordinates = selection.coordinates.every(coord =>
    coord.latitude >= -90 && coord.latitude <= 90 &&
    coord.longitude >= -180 && coord.longitude <= 180
  );

  if (!validCoordinates) {
    console.error('Invalid coordinates');
    return;
  }

  // Validar área
  if (selection.areaM2 <= 0 || selection.areaHectares <= 0) {
    console.error('Invalid area values');
    return;
  }

  // Enviar dados validados
  this.mobileBridge.sendAreaSelection(selection);
}
```

---

## 🐛 Troubleshooting

### Problema: Mensagens não estão sendo recebidas

**Sintomas:**
- `notifyMapReady()` não dispara callback no mobile
- `sendAreaSelection()` não atualiza UI mobile

**Soluções:**

1. **Verificar JavaScript habilitado:**
```dart
_controller = WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted) // ✅ Necessário
```

2. **Verificar canal JavaScript:**
```dart
_controller.addJavaScriptChannel(
  'ReactNativeWebView', // ⚠️ Nome deve ser exatamente este
  onMessageReceived: (message) {
    print('Received: ${message.message}'); // Debug
  }
)
```

3. **Verificar detecção do WebView (Angular):**
```typescript
// No console do navegador (DevTools mobile)
console.log(window.ReactNativeWebView); // Deve retornar objeto, não undefined
```

### Problema: `isMobileApp()` retorna `false` dentro do WebView

**Causa:** O canal JavaScript não foi registrado corretamente

**Solução:**
```dart
// Flutter - Adicionar canal ANTES de carregar URL
_controller = WebViewController()
  ..setJavaScriptMode(JavaScriptMode.unrestricted)
  ..addJavaScriptChannel('ReactNativeWebView', ...) // ✅ Antes do loadRequest
  ..loadRequest(Uri.parse('https://your-app.com/map'));
```

### Problema: Mensagens do mobile para web não funcionam

**Sintomas:**
- `_sendToWeb()` não dispara `onMessageFromNative` no Angular

**Solução:**

Verifique o código JavaScript injetado:
```dart
void _sendToWeb(Map<String, dynamic> message) {
  final messageJson = jsonEncode(message);

  // ⚠️ Usar aspas simples para envolver JSON
  final jsCode = """
    (function() {
      try {
        window.dispatchEvent(new MessageEvent('message', {
          data: '$messageJson'
        }));
        console.log('✅ Message sent to web');
      } catch (e) {
        console.error('❌ Error sending message:', e);
      }
    })();
  """;

  _controller.runJavaScript(jsCode);
}
```

### Problema: Erro "JSON.parse failed"

**Causa:** Dados não estão sendo serializados corretamente

**Solução (Flutter):**
```dart
// ❌ Errado
_controller.runJavaScript("window.postMessage(${message.toString()})");

// ✅ Correto
final messageJson = jsonEncode(message);
_controller.runJavaScript("window.postMessage('$messageJson')");
```

### Problema: CORS ao carregar microfrontend

**Sintomas:**
- Erro: "Blocked by CORS policy"

**Solução:**
```dart
// Configurar headers no WebView (se necessário)
_controller
  ..setNavigationDelegate(
    NavigationDelegate(
      onNavigationRequest: (request) {
        // Permitir apenas domínios confiáveis
        if (request.url.startsWith('https://your-app.com')) {
          return NavigationDecision.navigate;
        }
        return NavigationDecision.prevent;
      },
    ),
  )
```

### Debug Mode

#### Angular:
```typescript
// Habilitar logs detalhados em desenvolvimento
if (!environment.production) {
  console.log('[MobileBridge] Is mobile app:', this.isMobileApp());

  // Logar todas as mensagens
  this.originalSendToNative = this.sendToNative;
  this.sendToNative = (message) => {
    console.log('[MobileBridge] Sending:', message);
    this.originalSendToNative(message);
  };
}
```

#### Flutter:
```dart
void _handleWebMessage(String messageJson) {
  if (kDebugMode) {
    print('🔵 [WebView] Received message: $messageJson');
  }
  // processar...
}

void _sendToWeb(Map<String, dynamic> message) {
  if (kDebugMode) {
    print('🔵 [Flutter] Sending message: $message');
  }
  // enviar...
}
```

---

## 📚 Recursos Adicionais

### Links Úteis

- [WebView Flutter Package](https://pub.dev/packages/webview_flutter)
- [JavaScript Channels Documentation](https://pub.dev/documentation/webview_flutter/latest/webview_flutter/WebViewController/addJavaScriptChannel.html)
- [Leaflet.js Documentation](https://leafletjs.com/)
- [Angular Architecture Guide](https://angular.dev/guide/architecture)

### Exemplos Completos

- Ver `libs/map/ui/src/lib/planting-area-selector/` para exemplo de componente web
- Ver `libs/map/feature-viewer/` para exemplo de visualização de mapas

---

## 📝 Contribuindo

### Adicionando Novas Funcionalidades

1. **Definir o contrato de mensagem** no README
2. **Implementar no Angular** (`MobileBridgeService`)
3. **Implementar no Flutter** (handler do canal JavaScript)
4. **Adicionar testes unitários** para ambos os lados
5. **Atualizar documentação** com exemplos

### Executar Testes

```bash
# Testar a biblioteca
npx nx test map-util

# Lint
npx nx lint map-util
```

---

## 📄 Licença

Este projeto é parte do ecossistema @fiap-hackaton.
