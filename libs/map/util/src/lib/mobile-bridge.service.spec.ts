import { TestBed } from '@angular/core/testing';
import { MobileBridgeService } from './mobile-bridge.service';

describe('MobileBridgeService', () => {
	let service: MobileBridgeService;

	beforeEach(() => {
		TestBed.configureTestingModule({
			providers: [MobileBridgeService]
		});
		service = TestBed.inject(MobileBridgeService);
	});

	it('should be created', () => {
		expect(service).toBeTruthy();
	});

	describe('sendToNative', () => {
		it('should not throw error when ReactNativeWebView is not available', () => {
			expect(() => {
				service.sendToNative({ action: 'test' });
			}).not.toThrow();
		});
	});

	describe('sendAreaSelection', () => {
		it('should call sendToNative with correct action', () => {
			const spy = jest.spyOn(service, 'sendToNative');
			const selection = {
				coordinates: [],
				areaM2: 1000,
				areaHectares: 0.1
			};

			service.sendAreaSelection(selection);

			expect(spy).toHaveBeenCalledWith({
				action: 'areaSelected',
				data: selection
			});
		});
	});

	describe('notifyMapReady', () => {
		it('should call sendToNative with mapReady action', () => {
			const spy = jest.spyOn(service, 'sendToNative');

			service.notifyMapReady();

			expect(spy).toHaveBeenCalledWith({
				action: 'mapReady'
			});
		});
	});
});
