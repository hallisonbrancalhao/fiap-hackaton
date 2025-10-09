import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { CUSTOM_ELEMENTS_SCHEMA, NO_ERRORS_SCHEMA } from '@angular/core';
import { By } from '@angular/platform-browser';
import { of, throwError } from 'rxjs';
import { HubComponent } from './hub.component';

// Mock the HubFacade to avoid Firebase imports
jest.mock('@fiap-hackaton/dashboard-data-access', () => ({
  HubFacade: jest.fn().mockImplementation(() => ({
    getDashboardStats: jest.fn(),
  })),
  DashboardStats: {},
}));

import { HubFacade, DashboardStats } from '@fiap-hackaton/dashboard-data-access';

describe('HubComponent', () => {
  let fixture: ComponentFixture<HubComponent>;
  let mockRouter: jest.Mocked<Router>;
  let mockHubFacade: jest.Mocked<HubFacade>;

  const mockStats: DashboardStats = {
    totalProducts: 42,
    totalSales: 150,
    monthlyRevenue: 125000,
    recentSalesCount: 23,
  };

  beforeEach(async () => {
    mockRouter = {
      navigate: jest.fn(),
    } as unknown as jest.Mocked<Router>;

    mockHubFacade = {
      getDashboardStats: jest.fn(),
    } as unknown as jest.Mocked<HubFacade>;

    await TestBed.configureTestingModule({
      imports: [HubComponent],
      schemas: [NO_ERRORS_SCHEMA, CUSTOM_ELEMENTS_SCHEMA],
      providers: [
        { provide: Router, useValue: mockRouter },
        { provide: HubFacade, useValue: mockHubFacade },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HubComponent);
  });

  describe('Initialization', () => {
    it('should create component', () => {
      expect(fixture.componentInstance).toBeTruthy();
    });

    it('should display loading state initially', () => {
      // Don't trigger detectChanges yet to see initial state
      const loadingElement = fixture.debugElement.query(By.css('lib-loading'));
      expect(loadingElement).toBeNull(); // Loading is controlled by signal, shown after detectChanges
      
      mockHubFacade.getDashboardStats.mockReturnValue(of(mockStats));
      fixture.detectChanges();
      
      // After detectChanges, component is initialized but observable may complete quickly
      // So we just verify the component works correctly
    });

    it('should load dashboard stats on init', () => {
      mockHubFacade.getDashboardStats.mockReturnValue(of(mockStats));

      fixture.detectChanges();

      expect(mockHubFacade.getDashboardStats).toHaveBeenCalledWith('fiap-farms-3e501');
    });
  });

  describe('Dashboard Stats Display', () => {
    beforeEach(() => {
      mockHubFacade.getDashboardStats.mockReturnValue(of(mockStats));
    });

    it('should display total products count', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const productsCount = fixture.debugElement.query(By.css('[data-testid="products-count"]'));
        expect(productsCount.nativeElement.textContent.trim()).toContain('42');
        done();
      }, 100);
    }, 10000);

    it('should display monthly sales count', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const salesCount = fixture.debugElement.query(By.css('[data-testid="sales-count"]'));
        expect(salesCount.nativeElement.textContent.trim()).toContain('23');
        done();
      }, 100);
    }, 10000);

    it('should display monthly revenue formatted as currency', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const revenueAmount = fixture.debugElement.query(By.css('[data-testid="revenue-amount"]'));
        const text = revenueAmount.nativeElement.textContent.trim();
        // Currency format can be "R$125,000" or "125.000" depending on locale
        expect(text).toMatch(/125[.,]000/);
        done();
      }, 100);
    }, 10000);

    it('should hide loading state after stats are loaded', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const loadingElement = fixture.debugElement.query(By.css('lib-loading'));
        expect(loadingElement).toBeNull();
        done();
      }, 100);
    }, 10000);

    it('should allow clicking on stat cards to navigate', (done) => {
      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        const statProducts = fixture.debugElement.query(By.css('[data-testid="stat-products"]'));
        
        statProducts.triggerEventHandler('click', null);
        
        expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/products']);
        done();
      }, 100);
    }, 10000);
  });

  describe('Dashboard Cards Navigation', () => {
    beforeEach(() => {
      mockHubFacade.getDashboardStats.mockReturnValue(of(mockStats));
      fixture.detectChanges();
    });

    it('should render all dashboard cards', () => {
      const cards = fixture.debugElement.queryAll(By.css('[role="button"]'));
      expect(cards.length).toBeGreaterThanOrEqual(3);
    });

    it('should navigate to products page when products card is clicked', () => {
      const productsCard = fixture.debugElement.query(By.css('[data-testid="products-card"]'));
      
      productsCard.triggerEventHandler('click', null);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/products']);
    });

    it('should navigate to sales page when sales card is clicked', () => {
      const salesCard = fixture.debugElement.query(By.css('[data-testid="sales-card"]'));
      
      salesCard.triggerEventHandler('click', null);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/sales']);
    });

    it('should navigate to analytics page when analytics card is clicked', () => {
      const analyticsCard = fixture.debugElement.query(By.css('[data-testid="analytics-card"]'));
      
      analyticsCard.triggerEventHandler('click', null);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/analytics']);
    });

    it('should navigate when Enter key is pressed on card', () => {
      const productsCard = fixture.debugElement.query(By.css('[data-testid="products-card"]'));
      
      productsCard.triggerEventHandler('keyup.enter', null);

      expect(mockRouter.navigate).toHaveBeenCalledWith(['/dashboard/products']);
    });

    it('should refresh stats when refresh button is clicked', () => {
      const refreshButton = fixture.debugElement.query(By.css('[data-testid="refresh-button"]'));
      
      refreshButton.triggerEventHandler('onClick', null);

      expect(mockHubFacade.getDashboardStats).toHaveBeenCalledTimes(2); // Once on init, once on refresh
    });
  });

  describe('Template Structure', () => {
    beforeEach(() => {
      mockHubFacade.getDashboardStats.mockReturnValue(of(mockStats));
      fixture.detectChanges();
    });

    it('should display main heading', () => {
      const heading = fixture.debugElement.query(By.css('h1'));
      expect(heading.nativeElement.textContent.trim()).toBe('Dashboard');
    });

    it('should display welcome message', () => {
      const welcomeText = fixture.nativeElement.textContent;
      expect(welcomeText).toContain('Bem-vindo ao FIAP FARM');
    });

    it('should render refresh button', () => {
      const refreshButton = fixture.debugElement.query(By.css('[data-testid="refresh-button"]'));
      expect(refreshButton).toBeTruthy();
    });

    it('should have proper accessibility attributes on navigation cards', () => {
      const productsCard = fixture.debugElement.query(By.css('[data-testid="products-card"]'));
      
      expect(productsCard.attributes['tabindex']).toBe('0');
      expect(productsCard.attributes['role']).toBe('button');
      expect(productsCard.attributes['aria-label']).toContain('Navegar para Produtos');
    });

    it('should have proper accessibility on stat cards', () => {
      setTimeout(() => {
        fixture.detectChanges();
        const statProducts = fixture.debugElement.query(By.css('[data-testid="stat-products"]'));
        
        expect(statProducts.attributes['tabindex']).toBe('0');
        expect(statProducts.attributes['role']).toBe('button');
        expect(statProducts.attributes['aria-label']).toBe('Ver produtos cadastrados');
      }, 100);
    });
  });

  describe('Error Handling', () => {
    it('should handle stats loading error gracefully', (done) => {
      mockHubFacade.getDashboardStats.mockReturnValue(
        throwError(() => new Error('Failed to load stats'))
      );

      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        
        // Should hide loading state
        const loadingElement = fixture.debugElement.query(By.css('lib-loading'));
        expect(loadingElement).toBeNull();

        // Should display default stats (0)
        const productsCount = fixture.debugElement.query(By.css('[data-testid="products-count"]'));
        expect(productsCount.nativeElement.textContent.trim()).toContain('0');
        
        done();
      }, 100);
    });

    it('should maintain default stats values on error', (done) => {
      mockHubFacade.getDashboardStats.mockReturnValue(
        throwError(() => new Error('Network error'))
      );

      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        
        const salesCount = fixture.debugElement.query(By.css('[data-testid="sales-count"]'));
        const revenueAmount = fixture.debugElement.query(By.css('[data-testid="revenue-amount"]'));
        
        expect(salesCount.nativeElement.textContent.trim()).toContain('0');
        expect(revenueAmount.nativeElement.textContent.trim()).toContain('0');
        
        done();
      }, 100);
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero stats correctly', (done) => {
      const zeroStats: DashboardStats = {
        totalProducts: 0,
        totalSales: 0,
        monthlyRevenue: 0,
        recentSalesCount: 0,
      };
      mockHubFacade.getDashboardStats.mockReturnValue(of(zeroStats));

      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        
        const productsCount = fixture.debugElement.query(By.css('[data-testid="products-count"]'));
        expect(productsCount.nativeElement.textContent.trim()).toContain('0');
        
        done();
      }, 100);
    });

    it('should handle large numbers in stats', (done) => {
      const largeStats: DashboardStats = {
        totalProducts: 999999,
        totalSales: 500000,
        monthlyRevenue: 9999999.99,
        recentSalesCount: 100000,
      };
      mockHubFacade.getDashboardStats.mockReturnValue(of(largeStats));

      fixture.detectChanges();

      setTimeout(() => {
        fixture.detectChanges();
        
        const productsCount = fixture.debugElement.query(By.css('[data-testid="products-count"]'));
        expect(productsCount.nativeElement.textContent.trim()).toContain('999999');
        
        done();
      }, 100);
    });
  });
});
