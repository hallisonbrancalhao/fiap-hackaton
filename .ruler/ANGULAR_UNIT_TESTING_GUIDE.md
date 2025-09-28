# Guidelines de Testes Angular - Guia Completo

## 🎯 Princípios Fundamentais

### Regra de Ouro: Nunca usar componentInstance diretamente

Testar através do DOM e efeitos colaterais garante testes menos frágeis e mais realistas.

- **Para inputs**: use `componentRef.setInput`
- **Para outputs**: use `triggerEventHandler`
- **Para propriedades Angular/HTML**: use `debugElement.properties` e `debugElement.attributes`
- **Métodos e propriedades**: devem ser `protected` ou `private`, exceto quando fazem parte de interfaces Angular ou são usados via ViewChild

**✅ Bom**: Verificar que um método protected alterou o HTML, disparou um output ou impactou um serviço  
**❌ Ruim**: Chamar o método diretamente no teste - mudanças internas quebrariam o teste sem impactar o comportamento real

## 1. Sempre Mockar Todas as Dependências

**Regra**: Nunca use componentes, serviços ou pipes reais em testes unitários. Sempre crie mocks para todas as dependências.

**Por quê?**: Isso garante isolamento completo, testes mais rápidos e evita efeitos colaterais de outras partes do sistema.

### ❌ Incorreto - Usando dependências reais

```typescript
describe('UserListComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [UserListComponent, UserCardComponent], // ❌ Componente real
      imports: [HttpClientModule], // ❌ Módulo real
      providers: [UserService] // ❌ Serviço real
    }).compileComponents();
  });
});
```

### ✅ Correto - Mockando todas as dependências

```typescript
describe('UserListComponent', () => {
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(async () => {
    mockUserService = {
      getUsers: jest.fn(),
      deleteUser: jest.fn()
    } as jest.Mocked<UserService>;

    await TestBed.configureTestingModule({
      declarations: [UserListComponent],
      schemas: [NO_ERRORS_SCHEMA], // Para elementos filhos
      providers: [
        { provide: UserService, useValue: mockUserService }
      ]
    }).compileComponents();
  });
});
```

## 2. Usar Schemas para Elementos Customizados

**Regra**: Sempre inclua `NO_ERRORS_SCHEMA` e `CUSTOM_ELEMENTS_SCHEMA` para prevenir erros de elementos não reconhecidos.

**Por quê?**: Evita que o teste falhe devido a elementos HTML que não foram declarados (PrimeNG, libs, componentes customizados), mantendo o foco no componente sendo testado.

### ✅ Exemplo correto

```typescript
describe('ParentComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ParentComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA], // ✅ Previne erros de elementos customizados
      providers: [/* mocks */]
    }).compileComponents();
  });
});
```

### Sem schemas você teria erros como:

```
'app-child-component' is not a known element
'mat-button' is not a known element
'p-multiSelect' is not a known element
```

## 3. Preferir data-testid e debugElement

**Regra**: Use sempre `data-testid` para selecionar elementos e `fixture.debugElement.query()` ao invés de `querySelector`.

**Por quê?**:

- `data-testid` é específico para testes e mais estável que classes CSS
- `debugElement` oferece APIs nativas do Angular para testes mais robustos

### ❌ Incorreto - Usando classes CSS e querySelector

```typescript
it('should display user name', () => {
  const element = fixture.nativeElement.querySelector('.user-name'); // ❌ Frágil
  const button = fixture.nativeElement.querySelector('.btn-primary'); // ❌ Pode mudar
  expect(element.textContent).toBe('João');
});
```

### ✅ Correto - Usando data-testid e debugElement

```typescript
// Template
// <h2 data-testid="user-name">{{user.name}}</h2>
// <button data-testid="save-button">Save</button>

it('should display user name', () => {
  const element = fixture.debugElement.query(By.css('[data-testid="user-name"]')); // ✅ Estável
  const button = fixture.debugElement.query(By.css('[data-testid="save-button"]')); // ✅ Semântico
  expect(element.nativeElement.textContent.trim()).toBe('João');
});
```

### Diferença entre Properties e Attributes

#### Propriedades Angular `[property]` → debugElement.properties

```typescript
// Template: <p-multiSelect [options]="items" [showClear]="true">
const multiSelect = fixture.debugElement.query(By.css('[data-testid="multi-select"]'));
expect(multiSelect.properties['options']).toEqual(mockOptions); // ✅ Propriedade Angular
expect(multiSelect.properties['showClear']).toBe(true);
```

#### Atributos HTML `attribute` → debugElement.attributes

```typescript
// Template: <p-multiSelect optionLabel="name" data-testid="multi-select">
const multiSelect = fixture.debugElement.query(By.css('[data-testid="multi-select"]'));
expect(multiSelect.attributes['optionLabel']).toBe('name'); // ✅ Atributo HTML
expect(multiSelect.attributes['data-testid']).toBe('multi-select');
```

## 4. Override em Componentes Standalone

**Regra**: Para componentes standalone, sempre use `TestBed.overrideComponent()` para substituir imports ou providers.

**Por quê?**: Componentes standalone gerenciam suas próprias dependências dentro do decorator, então precisamos sobrescrever essas configurações para usar mocks.

### ✅ Exemplo com componente standalone

