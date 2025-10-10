# Project Overview

Este é um monorepo Nx que gerencia múltiplas aplicações usando **Module Federation** para micro-frontends, construído principalmente com Angular e TypeScript.

## Main Technologies and Tools:

- **Monorepo:** Nx 21.5.3
- **Main Framework:** Angular 20.2.0
- **Language:** TypeScript 5.9.2
- **Architecture:** Module Federation (Micro-frontends)
- **Styling:** TailwindCSS 4.1.13
- **Testing:** Jest
- **Code Quality:** ESLint, Prettier, Husky
- **Build Tool:** Webpack with Module Federation
- **Package Manager:** npm

## Architecture Overview

Este projeto implementa uma **arquitetura de micro-frontends** usando Module Federation:

- **`shell`** (Host - Porta 4200): Aplicação principal que orquestra os micro-frontends
- **`map`** (Remote - Porta 4201): Micro-frontend que expõe rotas relacionadas a mapas

### Module Federation Setup
- O `shell` consome remotamente o `map` através da configuração `remotes: ['map']`
- O `map` expõe suas rotas via `'./Routes': 'apps/map/src/app/remote-entry/entry.routes.ts'`

### Dependencies Rules:
Shell-type libraries can only depend on feature, data-access, ui, or util libraries
Feature-type libraries can only depend on data-access, ui, or util libraries
Data-access-type libraries can only depend on domain or util libraries
Domain-type libraries can only depend on api or util libraries
UI-type libraries can only depend on ui or util libraries
Util-type libraries can only depend on util libraries
API-type libraries can only depend on libraries within their own scope

## State Management and Component Architecture

All component logic and state management **must** be handled through the **Facade Pattern**. Components should be "dumb" (presentational) and only consume and display data from facades.

### Rules:
- **Facades** are responsible for:
  - Managing component state
  - Handling business logic
  - Orchestrating API calls via data-access services
  - Exposing observables/signals for components to consume

- **Components** must:
  - Be presentational only (dumb/stateless)
  - Subscribe to facade observables/signals
  - Emit user actions back to the facade
  - Contain minimal to no business logic
  - Focus solely on template rendering and user interaction

## Commands and Scripts

### Development
-   `npm install`: Instala as dependências
-   `npm start`: Inicia o shell com dev-remotes (mapa) em modo de desenvolvimento
-   `nx serve shell --devRemotes=map`: Comando equivalente ao npm start
-   `nx serve map`: Inicia apenas o micro-frontend map (porta 4201)

### Build e Deploy
-   `npm run build`: Constrói a aplicação shell para produção
-   `nx build map`: Constrói o micro-frontend map
-   `nx run-many --target=build --all`: Constrói todos os projetos

### Code Quality
-   `npm run lint`: Executa linting em todos os projetos
-   `npm run lint:fix`: Corrige automaticamente erros de lint
-   `npm run format`: Formata o código usando Nx formatter
-   `npm run prettier`: Verifica formatação com Prettier
-   `npm run prettier:fix`: Corrige formatação automaticamente

### Testing
-   `npm test`: Executa testes em todos os projetos
-   `nx test shell`: Testa apenas a aplicação shell
-   `nx test map`: Testa apenas o micro-frontend map

## Repository Structure:

```
fiap-hackaton/
├── apps/
│   ├── shell/                    # Aplicação host (Module Federation)
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── app.component.*
│   │   │   │   ├── app.config.ts
│   │   │   │   └── app.routes.ts
│   │   │   ├── main.ts
│   │   │   └── index.html
│   │   ├── module-federation.config.ts
│   │   └── project.json
│   └── map/                      # Micro-frontend remoto
│       ├── src/
│       │   ├── app/
│       │   │   └── remote-entry/
│       │   │       ├── entry.routes.ts
│       │   │       ├── entry.ts
│       │   │       └── nx-welcome.ts
│       │   ├── main.ts
│       │   └── index.html
│       ├── module-federation.config.ts
│       └── project.json
├── eslint.config.mjs             # Configuração ESLint workspace
├── jest.config.ts                # Configuração Jest workspace
├── nx.json                       # Configuração principal do Nx
├── package.json                  # Dependências e scripts
└── tsconfig.base.json           # Configuração TypeScript base
```

