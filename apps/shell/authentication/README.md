# FIAP Farms - Microfrontend de Autenticação

Este projeto implementa o microfrontend de autenticação para o sistema FIAP Farms, seguindo os princípios da Clean Architecture e programação funcional.

## 🏗️ Arquitetura

O projeto segue a **Clean Architecture** com as seguintes camadas:

```
src/
├── domain/                 # Camada de Domínio (regras de negócio)
│   ├── entities/          # Entidades (User, AuthState)
│   ├── repositories/      # Interfaces dos repositórios
│   └── usecases/         # Casos de uso (Login, Register, Logout)
├── data/                  # Camada de Dados
│   ├── repositories/     # Implementações dos repositórios (Firebase)
│   └── services/         # Serviços externos (Firebase Config)
├── presentation/          # Camada de Apresentação
│   ├── views/           # Componentes de UI (Login, Register, Dashboard)
│   ├── components/      # Componentes reutilizáveis
│   ├── hooks/           # Hooks customizados (useAuth)
│   └── store/           # Redux store e slices
└── shared/              # Tipos e utilitários compartilhados
    └── types/           # Tipos TypeScript
```

## 🚀 Tecnologias Utilizadas

- **React 19** - Framework de UI
- **TypeScript** - Tipagem estática
- **Redux Toolkit** - Gerenciamento de estado global
- **Firebase Authentication** - Autenticação
- **React Router** - Roteamento
- **Tailwind CSS** - Estilização
- **Vite** - Build tool

## 📦 Instalação

```bash
# Instalar dependências
pnpm install

# Executar em modo desenvolvimento
pnpm dev

# Build para produção
pnpm build
```

## 🔧 Configuração do Firebase

1. Crie um projeto no [Firebase Console](https://console.firebase.google.com/)
2. Ative o Authentication com Email/Password
3. Copie as configurações do projeto
4. Atualize o arquivo `src/data/services/firebaseConfig.ts`:

```typescript
const firebaseConfig = {
  apiKey: "sua-api-key-aqui",
  authDomain: "seu-projeto.firebaseapp.com",
  projectId: "seu-projeto-id",
  storageBucket: "seu-projeto.appspot.com",
  messagingSenderId: "123456789",
  appId: "seu-app-id"
};
```

## 🎯 Funcionalidades

### ✅ Implementadas

- **Autenticação completa** (Login, Registro, Logout)
- **Validação de formulários** com regras de negócio
- **Gerenciamento de estado** com Redux
- **Roteamento protegido** com React Router
- **Interface responsiva** com Tailwind CSS
- **Tratamento de erros** amigável ao usuário
- **Arquitetura limpa** e testável

### 🔄 Fluxo de Autenticação

1. **Login/Registro** → Validação → Firebase Auth → Redux Store
2. **Proteção de rotas** → Verificação de autenticação → Redirecionamento
3. **Estado global** → Sincronização entre componentes

## 🧪 Programação Funcional

O projeto utiliza programação funcional com:

- **Funções puras** nos casos de uso
- **Imutabilidade** nas entidades
- **Composição** de funções
- **Injeção de dependências** funcional

### Exemplo de Caso de Uso:

```typescript
export const executeLogin = async (
  dependencies: LoginUseCaseDependencies,
  credentials: LoginCredentials
): Promise<AuthResult<User>> => {
  // Função pura que recebe dependências como parâmetros
  const validationResult = validateLoginCredentials(credentials);
  if (!validationResult.isValid) {
    return { success: false, error: validationResult.error };
  }
  
  return await dependencies.authRepository.login(credentials);
};
```

## 🔐 Segurança

- **Validação de entrada** em todas as camadas
- **Sanitização** de dados do usuário
- **Tratamento seguro** de erros
- **Proteção de rotas** no frontend
- **Integração segura** com Firebase

## 📱 Responsividade

O sistema é totalmente responsivo e funciona em:
- **Desktop** (1024px+)
- **Tablet** (768px - 1023px)
- **Mobile** (até 767px)

## 🚀 Deploy

Para fazer deploy:

```bash
# Build de produção
pnpm build

# Os arquivos estarão na pasta dist/
```

## 🤝 Contribuição

1. Siga os princípios da Clean Architecture
2. Use programação funcional
3. Mantenha a tipagem TypeScript
4. Teste as funcionalidades
5. Documente o código

## 🎯 Resumo da Implementação

### ✅ O que foi implementado:

1. **Clean Architecture completa** com separação clara de responsabilidades
2. **Programação funcional** em todos os casos de uso
3. **Redux para gerenciamento de estado** global
4. **Firebase Authentication** integrado
5. **Roteamento protegido** com React Router
6. **Interface responsiva** com Tailwind CSS
7. **Validação robusta** de formulários
8. **Tratamento de erros** amigável
9. **Tipagem TypeScript** completa
10. **Documentação detalhada**

### 🏗️ Arquitetura Implementada:

```
┌─────────────────────────────────────────────────────────────┐
│                    PRESENTATION LAYER                      │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐  │
│  │    Views    │ │ Components  │ │        Hooks        │  │
│  │ Login/Reg   │ │ProtectedRoute│ │      useAuth        │  │
│  │ Dashboard   │ │             │ │                     │  │
│  └─────────────┘ └─────────────┘ └─────────────────────┘  │
│  ┌─────────────────────────────────────────────────────┐   │
│  │              Redux Store (Global State)            │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                     DOMAIN LAYER                           │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────┐    │
│  │  Entities  │ │Repositories│ │     Use Cases       │    │
│  │User/AuthState│ │Interfaces │ │Login/Register/Logout│    │
│  └─────────────┘ └─────────────┘ └─────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────┐
│                      DATA LAYER                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Firebase Authentication                   │   │
│  │         (External Service)                         │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 🔄 Fluxo de Dados:

1. **User Action** → View Component
2. **View** → useAuth Hook
3. **Hook** → Redux Action
4. **Redux** → Use Case
5. **Use Case** → Repository
6. **Repository** → Firebase
7. **Firebase** → Repository
8. **Repository** → Use Case
9. **Use Case** → Redux
10. **Redux** → View Update

## 📋 Próximos Passos

- [ ] Integração com outros microfrontends
- [ ] Testes unitários e de integração
- [ ] CI/CD pipeline
- [ ] Monitoramento e logs
- [ ] Internacionalização (i18n)

## 📄 Licença

Este projeto faz parte do Tech Challenge FIAP Farms.