```typescript
@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule, MatButtonModule, TranslatePipe],
  providers: [UserService],
  template: '<button mat-button>{{ "SAVE" | translate }}</button>'
})
export class UserProfileComponent {}

describe('UserProfileComponent', () => {
  let mockUserService: jest.Mocked<UserService>;

  beforeEach(async () => {
    mockUserService = {
      updateUser: jest.fn()
    } as jest.Mocked<UserService>;

    await TestBed.configureTestingModule({
      imports: [UserProfileComponent] // ✅ Apenas importa o componente
    })
      .overrideComponent(UserProfileComponent, {
        set: {
          imports: [MockTranslatePipe], // ✅ Substitui imports reais por mocks
          providers: [
            { provide: UserService, useValue: mockUserService }
          ],
          schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]
        }
      })
      .compileComponents();
  });
});
```

## 5. Evitar Acessar componentInstance para Métodos/Propriedades Internas

**Regra**: Não acesse métodos ou propriedades internas via `componentInstance`. Teste apenas os efeitos colaterais observáveis.

**Por quê?**: Testes devem ser resilientes a refatorações internas. Se você renomear um método privado, o teste não deve quebrar.

### ❌ Incorreto - Testando implementação interna

```typescript
@Component({
  template: `
    <button data-testid="show-info-btn" (click)="displayUserInfo()">Show Info</button>
    <div data-testid="user-age">{{ userAge }}</div>
  `
})
class UserComponent {
  user = { name: 'João', birthDate: new Date('1990-01-01') };
  userAge: number = 0;

  private calculateAge(birthDate: Date): number { // Método interno
    return new Date().getFullYear() - birthDate.getFullYear();
  }

  protected displayUserInfo(): void { // Usado apenas no template
    const age = this.calculateAge(this.user.birthDate);
    this.userAge = age;
  }
}

// ❌ Teste frágil
it('should calculate age correctly', () => {
  const result = component.calculateAge(new Date('1990-01-01')); // ❌ Acesso interno
  expect(result).toBe(34);
});

// ❌ Teste frágil - chama método diretamente
it('should set user age when displaying info', () => {
  component.displayUserInfo(); // ❌ Chamada manual de método protegido
  expect(component.userAge).toBe(34);
});
```

### ✅ Correto - Testando efeitos observáveis

```typescript
// ✅ Teste resiliente - simula interação real do usuário
it('should display user age when show info button is clicked', () => {
  const button = fixture.debugElement.query(By.css('[data-testid="show-info-btn"]'));

  button.triggerEventHandler('click', null); // ✅ Simula clique real
  fixture.detectChanges();

  const ageElement = fixture.debugElement.query(By.css('[data-testid="user-age"]'));
  expect(ageElement.nativeElement.textContent.trim()).toBe('34'); // ✅ Efeito observável
});
```

## 6. Resetar Mocks no beforeEach

**Regra**: Declare mocks com `let` e sempre os recrie/resete no `beforeEach`. Evite criar mocks fora do `beforeEach`.

**Por quê?**: Previne vazamento de estado entre testes, garantindo que cada teste seja independente.

### ❌ Incorreto - Mock compartilhado

```typescript
describe('UserService', () => {
  // ❌ Mock criado uma vez, compartilhado entre testes
  const mockHttp = {
    get: jest.fn(),
    post: jest.fn()
  } as jest.Mocked<HttpClient>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [{ provide: HttpClient, useValue: mockHttp }]
    });
  });

  it('should call get', () => {
    mockHttp.get.mockReturnValue(of([]));
    // teste...
  });

  it('should call post', () => {
    // ❌ O spy do teste anterior ainda está ativo!
    // Pode causar comportamentos inesperados
  });
});
```

### ✅ Correto - Mock resetado a cada teste

```typescript
describe('UserService', () => {
  let mockHttp: jest.Mocked<HttpClient>; // ✅ Declaração com let
  let service: UserService;

  beforeEach(() => {
    // ✅ Mock recriado a cada teste
    mockHttp = {
      get: jest.fn(),
      post: jest.fn()
    } as jest.Mocked<HttpClient>;

    TestBed.configureTestingModule({
      providers: [
        UserService,
        { provide: HttpClient, useValue: mockHttp }
      ]
    });

    service = TestBed.inject(UserService);
  });

  it('should call get', () => {
    mockHttp.get.mockReturnValue(of([])); // ✅ Mock limpo
    service.getUsers().subscribe();
    expect(mockHttp.get).toHaveBeenCalled();
  });

  it('should call post', () => {
    mockHttp.post.mockReturnValue(of({})); // ✅ Mock limpo, sem interferência
    service.createUser({}).subscribe();
    expect(mockHttp.post).toHaveBeenCalled();
  });
});
```

## 7. Métodos de Ciclo de Vida

**Regra**: Embora métodos como `ngOnInit`, `ngOnChanges` e `ngOnDestroy` façam parte da interface pública, **não os chame manualmente**. Use as APIs do Angular que disparam esses hooks naturalmente.

**Por quê?**:

- O Angular já executa esses métodos automaticamente no momento certo
- Usar as APIs do Angular produz efeitos mais realistas
- Input signals só funcionam corretamente via `componentRef.setInput()`
- Evita falsos positivos que podem ocorrer com chamadas manuais

### ❌ Chamadas Manuais (desnecessário e contraproducente)

