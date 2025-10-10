import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { FeatureRegister } from './feature-register';

describe('FeatureRegister', () => {
	let component: FeatureRegister;
	let fixture: ComponentFixture<FeatureRegister>;

	beforeEach(async () => {
		const mockFirestore = {
			collection: jest.fn(),
			doc: jest.fn(),
		};

		const mockAuth = {
			currentUser: null,
			onAuthStateChanged: jest.fn(),
		};

		await TestBed.configureTestingModule({
			imports: [FeatureRegister],
			providers: [
				{ provide: Firestore, useValue: mockFirestore },
				{ provide: Auth, useValue: mockAuth }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(FeatureRegister);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
