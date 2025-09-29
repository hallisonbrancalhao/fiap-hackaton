import { ComponentFixture, TestBed } from '@angular/core/testing';
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
    await TestBed.configureTestingModule({
      imports: [
        HeaderComponent, // Import the standalone component
        MenubarModule,   // Import real PrimeNG module
        ButtonModule,    // Import real PrimeNG module
        RouterTestingModule, // For routerLink
      ],
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
      const expectedItemCount = 4;
      // Assert
      expect(component.items().length).toBe(expectedItemCount);
      expect(component.items()[0].label).toBe('Início');
    });
  });

  describe('Template Rendering and Integration', () => {
    let menubarDebugElement: DebugElement;
    let buttonDebugElement: DebugElement;

    beforeEach(() => {
      fixture.detectChanges(); // Render the template and its children
      menubarDebugElement = fixture.debugElement.query(By.css('p-menubar'));
      buttonDebugElement = fixture.debugElement.query(By.css('p-button'));
    });

    it('should render the PrimeNG menubar', () => {
      expect(menubarDebugElement).not.toBeNull();
    });

    it('should bind the menu items to the p-menubar `model` property', () => {
      const menubarInstance = menubarDebugElement.componentInstance;
      expect(menubarInstance.model).toEqual(component.items());
    });

    it('should render the logo image with a router link to the root', () => {
      const logoLink = fixture.debugElement.query(By.css('a[routerLink="/"]'));
      const logoImg = logoLink.query(By.css('img[alt="Logo"]'));

      expect(logoLink).toBeTruthy();
      expect(logoImg).toBeTruthy();
      expect(logoImg.attributes['src']).toBe('logo.svg');
    });

    it('should render the PrimeNG login button with correct properties', () => {
      expect(buttonDebugElement).not.toBeNull();

      const buttonInstance = buttonDebugElement.componentInstance;
      expect(buttonInstance.label).toBe('Login');
      expect(buttonInstance.icon).toBe('pi pi-user');
      expect(buttonInstance.size).toBe('small');
    });
  });
});