```typescript
it('should initialize data', () => {
  component.ngOnInit(); // ❌ Desnecessário - Angular já faz isso
  expect(component.data).toBeDefined();
});

it('should handle input changes', () => {
  component.userId = '123';
  component.ngOnChanges({
    // ❌ Manual e não realista
    userId: new SimpleChange(null, '123', true)
  });
  expect(component.userData).toBeDefined();
});

it('should cleanup on destroy', () => {
  component.ngOnDestroy(); // ❌ Não simula destruição real
  expect(component.subscription.closed).toBe(true);
});
```

### ✅ APIs do Angular (recomendado)

```typescript
@Component({
  template: `
    <div data-testid="user-data" *ngIf="userData">{{ userData.name }} - {{ userData.email }}</div>
    <div data-testid="loading" *ngIf="isLoading">Loading...</div>
  `
})
class UserComponent implements OnInit, OnChanges, OnDestroy {
  @Input() userId!: string;
  userData: any = null;
  isLoading = false;

  ngOnInit() {
    this.loadUserData();
  }

  ngOnChanges() {
    if (this.userId) {
      this.refreshUserData();
    }
  }

  ngOnDestroy() {
    this.cleanupSubscriptions();
  }
}

it('should display user data when component is created', () => {
  fixture.detectChanges(); // ✅ Dispara ngOnInit automaticamente

  const userElement = fixture.debugElement.query(By.css('[data-testid="user-data"]'));
  expect(userElement.nativeElement.textContent.trim()).toBe('João Silva - joao@email.com'); // ✅ Efeito observável no DOM
});

it('should refresh data when userId changes', () => {
  fixture.componentRef.setInput('userId', '123'); // ✅ Dispara ngOnChanges naturalmente
  fixture.detectChanges();

  const userElement = fixture.debugElement.query(By.css('[data-testid="user-data"]'));
  expect(userElement.nativeElement.textContent).toContain('Updated User Data'); // ✅ Verifica mudança no DOM
});

it('should cleanup subscriptions when component is destroyed', () => {
  fixture.detectChanges(); // Inicializa o componente

  const subscriptionSpy = jest.spyOn(mockSubscription, 'unsubscribe');
  fixture.componentRef.destroy(); // ✅ Dispara ngOnDestroy e simula destruição real

  expect(subscriptionSpy).toHaveBeenCalled(); // ✅ Verifica efeito observável da limpeza
});
```

### Exemplo com Input Signals

```typescript
// Componente moderno com signals
@Component({
  template: '<div data-testid="user-info">{{userData()}}</div>'
})
class UserComponent {
  userId = input<string>(); // Signal input

  userData = computed(() => {
    const id = this.userId();
    return id ? this.loadUserData(id) : null;
  });

  private loadUserData(id: string) {
    return `User ${id} data`;
  }
}

// ❌ Não funciona com signals
it('should update user data', () => {
  component.userId.set('123'); // ❌ Erro! Signals são readonly
});

// ✅ Funciona corretamente
it('should update user data when userId changes', () => {
  fixture.componentRef.setInput('userId', '123'); // ✅ Única forma de setar signal inputs
  fixture.detectChanges();

  const element = fixture.debugElement.query(By.css('[data-testid="user-info"]'));
  expect(element.nativeElement.textContent).toBe('User 123 data');
});
```

## 🔑 O que Normalmente Pode ser Testado

### Métodos de Serviços Externos

Sempre teste métodos que vêm de serviços externos, independentemente de terem sido usados no template ou não.

```typescript
it('should call user service on init', () => {
  fixture.detectChanges(); // Dispara ngOnInit
  expect(mockUserService.getUser).toHaveBeenCalledWith('123');
});
```

### Inputs via setInput

Testar valores diferentes, inclusive edge cases:

```typescript
it('should handle null input', () => {
  fixture.componentRef.setInput('userId', null);
  fixture.detectChanges();

  const element = fixture.debugElement.query(By.css('[data-testid="user-data"]'));
  expect(element).toBeNull(); // Não deve renderizar sem userId
});

it('should handle array input', () => {
  fixture.componentRef.setInput('items', ['item1', 'item2']);
  fixture.detectChanges();

  const items = fixture.debugElement.queryAll(By.css('[data-testid="item"]'));
  expect(items.length).toBe(2);
});
```

### Outputs via triggerEventHandler

Simular eventos do DOM ou de componentes filhos:

```typescript
it('should emit selection change', () => {
  const spy = jest.spyOn(component.selectionChange, 'emit');
  const multiSelect = fixture.debugElement.query(By.css('[data-testid="multi-select"]'));

  multiSelect.triggerEventHandler('onChange', { value: ['1', '2'] });

  expect(spy).toHaveBeenCalledWith(['1', '2']);
});
```

### ControlValueAccessor (quando implementado)

Testar métodos obrigatórios da interface:

```typescript
it('should write value correctly', () => {
  component.writeValue(['option1', 'option2']); // ✅ Interface pública Angular
  fixture.detectChanges();

  const selectedItems = fixture.debugElement.queryAll(By.css('[data-testid="selected-item"]'));
  expect(selectedItems.length).toBe(2);
});

it('should register change callback', () => {
  const changeFn = jest.fn();
  component.registerOnChange(changeFn); // ✅ Interface pública Angular

  // Simular mudança que deve disparar o callback
  const multiSelect = fixture.debugElement.query(By.css('[data-testid="multi-select"]'));
  multiSelect.triggerEventHandler('onChange', { value: ['new-value'] });

  expect(changeFn).toHaveBeenCalledWith(['new-value']);
});
```

