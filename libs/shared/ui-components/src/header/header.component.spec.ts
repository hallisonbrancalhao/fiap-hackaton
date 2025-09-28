import { ComponentFixture, TestBed } from '@angular/core/testing';
import { HeaderComponent } from './header.component';
import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';

describe('HeaderComponent', () => {
  let component: HeaderComponent;
  let fixture: ComponentFixture<HeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should render the logo with the correct text', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.text-green-500')?.textContent).toContain('FIAP FARM');
  });

  it('should render the login and sair links', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('a[href="#"]')?.textContent).toContain('Login');
    expect(compiled.querySelectorAll('a[href="#"]')[1]?.textContent).toContain('Sair');
  });
});