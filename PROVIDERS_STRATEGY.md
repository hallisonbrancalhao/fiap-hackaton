# 🔌 Estratégia de Providers - Route-Level Injection

## 🎯 Objetivo

Configurar os providers do Firebase (Firestore, Auth) em **route-level** ao invés de **application-level**, garantindo que as mesmas instâncias sejam compartilhadas entre todas as rotas filhas.

---

## 📍 Por Que Route-Level Providers?

### ❌ Application-Level (app.config.ts)
```typescript
// Problema: Providers globais no app.config
export const appConfig: ApplicationConfig = {
  providers: [
    provideFirebaseApp(...),
    provideAuth(...),
    provideFirestore(...),
  ]
};
```

**Desvantagens:**
- Todos os providers ficam no contexto da aplicação
- Menos flexibilidade para testes
- Dificulta isolamento de contextos

### ✅ Route-Level (app.routes.ts)
```typescript
// Solução: Providers no nível de rota
export const appRoutes: Route[] = [
  {
    path: '',
    providers: shellProviders, // ← Providers compartilhados entre filhos
    children: [
      // auth routes
      // protected routes
    ]
  }
];
```

**Vantagens:**
- ✅ **Escopo controlado**: Providers disponíveis apenas nas rotas que precisam
- ✅ **Compartilhamento garantido**: Mesmas instâncias entre rotas filhas
- ✅ **Melhor para testes**: Fácil substituir providers por mocks
- ✅ **Organização**: Configuração centralizada no shell
- ✅ **Lazy loading friendly**: Providers carregados apenas quando necessário

---

## 🏗️ Arquitetura Implementada

### 1. **shellProviders** (libs/dashboard/shell/config)

```typescript
// libs/dashboard/shell/src/lib/config/shell.providers.ts
import { EnvironmentProviders } from '@angular/core';
import { provideFirebaseApp, initializeApp } from '@angular/fire/app';
import { provideFirestore, getFirestore } from '@angular/fire/firestore';
import { provideAuth, getAuth } from '@angular/fire/auth';
import { firebaseConfig } from '@fiap-hackaton/shared-environments';

export const shellProviders: EnvironmentProviders[] = [
  provideFirebaseApp(() => initializeApp(firebaseConfig)),
  provideAuth(() => getAuth()),
  provideFirestore(() => getFirestore()),
];
```

**Responsabilidades:**
- Configuração centralizada do Firebase
- Exportação para uso nas rotas
- Documentação sobre singletons

---

### 2. **app.routes.ts** (apps/shell)

```typescript
// apps/shell/src/app/app.routes.ts
import { Route } from '@angular/router';
import { authGuard, shellProviders } from '@fiap-farm/dashboard-shell';

export const appRoutes: Route[] = [
  {
    path: '',
    providers: shellProviders, // ← Injetado aqui!
    children: [
      { path: '', redirectTo: 'auth/login', pathMatch: 'full' },
      
      // Rotas públicas (sem layout)
      { path: 'auth/login', loadComponent: ... },
      { path: 'auth/register', loadComponent: ... },
      
      // Rotas protegidas (com layout e guard)
      {
        path: '',
        canActivate: [authGuard],
        loadComponent: () => import('./layout/layout.component').then(...),
        children: [
          { path: 'dashboard', loadChildren: ... },
          { path: 'map', loadChildren: ... },
        ]
      }
    ]
  }
];
```

**Fluxo de Providers:**
```
Route parent (path: '')
  └─> providers: shellProviders
      ├─> auth/login (herda providers)
      ├─> auth/register (herda providers)
      └─> '' (layout + guard)
          ├─> dashboard (herda providers)
          └─> map (herda providers)
```

---

### 3. **app.config.ts** (apps/shell)

```typescript
// apps/shell/src/app/app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideAnimations(),
    provideRouter(appRoutes), // ← Rotas com providers inclusos
    providePrimeNG({ theme: FarmTheme, ripple: true }),
    // ⚠️ Firebase NÃO está aqui!
  ],
};
```

**Nota importante:**
- Firebase providers estão nas **rotas**, não no **app.config**
- `app.config` contém apenas providers globais essenciais

---

## 🔄 Fluxo de Injeção

### Inicialização da Aplicação

```
1. main.ts
   └─> bootstrapApplication(AppComponent, appConfig)

2. app.config.ts
   └─> provideRouter(appRoutes)

3. app.routes.ts
   └─> Route parent com providers: shellProviders
       ├─> Firebase inicializado
       └─> Instâncias disponíveis para todas as rotas filhas

4. Qualquer rota filha
   └─> inject(Firestore) // ← Mesma instância
   └─> inject(Auth)      // ← Mesma instância
```

### Facades e Repositories

```typescript
// Todos os facades/repositories usam providedIn: 'root'
@Injectable({ providedIn: 'root' })
export class AuthLoginFacade {
  private firestore = inject(Firestore); // ← Injetado da rota parent
  // ...
}

@Injectable({ providedIn: 'root' })
export class ProductRepository extends BaseRepository<Product> {
  protected firestore = inject(Firestore); // ← Mesma instância
  // ...
}
```