### ViewChild

Testar se o ViewChild impacta o HTML como esperado:

```typescript
it('should focus input when button is clicked', () => {
  const button = fixture.debugElement.query(By.css('[data-testid="focus-btn"]'));
  const input = fixture.debugElement.query(By.css('[data-testid="input"]'));

  jest.spyOn(input.nativeElement, 'focus');
  button.triggerEventHandler('click', null);

  expect(input.nativeElement.focus).toHaveBeenCalled();
});
```

## 📊 Estrutura Sugerida dos Testes

### 1. Initialization → Criação básica + ngOnInit

```typescript
describe('Initialization', () => {
  it('should create component', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with default values', () => {
    fixture.detectChanges();

    const placeholder = fixture.debugElement.query(By.css('[data-testid="placeholder"]'));
    expect(placeholder.nativeElement.textContent).toBe('Select options...');
  });
});
```

### 2. Inputs → Diferentes cenários

```typescript
describe('Inputs', () => {
  it('should handle options input', () => {
    const mockOptions = [{ id: 1, name: 'Option 1' }];
    fixture.componentRef.setInput('options', mockOptions);
    fixture.detectChanges();

    const multiSelect = fixture.debugElement.query(By.css('[data-testid="multi-select"]'));
    expect(multiSelect.properties['options']).toEqual(mockOptions);
  });
});
```

### 3. Outputs → Eventos disparados

```typescript
describe('Outputs', () => {
  it('should emit change event', () => {
    const spy = jest.spyOn(component.valueChange, 'emit');
    // Trigger change...
    expect(spy).toHaveBeenCalled();
  });
});
```

### 4. Template Structure → Elementos obrigatórios

```typescript
describe('Template Structure', () => {
  it('should render required elements', () => {
    fixture.detectChanges();

    const multiSelect = fixture.debugElement.query(By.css('[data-testid="multi-select"]'));
    const label = fixture.debugElement.query(By.css('[data-testid="label"]'));

    expect(multiSelect).toBeTruthy();
    expect(label).toBeTruthy();
  });
});
```

### 5. Edge Cases → Estados inesperados

```typescript
describe('Edge Cases', () => {
  it('should handle empty options array', () => {
    fixture.componentRef.setInput('options', []);
    fixture.detectChanges();

    const noDataMessage = fixture.debugElement.query(By.css('[data-testid="no-data"]'));
    expect(noDataMessage).toBeTruthy();
  });
});
```

## Interface Pública vs Interface Privada

### Interface Pública do Componente

**Definição**: Métodos e propriedades que são usados por **outras entidades** no sistema. Estes são exceções válidas para uso do `componentInstance`.

### Exemplos de Interface Pública

#### ✅ Usado por ViewChild

```typescript
// ParentComponent
@ViewChild(ChildComponent) child!: ChildComponent;

someMethod() {
  this.child.publicMethod(); // ✅ Interface pública
}

// ChildComponent
public publicMethod() { // ✅ Usado por outro componente
  // lógica
}

// Teste válido
it('should call public method', () => {
	component.publicMethod(); // ✅ OK - é interface pública
});
```

#### ✅ ControlValueAccessor

```typescript
class CustomInputComponent implements ControlValueAccessor {
  writeValue(value: any) { // ✅ Interface pública (Angular)
    this.value = value;
  }

  registerOnChange(fn: any) { // ✅ Interface pública (Angular)
    this.onChange = fn;
  }

  // Teste válido
  it('should write value correctly', () => {
    component.writeValue('test'); // ✅ OK - interface ControlValueAccessor
    const element = fixture.debugElement.query(By.css('[data-testid="select-value"]'))

    expect(element.nativeElement.textContent.trim()).toBe('test'); // ✅ Verifica efeito no DOM
  });
}
```

### ❌ NÃO é Interface Pública

Mesmo sendo `public`, se não é usado por outra entidade, ainda é considerado interno:

```typescript
class UserComponent {
	public helperMethod() {
		// ❌ Público mas só usado internamente
		return this.formatData();
	}

	public onClick() {
		const result = this.helperMethod(); // ❌ Só usado internamente
		this.display(result);
	}

	private formatData() {}
}

// ❌ Teste incorreto
it('should format data', () => {
	const result = component.helperMethod(); // ❌ Mesmo sendo public, é interno
	expect(result).toBe('formatted');
});

// ✅ Teste correto
it('should display formatted data when clicked', () => {
	const button = fixture.debugElement.query(By.css('[data-testid="button"]'));
	button.triggerEventHandler('click', null); // ✅ Testa o efeito observável

	const display = fixture.debugElement.query(By.css('[data-testid="display"]'));
	expect(display.nativeElement.textContent).toBe('formatted data'); // ✅ Resultado observável
});
```

### Dica: Use protected/private Por Padrão

```typescript
// ✅ Boa prática
class UserComponent {
	private internalMethod() {} // ✅ Claramente interno
	protected helperMethod() {} // ✅ Interno mas extensível (usado no template)

	public apiMethod() {} // ✅ Você sabe que é público porque precisa ser
}
```

