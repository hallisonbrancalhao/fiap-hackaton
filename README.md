# 🌾 Farm Manager - Sistema de Gestão para Fazendas

[![Angular](https://img.shields.io/badge/Angular-20.2.0-red)](https://angular.dev)
[![Nx](https://img.shields.io/badge/Nx-21.5.3-blue)](https://nx.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9.2-blue)](https://www.typescriptlang.org/)
[![PrimeNG](https://img.shields.io/badge/PrimeNG-20.2.0-orange)](https://primeng.org/)

Sistema completo de gestão para fazendas construído com **Angular 20**, **Nx Monorepo**, **Firebase/Firestore**, **PrimeNG** e **TailwindCSS**.

---

## ✨ Features

### 🔐 Autenticação
- ✅ Login com email e senha
- ✅ Registro de usuário e fazenda
- ✅ Validações completas
- ✅ Dark mode support

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
│   │   ├── domain/         # Models (Product, Sale, etc)
│   │   ├── data-access/    # Facades e Repositories
│   │   ├── feature-products/  # Products CRUD
│   │   ├── feature-sales/     # Sales management
│   │   └── feature-analytics/ # Analytics dashboard
│   │
│   └── shared/
│       ├── ui/             # Componentes reutilizáveis
│       └── environments/   # Firebase config
```

---

## 🗺️ Rotas

```
/                       → Redirect to /auth/login
/auth/login            → Login page
/auth/register         → Register page
/dashboard             → Dashboard home
/dashboard/products    → Products management
/dashboard/sales       → Sales tracking
/dashboard/analytics   → Analytics & Reports
```

---

## 🛠️ Tech Stack

- **Angular 20** - Framework
- **Nx 21** - Monorepo tooling
- **TypeScript 5.9** - Language
- **Firebase** - Backend & Database
- **PrimeNG 20** - UI Components
- **TailwindCSS 3** - Styling
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
nx test feature-login   # Test specific project
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
- ✅ **Lazy Loading** - Route-based code splitting
- ✅ **Standalone Components** - Modern Angular
- ✅ **Signals** - Reactive state management

### Camadas
1. **Domain** - Models e interfaces
2. **Infrastructure** - Repositories (Firestore access)
3. **Application** - Facades (Business logic)
4. **Feature** - Components (UI)

---

## 📚 Documentação

- 📖 [IMPLEMENTATION_COMPLETE.md](./IMPLEMENTATION_COMPLETE.md) - Documentação completa
- 🔥 [FIREBASE_SETUP.md](./FIREBASE_SETUP.md) - Setup do Firebase
- 📊 [PROJECT_SUMMARY.md](./PROJECT_SUMMARY.md) - Resumo arquitetural
- 🧪 [CLAUDE.md](./CLAUDE.md) - Guidelines de código e testes

---

## ✅ Status do Projeto

- ✅ Autenticação (Login + Register)
- ✅ CRUD de Produtos
- ✅ Gestão de Vendas
- ✅ Dashboard de Analytics
- ✅ Rotas configuradas
- ✅ Firebase integrado
- ✅ UI responsiva com dark mode
- ✅ 100% Lint passing
- ✅ Documentação completa

---

## 🎯 Próximos Passos

1. **Configurar Firebase** - Criar projeto e habilitar Firestore
2. **Auth Guard** - Proteger rotas do dashboard
3. **Forms de CRUD** - Adicionar/editar produtos e vendas
4. **Production Tracking** - Feature de produção/cultivo
5. **Goals Management** - Definir e acompanhar metas

---

## 🤝 Contribuindo

Este projeto segue o [Conventional Commits](https://www.conventionalcommits.org/).

Ver [GIT_COMMIT_INSTRUCTIONS.md](./GIT_COMMIT_INSTRUCTIONS.md) para guidelines.

---

## 📄 Licença

MIT

---

**Desenvolvido com** ❤️ **usando Angular 20, Nx, Firebase, PrimeNG e TailwindCSS**