**Resultado:**
- ✅ `Firestore`: **1 única instância** compartilhada
- ✅ `Auth`: **1 única instância** compartilhada
- ✅ `AuthLoginFacade`: **1 única instância** (providedIn: 'root')
- ✅ `ProductRepository`: **1 única instância** (providedIn: 'root')

---

## 🧪 Benefícios para Testes

### Substituir Providers em Testes

```typescript
describe('DashboardComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        // ✅ Fácil substituir providers de rota
        { provide: Firestore, useValue: mockFirestore },
        { provide: Auth, useValue: mockAuth },
      ]
    }).compileComponents();
  });
});
```

### Testar Rotas Isoladamente

```typescript
describe('Auth Routes', () => {
  it('should provide Firebase in auth routes', async () => {
    const router = TestBed.inject(Router);
    
    // ✅ Providers disponíveis apenas no contexto da rota
    await router.navigate(['/auth/login']);
    const firestore = TestBed.inject(Firestore);
    
    expect(firestore).toBeDefined();
  });
});
```

---

## 📊 Comparação: Antes vs Depois

### ANTES (Application-Level)

```
app.config.ts
  ├─> provideFirebaseApp()
  ├─> provideAuth()
  └─> provideFirestore()
      └─> Disponível GLOBALMENTE

app.routes.ts
  └─> Rotas sem providers
```

**Problemas:**
- Firebase sempre carregado (mesmo se não usar)
- Difícil isolar para testes
- Configuração espalhada

### DEPOIS (Route-Level)

```
app.config.ts
  └─> providePrimeNG, provideRouter...
      (sem Firebase)

app.routes.ts
  └─> Route parent
      └─> providers: shellProviders
          ├─> provideFirebaseApp()
          ├─> provideAuth()
          └─> provideFirestore()
              └─> Disponível para ROTAS FILHAS

shellProviders (libs/dashboard/shell)
  └─> Configuração centralizada
```

**Vantagens:**
- ✅ Firebase carregado apenas nas rotas que usam
- ✅ Fácil substituir em testes
- ✅ Configuração centralizada no shell
- ✅ Organização clara

---

## 🎯 Regras e Convenções

### 1. **Onde Colocar Providers**

| Tipo de Provider | Localização | Motivo |
|-----------------|-------------|---------|
| Firebase (Firestore, Auth) | `shellProviders` (route-level) | Compartilhar entre rotas, fácil testar |
| Facades/Repositories | `providedIn: 'root'` | Singletons globais, lazy-loaded |
| UI (PrimeNG, Animations) | `app.config.ts` | Necessário globalmente |
| Feature-specific | Route-level da feature | Escopo limitado |

### 2. **Como Adicionar Novos Providers**

#### Providers Globais Firebase
```typescript
// libs/dashboard/shell/src/lib/config/shell.providers.ts
export const shellProviders: EnvironmentProviders[] = [
  provideFirebaseApp(...),
  provideAuth(...),
  provideFirestore(...),
  provideStorage(...), // ← Novo provider
];
```

#### Providers de Feature
```typescript
// libs/dashboard/feature-analytics/src/analytics.routes.ts
export const analyticsRoutes: Routes = [
  {
    path: '',
    providers: [AnalyticsService], // ← Provider local
    loadComponent: () => import('./analytics.component').then(...)
  }
];
```

### 3. **Singleton vs Scoped**

```typescript
// ✅ Singleton (compartilhado globalmente)
@Injectable({ providedIn: 'root' })
export class AuthLoginFacade { }

// ✅ Scoped (nova instância por contexto)
@Injectable() // sem providedIn
export class AnalyticsService { }
// Depois provido em route-level ou component-level
```

---

## 🚨 Troubleshooting

### Problema: "NullInjectorError: No provider for Firestore"

**Causa:** Rota não herda providers do parent

**Solução:**
```typescript
// Certifique-se que a rota é FILHA do parent com providers
export const appRoutes: Route[] = [
  {
    path: '',
    providers: shellProviders, // ← Parent
    children: [
      { path: 'dashboard', ... } // ← Herda providers
    ]
  }
];
```

### Problema: "Multiple instances of Firestore"

**Causa:** Providers duplicados em múltiplos níveis

**Solução:**
- Providers do Firebase **apenas** em um lugar: `shellProviders`
- Facades/Repositories **sempre** `providedIn: 'root'`

---

## 📝 Checklist de Implementação

- ✅ `shellProviders` criado em `libs/dashboard/shell/config`
- ✅ Firebase providers movidos para `shellProviders`
- ✅ `shellProviders` exportado no `index.ts` do shell
- ✅ `shellProviders` aplicado no parent route em `app.routes.ts`
- ✅ `app.config.ts` removido Firebase providers
- ✅ Facades/Repositories usando `providedIn: 'root'`
- ✅ Build passando
- ✅ Lint passando
- ✅ Testes passando

---

## 🎓 Referências

- [Angular Route Providers](https://angular.dev/guide/routing#route-level-providers)
- [Angular Dependency Injection](https://angular.dev/guide/di)
- [Firebase Angular Setup](https://github.com/angular/angularfire)
- [Environment Providers](https://angular.dev/api/core/EnvironmentProviders)