**Regra prática**: Se você consegue tornar um método `private` ou `protected`, faça isso. Quando não conseguir, você saberá que faz parte da interface pública e pode ser testado via `componentInstance`.

## 🏆 Vantagens da Abordagem debugElement

### Consistência

Todos os testes agora usam a mesma API Angular, criando um padrão consistente em toda a base de código.

### Funcionalidade Avançada

- Acesso a `properties` (propriedades Angular `[prop]`)
- Acesso a `attributes` (atributos HTML `attr`)
- `triggerEventHandler()` para simular eventos de forma nativa
- Melhor integração com componentes Angular

### Mais Robustos

Menos propensos a quebrar com mudanças no DOM, especialmente quando combinados com `data-testid`.

### Type Safety

Melhor suporte ao TypeScript e detecção de erros em tempo de compilação.

## 📋 Resumo das Regras

### ✅ Fazer Sempre

- Usar `overrideComponent` para standalone components
- Usar `schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA]`
- Inputs via `componentRef.setInput`
- Outputs via `triggerEventHandler`
- Usar `data-testid` para queries
- Recriar mocks no `beforeEach`
- Usar `debugElement.query()` e `debugElement.queryAll()`
- Propriedades Angular `[prop]` → `debugElement.properties`
- Atributos HTML `attr` → `debugElement.attributes`

### ❌ Evitar Sempre

- Usar `componentInstance` para métodos/propriedades internas
- Criar mocks fora do `beforeEach`
- Usar classes CSS ou IDs para selecionar elementos
- Chamar métodos de ciclo de vida manualmente
- Usar dependências reais nos testes

### 🧪 Estrutura de Testes Recomendada

1. **Initialization** → ngOnInit e estados iniciais
2. **Inputs** → Diferentes cenários com setInput
3. **Outputs** → Eventos via triggerEventHandler
4. **ControlValueAccessor** → Se implementado
5. **Template Structure** → Presença de elementos obrigatórios
6. **Edge Cases** → Valores nulos, arrays vazios, estados inesperados

Seguindo estas guidelines, você terá testes mais robustos, realistas e resilientes a mudanças na implementação interna dos componentes.

# 🧪 Testes de Serviços Angular

Testar serviços é crucial para garantir que a lógica de negócio, o acesso a dados e outras responsabilidades centrais da sua aplicação funcionem de maneira confiável e isolada. Este guia apresenta as melhores práticas com exemplos corretos e incorretos.

## 📋 Princípios Chave para Testes de Serviços

1. **Isolamento Total**: Mocke todas as dependências externas
2. **Use TestBed.inject()**: Para obter instâncias dos serviços
3. **Foque no Contrato Público**: Teste apenas métodos públicos
4. **Teste Comportamentos, não Implementação**: O que importa é o resultado

---

## 🌐 1. Serviços REST com HttpClient

### ✅ EXEMPLO CORRETO

```typescript
import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService } from './user.service';

describe('UserService (HttpClient) - CORRETO', () => {
 let service: UserService;
 let httpTestingController: HttpTestingController;
 const API_URL = '/api/users';

 beforeEach(() => {
	 TestBed.configureTestingModule({
		 imports: [HttpClientTestingModule],
		 providers: [UserService]
	});

	service = TestBed.inject(UserService);
	httpTestingController = TestBed.inject(HttpTestingController);
});
 
 afterEach(() => {
	 httpTestingController.verify();
 });
 
 it('should fetch users with correct GET request', () => {
	const mockUsers = [{ id: 1, name: 'Alice' }];

	// ✅ Chama o método e testa o resultado
	service.getUsers().subscribe(users => {
		expect(users).toEqual(mockUsers);
	});

	// ✅ Valida a requisição HTTP
	const req = httpTestingController.expectOne(API_URL);
	expect(req.request.method).toBe('GET');
	expect(req.request.headers.get('Content-Type')).toBe('application/json');

	req.flush(mockUsers);
});

it('should handle HTTP errors properly', () => {
	const errorMessage = 'Server error';

	service.getUsers().subscribe({
		next: () => fail('Should have failed'),
		error: (error) => {
			expect(error.status).toBe(500);
			expect(error.statusText).toBe('Server Error');
		}
	});

	const req = httpTestingController.expectOne(API_URL);
	req.flush(errorMessage, { status: 500, statusText: 'Server Error' });
});

it('should create user with correct POST payload', () => {
	const newUser = { name: 'Bob', email: 'bob@test.com' };
	const mockResponse = { id: 2, ...newUser };

	service.createUser(newUser).subscribe(response => {
		expect(response).toEqual(mockResponse);
	});

	const req = httpTestingController.expectOne(API_URL);
	expect(req.request.method).toBe('POST');
	expect(req.request.body).toEqual(newUser);

	req.flush(mockResponse);
});
});
```

### ❌ EXEMPLO INCORRETO

