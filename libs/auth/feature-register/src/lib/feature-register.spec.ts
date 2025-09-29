import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FeatureRegister } from './feature-register';

describe('FeatureRegister', () => {
	let component: FeatureRegister;
	let fixture: ComponentFixture<FeatureRegister>;

	beforeEach(async () => {
		await TestBed.configureTestingModule({
			imports: [FeatureRegister]
		}).compileComponents();

		fixture = TestBed.createComponent(FeatureRegister);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
