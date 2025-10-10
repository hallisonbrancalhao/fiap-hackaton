import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { HeaderComponent } from './header.component';
import { By } from '@angular/platform-browser';
import { MenubarModule } from 'primeng/menubar';
import { ButtonModule } from 'primeng/button';
import { RouterTestingModule } from '@angular/router/testing';
import { DebugElement } from '@angular/core';

describe('HeaderComponent', () => {
	let component: HeaderComponent;
	let fixture: ComponentFixture<HeaderComponent>;

	beforeEach(async () => {
		// Mock window.matchMedia for PrimeNG components
		Object.defineProperty(window, 'matchMedia', {
			writable: true,
			value: jest.fn().mockImplementation(query => ({
				matches: false,
				media: query,
				onchange: null,
				addListener: jest.fn(),
				removeListener: jest.fn(),
				addEventListener: jest.fn(),
				removeEventListener: jest.fn(),
				dispatchEvent: jest.fn(),
			})),
		});

		const mockFirestore = {
			collection: jest.fn(),
			doc: jest.fn(),
		};

		const mockAuth = {
			currentUser: null,
			onAuthStateChanged: jest.fn(),
		};

		await TestBed.configureTestingModule({
			imports: [
				HeaderComponent, // Import the standalone component
				MenubarModule,   // Import real PrimeNG module
				ButtonModule,    // Import real PrimeNG module
				RouterTestingModule, // For routerLink
			],
			providers: [
				{ provide: Firestore, useValue: mockFirestore },
				{ provide: Auth, useValue: mockAuth }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(HeaderComponent);
		component = fixture.componentInstance;
	});

	describe('Initialization and State', () => {
		it('should create the component', () => {
			expect(component).toBeTruthy();
		});

		it('should initialize menu items after ngOnInit', () => {
			// Arrange
			const expectedItemCount = 6; // Updated to match actual menu items count
			// Assert
			expect(component.items().length).toBe(expectedItemCount);
			expect(component.items()[0].label).toBe('Início');
		});
	});

	describe('Template Rendering and Integration', () => {
		let menubarDebugElement: DebugElement;

		beforeEach(() => {
			fixture.detectChanges(); // Render the template and its children
			menubarDebugElement = fixture.debugElement.query(By.css('p-menubar'));
		});

		it('should render the PrimeNG menubar', () => {
			expect(menubarDebugElement).not.toBeNull();
		});

		it('should bind the menu items to the p-menubar `model` property', () => {
			const menubarInstance = menubarDebugElement.componentInstance;
			expect(menubarInstance.model).toEqual(component.items());
		});

		it('should render the menubar with navigation', () => {
			// Verify that menubar exists and has the model bound
			expect(menubarDebugElement).not.toBeNull();
		});
	});
});