```typescript
describe('UserService (HttpClient) - INCORRETO', () => {
	let service: UserService;
	let httpClient: HttpClient;

	beforeEach(() => {
		// ❌ Não usa HttpClientTestingModule
		TestBed.configureTestingModule({
			imports: [HttpClientModule], // ❌ Módulo real, não de teste
			providers: [UserService]
		});

		// ❌ Injeta HttpClient real ao invés do mock
		service = TestBed.inject(UserService);
		httpClient = TestBed.inject(HttpClient);
	});

	it('should fetch users', () => {
		// ❌ Não verifica a requisição HTTP, apenas o resultado
		service.getUsers().subscribe(users => {
			expect(users).toBeDefined(); // ❌ Asserção muito vaga
		});

		// ❌ Sem validação da requisição HTTP
		// ❌ Sem simulação de resposta
	});

	it('should create user', () => {
		const newUser = { name: 'Bob' };

		// ❌ Spy no HttpClient ao invés de usar HttpTestingController
		jest.spyOn(httpClient, 'post').mockReturnValue(of({ id: 1 }));

		service.createUser(newUser).subscribe(response => {
			expect(response.id).toBe(1);
		});

		// ❌ Não valida URL, método HTTP ou payload
	});
});
```

---

## 🔗 2. Serviços GraphQL com Apollo

### ✅ EXEMPLO CORRETO

```typescript
import { TestBed } from '@angular/core/testing';
import { ApolloTestingModule, ApolloTestingController } from 'apollo-angular/testing';
import gql from 'graphql-tag';
import { UserGraphqlService } from './user-graphql.service';

const GET_USERS_QUERY = gql`
  query GetUsers($limit: Int) {
    users(limit: $limit) { id name email }
  }
`;

const CREATE_USER_MUTATION = gql`
  mutation CreateUser($input: UserInput!) {
    createUser(input: $input) { id name email }
  }
`;

describe('UserGraphqlService (Apollo) - CORRETO', () => {
	let service: UserGraphqlService;
	let controller: ApolloTestingController;

	beforeEach(() => {
		TestBed.configureTestingModule({
			imports: [ApolloTestingModule],
			providers: [UserGraphqlService]
		});

		service = TestBed.inject(UserGraphqlService);
		controller = TestBed.inject(ApolloTestingController);
	});

	afterEach(() => {
		controller.verify();
	});

	it('should fetch users with correct query and variables', () => {
		const mockUsers = [{ id: '1', name: 'Alice', email: 'alice@test.com' }];
		const limit = 10;

		service.getUsers(limit).subscribe(({ data }) => {
			expect(data.users).toEqual(mockUsers);
		});

		// ✅ Valida a query e as variáveis
		const op = controller.expectOne(GET_USERS_QUERY);
		expect(op.operation.operationName).toBe('GetUsers');
		expect(op.operation.variables).toEqual({ limit });

		op.flush({ data: { users: mockUsers } });
	});

	it('should handle GraphQL errors correctly', () => {
		const limit = 10;

		service.getUsers(limit).subscribe({
			next: () => fail('Should have failed'),
			error: (error) => {
				expect(error.graphQLErrors).toHaveLength(1);
				expect(error.graphQLErrors[0].message).toBe('Access denied');
			}
		});

		const op = controller.expectOne(GET_USERS_QUERY);
		op.graphqlErrors([{ message: 'Access denied' }]);
	});

	it('should create user with correct mutation', () => {
		const input = { name: 'Bob', email: 'bob@test.com' };
		const mockResponse = { id: '2', ...input };

		service.createUser(input).subscribe(({ data }) => {
			expect(data.createUser).toEqual(mockResponse);
		});

		const op = controller.expectOne(CREATE_USER_MUTATION);
		expect(op.operation.variables.input).toEqual(input);

		op.flush({ data: { createUser: mockResponse } });
	});
});
```

### ❌ EXEMPLO INCORRETO

```typescript
describe('UserGraphqlService (Apollo) - INCORRETO', () => {
	let service: UserGraphqlService;
	let apollo: Apollo;

	beforeEach(() => {
		// ❌ Não usa ApolloTestingModule
		TestBed.configureTestingModule({
			imports: [ApolloModule], // ❌ Módulo real
			providers: [UserGraphqlService]
		});

		service = TestBed.inject(UserGraphqlService);
		apollo = TestBed.inject(Apollo);
	});

	it('should fetch users', () => {
		// ❌ Mock manual do Apollo
		jest.spyOn(apollo, 'watchQuery').mockReturnValue({
			valueChanges: of({ data: { users: [] } })
		} as any);

		service.getUsers(10).subscribe(result => {
			expect(result.data.users).toBeDefined();
		});

		// ❌ Não valida a query GraphQL
		// ❌ Não valida as variáveis
	});
});
```

---

## 🧮 3. Serviços com Lógica Pura

### ✅ EXEMPLO CORRETO