### Características da Estrutura:
- **`apps/shell/`**: Aplicação principal que hospeda os micro-frontends
- **`apps/map/`**: Micro-frontend independente que pode ser desenvolvido/deployado separadamente
- Cada aplicação possui suas próprias configurações de build, test e lint
- Module Federation permite carregamento dinâmico dos micro-frontends


## Testing

### Jest Configuration

- **Unit tests** implementados com Jest usando `jest-preset-angular`
- Testes colocalizados com arquivos fonte usando sufixo `.spec.ts`
- Configuração por projeto em `jest.config.ts` individual

### Available Test Commands:

- `nx test shell`: Executa testes da aplicação shell
- `nx test map`: Executa testes do micro-frontend map
- `npm run test`: Executa testes de todos os projetos
- `nx run-many --target=test --all`: Comando equivalente para todos os testes

### Test Configuration:
- **Preset**: `jest-preset-angular ~14.6.1`
- **Environment**: `jsdom` para testes de componentes Angular
- **Coverage**: Disponível via configuração CI
- **PassWithNoTests**: Habilitado para permitir projetos sem testes

### Jest Files Structure:
```
apps/shell/
├── jest.config.ts           # Config específica do shell
├── tsconfig.spec.json       # TypeScript config para testes
└── src/test-setup.ts       # Setup inicial dos testes

apps/map/
├── jest.config.ts           # Config específica do map
├── tsconfig.spec.json       # TypeScript config para testes
└── src/test-setup.ts       # Setup inicial dos testes
```

## Development Workflow

### Module Federation Development
1. **Start Development**: `npm start` - Inicia shell + map em modo dev
2. **Individual Development**: 
   - `nx serve shell` - Apenas o host
   - `nx serve map` - Apenas o remote
3. **Hot Reload**: Ambas as aplicações suportam hot reload independentemente

### Port Configuration
- **Shell (Host)**: http://localhost:4200
- **Map (Remote)**: http://localhost:4201

### Build Process
- **Development**: Usa webpack dev server com hot reload
- **Production**: Webpack com otimizações (hash, minification, etc.)
- **Module Federation**: Bundles são gerados para permitir carregamento dinâmico

## Conventions

O projeto segue convenções rigorosas de qualidade de código:

- **Husky:** Executa Git hooks (e.g., `pre-commit`)
- **ESLint:** Análise estática de código com configuração typescript-eslint
- **Prettier:** Formatação consistente de código
- **Angular ESLint:** Regras específicas para Angular

### Configuration Files:
- `eslint.config.mjs`: Configuração ESLint workspace
- `apps/*/eslint.config.mjs`: Configurações específicas por app
- `tsconfig.base.json`: Configuração TypeScript compartilhada

### Code Quality Commands:
- `nx run-many --target=lint --all`: Linting completo
- `nx run-many --target=lint --all --fix`: Auto-fix de problemas
- `nx format:write`: Formatação usando Nx formatter
- `nx format:check`: Verificação de formatação

### Nx Cloud Integration
- **ID**: `68d352726901683710f4c7f7`
- Cache distribuído para builds e testes
- Paralelização de tarefas habilitada

## Dependencies Overview

### Core Framework
- **@angular/core**: ~20.2.0 (Framework principal)
- **@angular/router**: ~20.2.0 (Roteamento)
- **@angular/common**: ~20.2.0 (Utilitários comuns)
- **rxjs**: ~7.8.0 (Programação reativa)

### Nx & Module Federation
- **nx**: 21.5.3 (Monorepo tooling)
- **@nx/angular**: ^21.5.3 (Plugin Angular para Nx)
- **@nx/module-federation**: 21.5.3 (Module Federation support)
- **@module-federation/enhanced**: ^0.18.0 (Enhanced Module Federation)

### Development Tools
- **typescript**: ~5.9.2
- **eslint**: ^9.8.0 + **typescript-eslint**: ^8.40.0
- **jest**: ^29.7.0 + **jest-preset-angular**: ~14.6.1
- **husky**: ^9.1.7 (Git hooks)
- **prettier**: ^2.6.2 (Code formatting)

### Styling
- **tailwindcss**: ^4.1.13 (Utility-first CSS framework)
- **postcss**: ^8.4.5 (CSS processing)

## Quick Start

```bash
# Instalar dependências
npm install

# Desenvolver com hot reload (shell + map)
npm start

# Construir para produção
npm run build

# Executar testes
npm test

# Executar linting
npm run lint
```
