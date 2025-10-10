import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { FeatureLogin } from './feature-login';

describe('FeatureLogin', () => {
	let component: FeatureLogin;
	let fixture: ComponentFixture<FeatureLogin>;

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
			imports: [FeatureLogin],
			providers: [
				{ provide: Firestore, useValue: mockFirestore },
				{ provide: Auth, useValue: mockAuth }
			]
		}).compileComponents();

		fixture = TestBed.createComponent(FeatureLogin);
		component = fixture.componentInstance;
		fixture.detectChanges();
	});

	it('should create', () => {
		expect(component).toBeTruthy();
	});
});