```typescript
// calculation.service.ts
@Injectable()
export class CalculationService {
	calculateTotal(items: { price: number; quantity: number }[]): number {
		return items.reduce((total, item) => total + (item.price * item.quantity), 0);
	}

	applyDiscount(total: number, discountPercent: number): number {
		if (discountPercent < 0 || discountPercent > 100) {
			throw new Error('Discount must be between 0 and 100');
		}
		return total * (1 - discountPercent / 100);
	}
}

// calculation.service.spec.ts
describe('CalculationService - CORRETO', () => {
	let service: CalculationService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [CalculationService]
		});
		service = TestBed.inject(CalculationService);
	});

	describe('calculateTotal', () => {
		it('should calculate total for multiple items', () => {
			const items = [
				{ price: 10, quantity: 2 },
				{ price: 5, quantity: 3 }
			];

			const result = service.calculateTotal(items);

			expect(result).toBe(35); // (10*2) + (5*3)
		});

		it('should return 0 for empty array', () => {
			expect(service.calculateTotal([])).toBe(0);
		});

		it('should handle single item', () => {
			const items = [{ price: 15, quantity: 1 }];
			expect(service.calculateTotal(items)).toBe(15);
		});
	});

	describe('applyDiscount', () => {
		it('should apply 20% discount correctly', () => {
			const result = service.applyDiscount(100, 20);
			expect(result).toBe(80);
		});

		it('should throw error for negative discount', () => {
			expect(() => service.applyDiscount(100, -10))
				.toThrow('Discount must be between 0 and 100');
		});

		it('should throw error for discount over 100%', () => {
			expect(() => service.applyDiscount(100, 150))
				.toThrow('Discount must be between 0 and 100');
		});
	});
});
```

### ❌ EXEMPLO INCORRETO

```typescript
describe('CalculationService - INCORRETO', () => {
	let service: CalculationService;

	beforeEach(() => {
		// ❌ Não usa TestBed
		service = new CalculationService();
	});

	it('should work', () => {
		// ❌ Teste muito vago
		const result = service.calculateTotal([{ price: 10, quantity: 1 }]);
		expect(result).toBeTruthy(); // ❌ Asserção inútil
	});

	it('should calculate something', () => {
		// ❌ Não testa casos extremos
		// ❌ Não valida o resultado específico
		const result = service.calculateTotal([{ price: 5, quantity: 2 }]);
		expect(result).toBeGreaterThan(0); // ❌ Muito genérico
	});

	// ❌ Não testa tratamento de erros
	// ❌ Não testa casos extremos (array vazio, valores zero)
});
```

---

## 🎯 4. Serviços com Dependências (Orquestração)

### ✅ EXEMPLO CORRETO

```typescript
// notification.service.ts
@Injectable()
export class NotificationService {
	constructor(
		private logger: LoggerService,
		private emailService: EmailService
	) {
	}

	async sendWelcomeEmail(user: User): Promise<boolean> {
		if (!user.email) {
			this.logger.warn('User has no email address', { userId: user.id });
			return false;
		}

		try {
			await this.emailService.send({
				to: user.email,
				subject: 'Welcome!',
				template: 'welcome',
				data: { name: user.name }
			});

			this.logger.info('Welcome email sent successfully', { userId: user.id });
			return true;
		} catch (error) {
			this.logger.error('Failed to send welcome email', { userId: user.id, error });
			return false;
		}
	}
}

// notification.service.spec.ts
describe('NotificationService - CORRETO', () => {
	let service: NotificationService;
	let mockLogger: jest.Mocked<LoggerService>;
	let mockEmailService: jest.Mocked<EmailService>;

	beforeEach(() => {
		// ✅ Cria mocks tipados
		mockLogger = {
			info: jest.fn(),
			warn: jest.fn(),
			error: jest.fn()
		} as jest.Mocked<LoggerService>;

		mockEmailService = {
			send: jest.fn()
		} as jest.Mocked<EmailService>;

		TestBed.configureTestingModule({
			providers: [
				NotificationService,
				{ provide: LoggerService, useValue: mockLogger },
				{ provide: EmailService, useValue: mockEmailService }
			]
		});

		service = TestBed.inject(NotificationService);
	});

	it('should send welcome email successfully', async () => {
		const user = { id: 1, name: 'Alice', email: 'alice@test.com' };
		mockEmailService.send.mockResolvedValue(undefined);

		const result = await service.sendWelcomeEmail(user);

		expect(result).toBe(true);
		expect(mockEmailService.send).toHaveBeenCalledWith({
			to: 'alice@test.com',
			subject: 'Welcome!',
			template: 'welcome',
			data: { name: 'Alice' }
		});
		expect(mockLogger.info).toHaveBeenCalledWith(
			'Welcome email sent successfully',
			{ userId: 1 }
		);
	});

	it('should return false when user has no email', async () => {
		const user = { id: 1, name: 'Bob', email: '' };

		const result = await service.sendWelcomeEmail(user);

		expect(result).toBe(false);
		expect(mockEmailService.send).not.toHaveBeenCalled();
		expect(mockLogger.warn).toHaveBeenCalledWith(
			'User has no email address',
			{ userId: 1 }
		);
	});

	it('should handle email service errors', async () => {
		const user = { id: 1, name: 'Charlie', email: 'charlie@test.com' };
		const error = new Error('SMTP Error');
		mockEmailService.send.mockRejectedValue(error);

		const result = await service.sendWelcomeEmail(user);

		expect(result).toBe(false);
		expect(mockLogger.error).toHaveBeenCalledWith(
			'Failed to send welcome email',
			{ userId: 1, error }
		);
	});
});
```

### ❌ EXEMPLO INCORRETO

```typescript
describe('NotificationService - INCORRETO', () => {
	let service: NotificationService;

	beforeEach(() => {
		// ❌ Não mocka as dependências adequadamente
		TestBed.configureTestingModule({
			providers: [
				NotificationService,
				LoggerService, // ❌ Usa serviço real
				EmailService   // ❌ Usa serviço real
			]
		});

		service = TestBed.inject(NotificationService);
	});

	it('should send email', async () => {
		const user = { id: 1, name: 'Alice', email: 'alice@test.com' };

		// ❌ Spy depois de chamar o método
		const result = await service.sendWelcomeEmail(user);

		jest.spyOn(service['emailService'], 'send'); // ❌ Spy tardio e privado

		expect(result).toBeTruthy(); // ❌ Asserção vaga
		// ❌ Não valida chamadas para dependências
	});

	// ❌ Não testa casos de erro
	// ❌ Não testa validações
	// ❌ Não verifica logs
});
```

---

## 🌊 5. Serviços Reativos com RxJS

### ✅ EXEMPLO CORRETO

```typescript
// search.service.ts
@Injectable()
export class SearchService {
	private searchTerms = new Subject<string>();

	search$ = this.searchTerms.pipe(
		debounceTime(300),
		distinctUntilChanged(),
		switchMap(term => term ? this.performSearch(term) : of([]))
	);

	setSearchTerm(term: string): void {
		this.searchTerms.next(term);
	}

	private performSearch(term: string): Observable<string[]> {
		// Simulação de busca
		return of(['result1', 'result2']).pipe(delay(100));
	}
}

// search.service.spec.ts
import { TestScheduler } from 'rxjs/testing';

describe('SearchService - CORRETO', () => {
	let service: SearchService;
	let testScheduler: TestScheduler;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SearchService]
		});

		service = TestBed.inject(SearchService);

		// ✅ Usa TestScheduler para testes síncronos de RxJS
		testScheduler = new TestScheduler((actual, expected) => {
			expect(actual).toEqual(expected);
		});
	});

	it('should debounce search terms', () => {
		testScheduler.run(({ hot, expectObservable }) => {
			// ✅ Simula entrada com marble testing
			const input = hot('a-b-c---|', {
				a: 'term1',
				b: 'term2',
				c: 'term3'
			});

			// ✅ Spy no método privado usando qualquer
			jest.spyOn(service as any, 'performSearch')
				.mockReturnValue(of(['mocked']));

			input.subscribe(term => service.setSearchTerm(term));

			// ✅ Testa o comportamento do debounce
			expectObservable(service.search$).toBe('---a---|', {
				a: ['mocked'] // Apenas o último termo após debounce
			});
		});
	});

	it('should return empty array for empty search term', (done) => {
		service.setSearchTerm('');

		service.search$.subscribe(results => {
			expect(results).toEqual([]);
			done();
		});
	});

	it('should handle multiple subscribers', () => {
		const results1: string[][] = [];
		const results2: string[][] = [];

		service.search$.subscribe(r => results1.push(r));
		service.search$.subscribe(r => results2.push(r));

		service.setSearchTerm('test');

		setTimeout(() => {
			expect(results1).toEqual(results2);
		}, 500);
	});
});
```

### ❌ EXEMPLO INCORRETO

```typescript
describe('SearchService - INCORRETO', () => {
	let service: SearchService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [SearchService]
		});
		service = TestBed.inject(SearchService);
	});

	it('should search', () => {
		// ❌ Não considera debounceTime
		service.setSearchTerm('test');

		service.search$.subscribe(results => {
			expect(results).toBeDefined(); // ❌ Asserção inútil
		});

		// ❌ Não espera o debounce
		// ❌ Teste pode falhar aleatoriamente
	});

	it('should work with observables', (done) => {
		// ❌ Não usa TestScheduler para controle temporal
		service.setSearchTerm('a');
		service.setSearchTerm('b');
		service.setSearchTerm('c');

		// ❌ setTimeout arbitrário
		setTimeout(() => {
			service.search$.subscribe(results => {
				expect(results.length).toBeGreaterThan(0);
				done();
			});
		}, 1000); // ❌ Tempo fixo pode ser insuficiente
	});
});
```

---

## 📝 Resumo das Melhores Práticas

### ✅ O que FAZER:

- **Use TestBed.inject()** para obter instâncias
- **Mocke todas as dependências externas** (HttpClient, Apollo, outros serviços)
- **Valide requisições HTTP/GraphQL** completas (URL, método, payload, headers)
- **Teste casos de erro** e validações
- **Use TestScheduler** para operadores RxJS temporais
- **Faça asserções específicas** sobre resultados esperados
- **Teste casos extremos** (arrays vazios, valores null/undefined)

### ❌ O que NÃO fazer:

- **Não use módulos reais** (HttpClientModule, ApolloModule) nos testes
- **Não faça spies tardios** ou em propriedades privadas
- **Não use setTimeout** desnecessariamente em testes de RxJS
- **Não faça asserções vagas** (`toBeTruthy()`, `toBeDefined()`)
- **Não teste implementação interna** - foque no comportamento público
- **Não esqueça de testar casos de erro** e validações

---

## 🎯 Conclusão

Testes de serviços bem estruturados garantem que sua aplicação Angular seja robusta e confiável. Lembre-se sempre de:

1. **Isolar dependências** através de mocks apropriados
2. **Testar comportamentos** esperados, não implementação
3. **Cobrir casos de sucesso e erro**
4. **Usar ferramentas específicas** para cada tipo de teste (HttpTestingController, ApolloTestingController, TestScheduler)

Com essas práticas, seus testes serão mais confiáveis, maintíveis e úteis para detectar regressões!
